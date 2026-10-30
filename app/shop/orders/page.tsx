"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LogOut,
  Search,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";
import { fetchMyOrders, fetchMyOrderRequests, imgUrl } from "../api";
import { useAuth } from "../auth";
import { useShop } from "../shop-data";
import ProductCard from "../components/ProductCard";
import FastestBadge from "../components/FastestBadge";
import { actionError, cancelOrderItem } from "../order-actions";
import { rawOrderItems } from "../order-items";

type Decision = "APPROVED" | "REJECTED";
type StatusGroup = "PROCESSING" | "APPROVED" | "DELIVERED" | "REJECTED" | "CANCELED";
type ReqType = "RETURN" | "REPLACE" | "REFUND";

type Line = {
  title: string;
  image?: string;
  quantity: number;
  price?: number;
  mrp?: number;
  productId?: string;
  lineId?: string;
  cancelled?: boolean;
  decision?: Decision;
  remarks?: string;
  cancelledBy?: string;
  fastest?: boolean;
  madeFor?: boolean;
  productType?: string;
  isReturnable?: boolean;
  isReplaceable?: boolean;
  isRefundable?: boolean;
  returnDays?: number | null;
  replaceDays?: number | null;
  refundDays?: number | null;
};

type OrderView = {
  id: string;
  orderNumber: string;
  date: string;
  createdAtMs?: number;
  status: string;
  total: number;
  lines: Line[];
  cancelledBy?: string;
  paymentStatus?: string;
  bookingDate?: string;
  bookingDateMs?: number;
  deliveredAtMs?: number;
  estimatedDelivery?: string;
  steps: { label: string; date: string }[];
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;
const CANCEL_WINDOW_DAYS = 10;
const money = (n: number) => `₹${n.toFixed(2)}`;

const textValue = (v: unknown, fallback: string) =>
  typeof v === "string" || typeof v === "number" ? String(v) : fallback;

function fmtDate(value: unknown): string {
  if (!value) return "";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function historyDate(history: any[], status: string): string {
  const entry = [...history].reverse().find((h) => String(h?.status).toUpperCase() === status);
  if (!entry) return "";
  return fmtDate(entry.date ?? entry.changedAt ?? entry.updatedAt ?? entry.createdAt ?? entry.timestamp ?? entry.at);
}

const STEP_FLOW = [
  { status: "PENDING", label: "Order placed" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "SHIPPED", label: "Shipped" },
  { status: "DELIVERED", label: "Delivered" },
];

function buildSteps(orderStatus: string, history: any[], placed: unknown) {
  const reached =
    orderStatus === "APPROVED" ? 1 : STEP_FLOW.findIndex((s) => s.status === orderStatus);
  if (reached < 0) return [];
  return STEP_FLOW.slice(0, reached + 1).map((s) => ({
    label: s.label,
    date: historyDate(history, s.status) || (s.status === "PENDING" ? fmtDate(placed) : ""),
  }));
}

function readDecision(obj?: any): { decision?: Decision; remarks?: string } {
  if (!obj) return {};
  const raw = String(obj.approvalStatus ?? obj.decision ?? obj.status ?? "").toUpperCase();
  const decision = raw === "APPROVED" || raw === "REJECTED" ? (raw as Decision) : undefined;
  const remarks = textValue(obj.remarks ?? obj.remark, "");
  return { decision, remarks: remarks || undefined };
}

function lineFromValue(value: any, catalog: any[]): Line | null {
  if (typeof value === "string") {
    const p = catalog.find((x) => x.slug === value);
    return p
      ? { title: p.name, image: p.image, price: p.price, quantity: 1, productId: p.slug }
      : { title: "Product unavailable", quantity: 1, productId: value };
  }
  if (!value || typeof value !== "object") return null;
  const item = value;
  const pv = item.product ?? item.productDetails ?? item.productId;
  const product: any = typeof pv === "string" ? catalog.find((x) => x.slug === pv) : pv;
  const productId =
    typeof pv === "string" ? pv : product?._id ?? product?.slug ?? (typeof item.productId === "string" ? item.productId : undefined);
  const catalogRaw = productId ? catalog.find((x) => x.slug === String(productId))?.raw : undefined;
  const rawProduct: any = product?.raw ?? catalogRaw ?? product ?? {};
  const price = Number(item.offerPrice ?? item.price ?? item.productPrice ?? product?.price);
  const mrp = Number(item.mrp ?? product?.originalPrice ?? product?.mrp ?? price);
  return {
    title: textValue(item.title ?? item.name ?? product?.title ?? product?.name, product ? "Product" : "Product unavailable"),
    image: item.image ?? product?.image ?? product?.images?.[0],
    quantity: Number(item.quantity ?? item.qty ?? 1) || 1,
    price: Number.isFinite(price) ? price : undefined,
    mrp: Number.isFinite(mrp) ? mrp : undefined,
    productId: productId ? String(productId) : undefined,
    lineId: typeof item._id === "string" ? item._id : undefined,
    cancelled: ["CANCELLED", "CANCELED"].includes(String(item.status ?? item.itemStatus ?? "").toUpperCase()),
    fastest: Boolean(rawProduct.fastestDelivery ?? item.fastestDelivery),
    madeFor: Boolean(rawProduct.isMadeForProduct ?? item.isMadeForProduct),
    productType: item.productType ?? rawProduct.productType,
    isReturnable: item.isReturnable ?? rawProduct.isReturnable,
    isReplaceable: item.isReplaceable ?? rawProduct.isReplaceable,
    isRefundable: item.isRefundable ?? rawProduct.isRefundable,
    returnDays: item.returnDays ?? rawProduct.returnDays,
    replaceDays: item.replaceDays ?? rawProduct.replaceDays,
    refundDays: item.refundDays ?? rawProduct.refundDays,
    ...readDecision(item),
  };
}

function toOrderView(record: any, index: number, catalog: any[]): OrderView {
  const items = rawOrderItems(record);
  const rawLines = (items.length ? items : record.product ? [record.product] : [])
    .map((v: any) => lineFromValue(v, catalog))
    .filter((l: Line | null): l is Line => Boolean(l));

  const orderDecision = readDecision(record);
  const orderStatus = String(record.status ?? record.orderStatus ?? "").toUpperCase();
  const history: any[] = Array.isArray(record.statusHistory) ? record.statusHistory : [];
  const confirmedNote = [...history].reverse().find((h) => String(h?.status).toUpperCase() === "CONFIRMED")?.note;
  const backendRemarks =
    orderStatus === "CANCELLED"
      ? textValue(record.cancelReason, "").trim()
      : ["CONFIRMED", "SHIPPED", "DELIVERED"].includes(orderStatus)
        ? textValue(confirmedNote, "").trim()
        : "";
  const cancelledBy = typeof record.cancelledBy === "string" ? record.cancelledBy : undefined;

  const lines: Line[] = rawLines.map((l: Line) => ({
    ...l,
    decision: l.decision ?? orderDecision.decision,
    remarks: l.remarks ?? orderDecision.remarks ?? (backendRemarks || undefined),
    cancelledBy,
  }));

  const dateValue = record.createdAt ?? record.orderDate ?? record.date;
  const date = dateValue
    ? (() => {
        const d = new Date(String(dateValue));
        const p = (n: number) => String(n).padStart(2, "0");
        return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)}`;
      })()
    : "RECENT ORDER";

  const totalValue =
    [record.totalAmount, record.totalPrice, record.total, record.grandTotal, record.quote?.total]
      .map(Number)
      .find((n) => Number.isFinite(n) && n > 0) ??
    lines.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0);

  const ms = (v: unknown) => {
    const t = v ? new Date(String(v)).getTime() : NaN;
    return Number.isNaN(t) ? undefined : t;
  };
  const bm = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(record.bookingDate ?? ""));
  const bookingDateMs = bm ? new Date(+bm[1], +bm[2] - 1, +bm[3]).getTime() : undefined;
  const deliveredEntry = [...history].reverse().find((h) => String(h?.status).toUpperCase() === "DELIVERED");
  const deliveredAtMs = ms(record.deliveredAt ?? record.deliveredDate ?? deliveredEntry?.date ?? deliveredEntry?.createdAt ?? deliveredEntry?.at);

  // single-item orders: the quoted total is the item's price
  const pricedLines =
    lines.length === 1 && !((lines[0].price ?? 0) > 0) && totalValue > 0
      ? [{ ...lines[0], price: totalValue / lines[0].quantity, mrp: undefined }]
      : lines;

  return {
    id: textValue(record._id ?? record.orderId ?? record.orderNumber, `ORDER-${index + 1}`),
    orderNumber: textValue(record.orderNumber ?? record.orderId ?? record._id, ""),
    date,
    createdAtMs: dateValue ? new Date(String(dateValue)).getTime() : undefined,
    status: orderStatus || "PROCESSING",
    total: Number.isFinite(totalValue) ? totalValue : 0,
    lines: pricedLines,
    cancelledBy,
    paymentStatus: textValue(record.paymentStatus, ""),
    bookingDate: bm ? fmtDate(new Date(+bm[1], +bm[2] - 1, +bm[3])) : "",
    bookingDateMs,
    deliveredAtMs,
    estimatedDelivery: fmtDate(
      record.expectedDelivery ?? record.expectedDeliveryDate ?? record.estimatedDelivery ?? record.estimatedDeliveryDate ?? record.deliveryDate,
    ),
    steps: buildSteps(orderStatus, history, dateValue),
  };
}

function unwrapOrders(payload: any): any[] {
  const value = payload?.data ?? payload;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.orders)) return value.orders;
  if (Array.isArray(value?.data?.orders)) return value.data.orders;
  return [];
}

function statusGroup(status: string, cancelledBy?: string): StatusGroup {
  const s = status.toUpperCase();
  if (s === "DELIVERED") return "DELIVERED";
  if (s === "APPROVED" || s === "CONFIRMED" || s === "SHIPPED") return "APPROVED";
  if (s === "REJECTED") return "REJECTED";
  if (s === "CANCELLED" || s === "CANCELED") return cancelledBy === "STORE" ? "REJECTED" : "CANCELED";
  return "PROCESSING";
}

const lineGroup = (order: OrderView, line: Line): StatusGroup => {
  if (line.cancelled) return "CANCELED";
  const g = statusGroup(order.status, order.cancelledBy);
  if (g === "DELIVERED") return "DELIVERED";
  return line.decision ?? g;
};

const TABS: { key: StatusGroup; label: string }[] = [
  { key: "PROCESSING", label: "Processing" },
  { key: "APPROVED", label: "Approved" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "REJECTED", label: "Rejected" },
  { key: "CANCELED", label: "Canceled" },
];

const cancelWindowOpen = (o: { createdAtMs?: number }) => {
  const t = o.createdAtMs;
  if (t === undefined || Number.isNaN(t)) return true;
  return Date.now() - t <= CANCEL_WINDOW_DAYS * DAY_MS;
};

const isPaid = (o: OrderView) =>
  ["PAID", "SUCCESS", "SUCCESSFUL", "COMPLETED", "CAPTURED"].includes((o.paymentStatus ?? "").toUpperCase());

// which of Return / Replace / Refund can still be requested for a delivered line
function requestTypes(order: OrderView, line: Line): ReqType[] {
  if (line.madeFor || order.bookingDate) return [];
  if (order.status !== "DELIVERED" || line.productType === "SERVICE") return [];
  const delivered = order.deliveredAtMs;
  const ok = (flag: boolean | undefined, days: number | null | undefined) =>
    flag === true && (days == null || delivered === undefined || Date.now() - delivered <= Number(days) * DAY_MS);
  const types: ReqType[] = [];
  if (ok(line.isReturnable, line.returnDays)) types.push("RETURN");
  if (ok(line.isReplaceable, line.replaceDays)) types.push("REPLACE");
  if (isPaid(order) && ok(line.isRefundable, line.refundDays)) types.push("REFUND");
  return types;
}

const LABEL: Record<ReqType, string> = { RETURN: "Return", REPLACE: "Replace", REFUND: "Refund" };

/* ---------- account sidebar ---------- */

function AccountSidebar({
  onLogout,
  user,
  signedIn,
  query,
  setQuery,
  activeTab,
  setActiveTab,
  menuOpen,
  setMenuOpen,
}: {
  onLogout: () => void;
  user: any;
  signedIn: boolean;
  query: string;
  setQuery: (v: string) => void;
  activeTab: StatusGroup;
  setActiveTab: (v: StatusGroup) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
}) {
  const name = textValue(user?.name ?? user?.fullName ?? user?.firstName, "User");
  const phone = textValue(user?.phone ?? user?.mobile ?? user?.phoneNumber, "");
  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Select Any";

  return (
    <aside className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="p-5 pb-0">
        <div className="rounded-xl border border-[#e5e7eb] p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold text-[#1f2430]">Hey, {name}</p>
              {phone && <p className="mt-1 truncate text-sm text-[#3c4150]">Logged with {phone}</p>}
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1a56db] text-xl font-bold text-white">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <p className="px-6 pb-3 pt-8 text-lg font-semibold text-[#1f2430]">Account</p>

      <nav>
        {/* Order ID: typing shows that order's products on the right */}
        <div className="flex items-center gap-4 border-t border-[#e5e7eb] bg-white px-6 py-5">
          <Search size={22} className="shrink-0 text-[#1f2430]" />
          <label className="min-w-0 flex-1">
            <span className="block text-lg font-medium text-[#1f2430]">Order ID</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Order ID"
              className="mt-1 block h-11 w-full rounded-lg border border-[#d9dce6] bg-white px-3 text-sm outline-none focus:border-[#a3161c]"
            />
          </label>
        </div>

        {/* My Orders */}
        <Link
          href="/shop/orders"
          className="flex items-center gap-4 border-t border-[#e5e7eb] bg-[#ececef] px-6 py-5"
        >
          <ShoppingBag size={22} className="shrink-0 text-[#1f2430]" />
          <span className="min-w-0 flex-1">
            <span className="block text-lg font-medium text-[#1f2430]">My Orders</span>
            <span className="block text-sm text-[#3c4150]">Track your recent purchases</span>
          </span>
          <ChevronRight size={20} className="shrink-0 text-[#1f2430]" />
        </Link>

        {/* Order Status: picking one shows those orders on the right */}
        <div className="border-t border-[#e5e7eb] bg-white">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-[#f6f6f8]"
          >
            <SlidersHorizontal size={22} className="shrink-0 text-[#1f2430]" />
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-medium text-[#1f2430]">Order Status</span>
              <span className="block text-sm text-[#3c4150]">{activeLabel}</span>
            </span>
            {menuOpen ? (
              <ChevronUp size={20} className="shrink-0 text-[#1f2430]" />
            ) : (
              <ChevronDown size={20} className="shrink-0 text-[#1f2430]" />
            )}
          </button>
          {menuOpen && (
            <div className="pb-2">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between py-3 pl-[70px] pr-6 text-left text-sm hover:bg-[#f6f6f8] ${
                    tab.key === activeTab ? "font-extrabold text-[#a3161c]" : "text-[#1f2430]"
                  }`}
                >
                  {tab.label}
                  {tab.key === activeTab && <Check size={16} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {signedIn && (
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 border-t border-[#e5e7eb] px-6 py-8 text-left text-lg font-medium text-[#c8161d]"
        >
          <LogOut size={22} />
          Logout
        </button>
      )}
    </aside>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const auth: any = useAuth();
  const { token, ready } = auth;
  const catalog = useShop((s) => s.products);

  const [records, setRecords] = useState<any[]>([]);
  const [requests, setRequests] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<StatusGroup>("PROCESSING");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<OrderView | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const load = useCallback(async () => {
    if (!token) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [result, reqs] = await Promise.all([fetchMyOrders(), fetchMyOrderRequests().catch(() => [])]);
      setRecords(unwrapOrders(result));
      const map: Record<string, any[]> = {};
      (Array.isArray(reqs) ? reqs : []).forEach((r: any) => {
        const oid = String(r.orderId?._id ?? r.orderId);
        (map[oid] ??= []).push(r);
      });
      setRequests(map);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? "Unable to load your orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const orders = useMemo(() => records.map((r, i) => toOrderView(r, i, catalog)), [records, catalog]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders
      .filter((o) => !q || o.id.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q))
      .map((o) => ({ ...o, lines: o.lines.filter((l) => lineGroup(o, l) === activeTab) }))
      .filter((o) => o.lines.length > 0);
  }, [orders, activeTab, query]);

  const activeLabel = TABS.find((t) => t.key === activeTab)?.label ?? "Select Any";

  const onCancelPress = (o: OrderView) => {
    if (!cancelWindowOpen(o)) return;
    // paid orders need the refund rules and bank details, which live on the details page
    if (isPaid(o)) {
      router.push(`/shop/orders/${encodeURIComponent(o.id)}`);
      return;
    }
    setCancelError("");
    setCancelTarget(o);
  };

  const confirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelBusy(true);
    setCancelError("");
    try {
      await cancelOrderItem(cancelTarget.id, "Changed my mind", {});
      setCancelTarget(null);
      await load();
    } catch (e) {
      setCancelError(actionError(e, "Could not cancel. Please try again."));
    } finally {
      setCancelBusy(false);
    }
  };

  const onLogout = async () => {
    try {
      const fn = auth?.logout ?? auth?.signOut;
      if (typeof fn === "function") await fn();
    } finally {
      router.push("/shop/login");
    }
  };

  if (!ready) {
    return <p className="py-20 text-center text-sm text-[#9a7a7a]">Loading your orders...</p>;
  }

  return (
    <main className="min-h-screen bg-[#e5e7eb] px-4 py-8 md:px-8">
      <div className="mx-auto grid max-w-[1240px] gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
        <AccountSidebar
          onLogout={() => void onLogout()}
          user={auth?.user}
          signedIn={!!token}
          query={query}
          setQuery={setQuery}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
        />

        {/* Right panel */}
        <section className="min-h-[700px] rounded-xl bg-white p-5 shadow-sm md:p-6">
          <h1 className="text-2xl font-semibold text-[#1f2430]">My Orders</h1>

          {!token && (
            <div className="mt-6 flex overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8f9fb]">
              <div className="grid w-28 shrink-0 place-items-center bg-[#e5e7eb] text-[#9aa0b4] sm:w-32">
                <ShoppingBag size={36} />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-[#1f2430]">Your orders live here</h2>
                <p className="mt-2 text-sm text-[#3c4150]">Sign in to see orders created with your account.</p>
                <Link href="/shop/login?next=/shop/orders" className="shop-gold-btn mt-4 inline-block rounded-full px-6 py-3">
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {token && loading && <p className="py-12 text-center text-sm text-[#9a7a7a]">Loading your orders...</p>}

          {!!error && (
            <div className="mt-6 rounded-lg border border-[#e5e7eb] bg-[#f8f9fb] p-6">
              <h2 className="text-lg font-semibold text-[#1f2430]">Orders could not load</h2>
              <p className="mt-2 text-sm text-[#3c4150]">{error}</p>
              <button onClick={() => void load()} className="mt-4 rounded-full border border-[#a3161c] px-6 py-2 text-sm font-bold text-[#a3161c]">
                Try again
              </button>
            </div>
          )}

          {token && !loading && !error && filtered.length === 0 && (
            <div className="mt-6 flex overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8f9fb]">
              <div className="grid w-28 shrink-0 place-items-center bg-[#e5e7eb] text-[#9aa0b4] sm:w-32">
                <ShoppingBag size={36} />
              </div>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-[#1f2430]">No {activeLabel.toLowerCase()} orders</h2>
                <p className="mt-2 text-sm text-[#3c4150]">
                  Orders in this category will appear here.{" "}
                  <Link href="/shop" className="text-[#1a56db] underline">
                    Shop Now
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Order cards: one per line */}
          <div className="mt-6 space-y-4">
            {filtered.map((order) =>
              order.lines.map((line, idx) => {
                const group = lineGroup(order, line);
                const paid = isPaid(order);
                const windowOpen = cancelWindowOpen(order);
                const canCancel = group === "PROCESSING" && windowOpen;
                const lineRequests = (requests[order.id] ?? []).filter(
                  (r) => !r.itemId || r.itemId === line.lineId || r.productId === line.productId,
                );
                const types = requestTypes(order, line);
                const image = imgUrl(line.image ?? "");
                const steps = order.steps;

                return (
                  <article
                    key={`${order.id}-line-${idx}`}
                    className="overflow-hidden rounded-lg border border-[#e5e7eb] bg-[#f8f9fb]"
                  >
                    <Link href={`/shop/orders/${encodeURIComponent(order.id)}`} className="flex items-stretch gap-4">
                      <div className="relative w-28 shrink-0 self-stretch bg-[#e5e7eb] sm:w-32" style={{ minHeight: 112 }}>
                        {image ? (
                          <Image src={image} alt={line.title} fill unoptimized className="object-contain p-2" />
                        ) : (
                          <span className="grid h-full place-items-center text-xs text-[#9a7a7a]">—</span>
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 gap-3 py-4 pr-4">
                        <div className="min-w-0 flex-1 space-y-1 self-center">
                          <p className="truncate text-lg font-medium text-[#1f2430]">
                            {line.title}
                            {line.quantity > 1 ? ` × ${line.quantity}` : ""}
                          </p>
                          <p className="truncate text-sm text-[#3c4150]">ID: {order.orderNumber || order.id}</p>
                          <p className="text-sm text-[#3c4150]">{order.date}</p>
                          {line.fastest && (group === "PROCESSING" || group === "APPROVED") && (
                            <div className="pt-1">
                              <FastestBadge compact />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end justify-between text-right">
                          <div className="space-y-0.5">
                            <p className="text-base font-semibold text-[#1f2430]">
                              {(line.price ?? 0) > 0 ? money((line.price ?? 0) * line.quantity) : "Price pending"}
                            </p>
                            {(line.price ?? 0) > 0 && line.quantity > 1 && (
                              <p className="text-[11px] text-[#7b8094]">{money(line.price ?? 0)} each</p>
                            )}
                            {line.mrp !== undefined && line.mrp > (line.price ?? 0) && (
                              <p className="text-[11px] font-semibold text-[#9aa0b4] line-through">
                                {money(line.mrp * line.quantity)}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-[#1a56db]">View details</span>
                        </div>
                      </div>
                    </Link>

                    <div className="space-y-3 px-4 pb-4 empty:hidden">
                      {(group === "APPROVED" || group === "REJECTED") && !!line.remarks && (
                        <div className={`space-y-0.5 rounded-lg p-3 ${group === "APPROVED" ? "bg-[#e9f5ee]" : "bg-[#fbeae6]"}`}>
                          <p className={`text-xs font-extrabold ${group === "APPROVED" ? "text-[#2e7d4f]" : "text-[#b84a36]"}`}>
                            {group === "APPROVED" ? "Approved" : line.cancelledBy === "USER" ? "Cancelled by you" : "Rejected"}
                          </p>
                          <p className="text-xs">Remarks: {line.remarks}</p>
                        </div>
                      )}

                      {(group === "PROCESSING" || group === "APPROVED" || group === "DELIVERED") && steps.length > 0 && (
                        <div className="rounded-lg bg-white p-3">
                          {steps.map((step, i) => {
                            const last = i === steps.length - 1;
                            return (
                              <div key={step.label} className="flex gap-2.5">
                                <div className="flex w-3 flex-col items-center">
                                  <span className={`mt-0.5 rounded-full ${last ? "h-3 w-3 bg-[#e0622d]" : "mt-1 h-2.5 w-2.5 bg-[#9aa0b4]"}`} />
                                  {!last && <span className="my-0.5 w-0.5 flex-1 bg-[#c9cdda]" />}
                                </div>
                                <div className={`flex-1 ${last ? "" : "pb-2"}`}>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-xs ${last ? "font-extrabold text-[#a3161c]" : "font-semibold text-[#7b8094]"}`}>
                                      {step.label}
                                    </span>
                                    {!!step.date && <span className="text-[11px] font-semibold text-[#7b8094]">{step.date}</span>}
                                  </div>
                                  {last && step.label === "Shipped" && !!order.estimatedDelivery && (
                                    <p className="mt-0.5 text-[11px]">Expected delivery: {order.estimatedDelivery}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {!!order.bookingDate && (
                        <div className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs">
                          <Calendar size={14} className="text-[#a3161c]" />
                          <span>
                            Booking date: <b className="text-[#a3161c]">{order.bookingDate}</b>
                          </span>
                        </div>
                      )}

                      {lineRequests.map((r, i) => (
                        <p key={i} className="text-[11px] font-medium text-[#7b8094]">
                          {String(r.type ?? "Request")[0] + String(r.type ?? "request").slice(1).toLowerCase()} request ·{" "}
                          {String(r.status ?? "PENDING").toLowerCase()}
                        </p>
                      ))}

                      {types.length > 0 && lineRequests.length === 0 && (
                        <Link
                          href={`/shop/orders/${encodeURIComponent(order.id)}`}
                          className="inline-block text-xs font-bold text-[#a3161c]"
                        >
                          {types.map((t) => LABEL[t]).join(" / ")} request
                        </Link>
                      )}

                      {((paid && idx === 0) || (canCancel && idx === 0)) && (
                        <div className="flex items-center justify-between">
                          {paid && idx === 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-lg bg-[#e9f5ee] px-2 py-0.5 text-[11px] font-extrabold text-[#2e7d4f]">
                              <CheckCircle2 size={12} /> Paid
                            </span>
                          ) : (
                            <span />
                          )}
                          {canCancel && idx === 0 && (
                            <button onClick={() => onCancelPress(order)} className="text-[11px] font-medium text-red-600 hover:underline">
                              Cancel Order
                            </button>
                          )}
                        </div>
                      )}

                      {group === "PROCESSING" && !windowOpen && (
                        <p className="text-[11px] font-medium text-[#7b8094]">
                          Orders can only be cancelled within {CANCEL_WINDOW_DAYS} days.
                        </p>
                      )}

                      {group === "CANCELED" && <p className="text-[11px] font-medium text-[#7b8094]">This order was canceled.</p>}
                    </div>
                  </article>
                );
              }),
            )}
          </div>
        </section>
      </div>

      {/* For You: full-width row under both panels */}
      {catalog.length > 0 && (
        <section className="mx-auto mt-8 max-w-[1240px]">
          <h2 className="text-xl font-semibold text-[#1f2430]">For You</h2>
          <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">
            {catalog.slice(0, 4).map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </div>
        </section>
      )}

      {/* Cancel confirm */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <h3 className="text-lg font-black">Cancel Order</h3>
            <p className="mt-2 text-sm text-[#5a3a3a]">
              Cancel order #{cancelTarget.orderNumber || cancelTarget.id}? All items in it will be cancelled.
            </p>
            {cancelError && <p className="mt-3 text-sm font-semibold text-red-600">{cancelError}</p>}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                disabled={cancelBusy}
                className="flex-1 rounded-full border border-[#e8cfa8] py-2.5 text-sm font-bold"
              >
                Keep order
              </button>
              <button
                onClick={() => void confirmCancel()}
                disabled={cancelBusy}
                className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {cancelBusy ? "Cancelling..." : "Cancel Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}