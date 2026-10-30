"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchMyOrder, fetchMyOrderRequests } from "../../api";
import { inr } from "../../data";
import {
  rawOrderItems,
  itemProductId,
  itemName,
  itemImage,
  itemQty,
} from "../../order-items";
import {
  ACTION_LABEL,
  REASON_CODE,
  cancelOrderItem,
  createItemRequest,
  type ActionKind,
} from "../../order-actions";
import type { BankDetails } from "../../order-requests";
import ReasonSheet from "../../components/ReasonSheet";

const HOUR = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR;
const CANCEL_WINDOW_DAYS = 10;

const unwrap = (v: any) => v?.data?.order ?? v?.order ?? v?.data ?? v;

const fmtDateTime = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};
const fmtDate = (v: unknown) => {
  if (!v) return "";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const statusStyle = (status: string, cancelledBy?: string) => {
  switch (status) {
    case "CANCELLED":
      return { label: cancelledBy === "USER" ? "Cancelled by you" : "Rejected by store", cls: "bg-red-100 text-red-700" };
    case "DELIVERED":
      return { label: "Delivered", cls: "bg-green-100 text-green-700" };
    case "SHIPPED":
      return { label: "Shipped", cls: "bg-blue-100 text-blue-700" };
    case "CONFIRMED":
      return { label: "Approved", cls: "bg-green-100 text-green-700" };
    default:
      return { label: "Processing", cls: "bg-orange-100 text-orange-700" };
  }
};

export default function OrderDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<{ kind: ActionKind; item: any } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderResult, requestResult] = await Promise.all([
        fetchMyOrder(id),
        fetchMyOrderRequests(id).catch(() => []),
      ]);
      setOrder(unwrap(orderResult));
      setRequests(Array.isArray(requestResult) ? requestResult : []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? "Unable to load this order. Please sign in and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !order) return <p className="py-20 text-center">Loading order details...</p>;

  if (error && !order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => void load()} className="mt-4 rounded-full border px-5 py-2 font-bold">
          Retry
        </button>
      </div>
    );
  }
  if (!order) return <p className="py-20 text-center">Order not found.</p>;

  const orderMongoId = String(order._id ?? id);
  const orderNo = String(order.orderNumber ?? order.orderId ?? order._id ?? id);
  const status = String(order.status ?? order.orderStatus ?? "PENDING").toUpperCase();
  const quoted = status === "PENDING" && order.priceStatus === "QUOTED";
  const st = quoted
    ? { label: "Price received", cls: "bg-blue-100 text-blue-700" }
    : statusStyle(status, order.cancelledBy);

  const items = rawOrderItems(order);
  const history: any[] = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const paid = String(order.paymentStatus ?? "").toUpperCase() === "PAID";

  const shownTotal =
    Number(order.totalAmount) > 0 ? Number(order.totalAmount) : Number(order.quote?.total ?? 0);
  const shownMrp = Number(order.totalMrp) > 0 ? Number(order.totalMrp) : shownTotal;

  const delivered = [...history].reverse().find((h) => h.status === "DELIVERED");
  const deliveredMs = new Date(delivered?.at ?? order.updatedAt).getTime();

  const bookingYmd = String(order.bookingDate ?? "").slice(0, 10);
  const todayYmd = new Date(Date.now() + 5.5 * HOUR).toISOString().slice(0, 10);
  const bookingLabel = /^\d{4}-\d{2}-\d{2}$/.test(bookingYmd)
    ? fmtDate(new Date(`${bookingYmd}T00:00:00`))
    : "";

  const placedMs = new Date(order.createdAt).getTime();
  const withinCancelWindow =
    Number.isFinite(placedMs) && Date.now() - placedMs <= CANCEL_WINDOW_DAYS * DAY_MS;

  // paid orders: only made-for items before the booking date, and every item must be refundable
  const paidCancelBlocked =
    paid && (!(bookingYmd && bookingYmd > todayYmd) || !items.every((x) => x.isRefundable === true));

  const canCancelOrder =
    ["PENDING", "CONFIRMED"].includes(status) && !paidCancelBlocked && withinCancelWindow;

  const canDo = (it: any, t: "RETURN" | "REPLACE" | "REFUND") => {
    const flag = { RETURN: "isReturnable", REPLACE: "isReplaceable", REFUND: "isRefundable" }[t];
    const days = { RETURN: "returnDays", REPLACE: "replaceDays", REFUND: "refundDays" }[t];
    if (status !== "DELIVERED" || it.productType === "SERVICE") return false;
    if (it[flag] !== true) return false;
    if (t === "REFUND" && !paid) return false;
    return it[days] == null || Date.now() - deliveredMs <= Number(it[days]) * DAY_MS;
  };

  const submitAction = async (reason: string, bank?: BankDetails) => {
    if (!action) return;
    const { kind, item } = action;
    const productId = item ? itemProductId(item) : undefined;
    if (kind === "CANCEL") {
      // no itemId / productId = cancel the whole order
      await cancelOrderItem(orderMongoId, reason, {
        ...(bank ? { bankDetails: bank } : {}),
      });
    } else {
      const reasonCode = REASON_CODE[reason] ?? "OTHER";
      await createItemRequest(orderMongoId, {
        type: kind,
        reasonCode,
        reason: reasonCode === "OTHER" ? reason : "",
        itemId: item._id,
        productId,
        ...(bank ? { bankDetails: bank } : {}),
      });
    }
    setAction(null);
    setNotice(
      kind === "CANCEL"
        ? paid
          ? "Cancelled. The store will send your refund to your bank account or UPI."
          : "Your cancellation has been recorded."
        : "Request sent. The store will review it and get back to you.",
    );
    await load();
  };

  const addr = order.deliveryAddress ?? order.shippingAddress ?? order.address;
  const eta = fmtDate(order.expectedDeliveryDate);

  return (
    <div className="mx-auto max-w-[760px] space-y-4 px-6 py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">#{orderNo}</h1>
          <p className="text-xs text-[#9a7a7a]">
            Placed {fmtDateTime(order.createdAt)}
            {order.storeName ? ` · ${order.storeName}` : ""}
          </p>
          {!!eta && status !== "CANCELLED" && status !== "DELIVERED" && (
            <p className="mt-2 inline-block rounded-full bg-[#fff1da] px-3 py-1 text-xs font-bold text-[#9b4326]">
              Delivery by {eta}
            </p>
          )}
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold">✕</button>
        </div>
      )}

      {!!bookingLabel && (
        <section className="shop-card flex items-center justify-between p-4 text-sm">
          <span className="text-[#9a7a7a]">Booking date</span>
          <b>{bookingLabel}</b>
        </section>
      )}

      <section className="shop-card p-5">
        <h2 className="font-extrabold">
          Items ({order.totalItems ?? items.length})
        </h2>

        {items.map((it, i) => {
          const productId = itemProductId(it);
          const image = itemImage(it);
          const name = itemName(it);
          const qty = itemQty(it);
          const variant = [it.color, it.size, it.weight, it.height].filter(Boolean).join(" · ");

          const myReqs = requests.filter((r: any) => {
            const rOrder = String(r.orderId?._id ?? r.orderId ?? "");
            const sameOrder = !rOrder || rOrder === orderMongoId;
            return (
              sameOrder &&
              (!r.itemId || r.itemId === it._id || String(r.productId) === productId)
            );
          });

          const itemCancelled = ["CANCELLED", "CANCELED"].includes(
            String(it.status ?? it.itemStatus ?? "").toUpperCase(),
          );
          const canAsk = myReqs.length === 0 && !itemCancelled && status !== "CANCELLED";

          const unit = it.offerPrice != null ? Number(it.offerPrice) : null;
          const line =
            it.lineTotal != null
              ? Number(it.lineTotal)
              : unit != null
                ? unit * qty
                : items.length === 1 && shownTotal > 0
                  ? shownTotal
                  : null;

          return (
            <div key={it._id ?? `${productId}-${i}`} className={i > 0 ? "mt-4 border-t border-[#f3eae0] pt-4" : "mt-4"}>
              <div className="flex items-start gap-3">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#fff7ec]">
                  {image && <Image src={image} alt={name} fill unoptimized className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  {productId ? (
                    <Link href={`/shop/product/${encodeURIComponent(productId)}`} className="font-bold hover:underline">
                      {name}
                    </Link>
                  ) : (
                    <b>{name}</b>
                  )}
                  {!!variant && <p className="text-xs text-[#9a7a7a]">{variant}</p>}
                  <p className="text-xs text-[#9a7a7a]">
                    {unit != null ? `Qty ${qty} × ${inr(unit)}` : `Qty ${qty} · Price pending`}
                  </p>
                </div>
                <b className="text-sm">{line != null ? inr(line) : "—"}</b>
              </div>

              {myReqs.map((r: any, k: number) => (
                <p key={k} className="mt-2 text-xs font-semibold text-[#9a7a7a]">
                  {String(r.type ?? "Request")[0] + String(r.type ?? "request").slice(1).toLowerCase()} request ·{" "}
                  {String(r.status ?? "PENDING").toLowerCase()}
                </p>
              ))}

              {canAsk && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["RETURN", "REPLACE", "REFUND"] as const)
                    // Refund only shows when it is actually available (paid + refundable)
                    .filter((t) => t !== "REFUND" || canDo(it, "REFUND"))
                    .map((t) => {
                      const ok = canDo(it, t);
                      const label = ACTION_LABEL[t].toLowerCase();
                      return (
                        <button
                          key={t}
                          onClick={() =>
                            ok
                              ? setAction({ kind: t, item: it })
                              : setNotice(
                                  status === "DELIVERED"
                                    ? `The ${label} window for this item has closed, or it is not eligible for a ${label}.`
                                    : `You can request a ${label} once the item is delivered.`,
                                )
                          }
                          className={`rounded-full border border-[#e8cfa8] bg-[#fff4eb] px-4 py-1.5 text-xs font-bold text-[#9b4326] ${
                            ok ? "" : "opacity-45"
                          }`}
                        >
                          {ACTION_LABEL[t]}
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </section>

      {canCancelOrder && (
        <button
          onClick={() => setAction({ kind: "CANCEL", item: null })}
          className="w-full rounded-full border border-red-300 bg-red-50 py-3 text-sm font-bold text-red-600"
        >
          Cancel order
        </button>
      )}
      {paidCancelBlocked && ["PENDING", "CONFIRMED"].includes(status) && (
        <p className="text-center text-xs font-semibold text-[#9a7a7a]">
          Paid orders can be cancelled only for made-for items, before the booking date.
        </p>
      )}

      {addr && (
        <section className="shop-card p-5 text-sm">
          <h2 className="font-extrabold">Delivery address</h2>
          {typeof addr === "string" ? (
            <p className="mt-2">{addr}</p>
          ) : (
            <>
              <p className="mt-2 font-bold">
                {[addr.fullName, addr.phone].filter(Boolean).join(" · ")}
              </p>
              <p className="text-[#6b4a4a]">{[addr.addressLine, addr.area].filter(Boolean).join(", ")}</p>
              <p className="text-[#6b4a4a]">
                {[addr.city, addr.state].filter(Boolean).join(", ")}
                {addr.pincode ? ` - ${addr.pincode}` : ""}
              </p>
            </>
          )}
          {!!order.note && <p className="mt-2 text-xs text-[#9a7a7a]">Note: {order.note}</p>}
        </section>
      )}

      <section className="shop-card space-y-2 p-5 text-sm">
        <h2 className="font-extrabold">Payment</h2>
        <div className="flex justify-between">
          <span className="text-[#9a7a7a]">Total MRP</span>
          <span>{shownMrp > 0 ? inr(shownMrp) : "Price pending"}</span>
        </div>
        {Number(order.discount) > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>-{inr(Number(order.discount))}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-[#f3eae0] pt-2 font-black">
          <span>Total</span>
          <span>{shownTotal > 0 ? inr(shownTotal) : "Price pending"}</span>
        </div>
        <p className="text-xs text-[#9a7a7a]">
          {order.paymentMethod === "COD" ? "Cash on Delivery" : order.paymentMethod}
          {order.paymentStatus ? ` · ${String(order.paymentStatus).toLowerCase()}` : ""}
        </p>
      </section>

      {history.length > 0 && (
        <section className="shop-card p-5">
          <h2 className="font-extrabold">Order timeline</h2>
          <div className="mt-4">
            {[...history].reverse().map((h, i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex w-3 flex-col items-center">
                  <span className={`mt-1 h-3 w-3 rounded-full ${i === 0 ? "bg-[#e0622d]" : "bg-[#e5d5c5]"}`} />
                  {i < arr.length - 1 && <span className="w-0.5 flex-1 bg-[#f3eae0]" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm font-bold">{statusStyle(h.status, order.cancelledBy).label}</p>
                  <p className="text-xs text-[#9a7a7a]">{fmtDateTime(h.at)}</p>
                  {!!h.note && <p className="text-xs text-[#9a7a7a]">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Link href="/shop/orders" className="block text-center text-sm font-bold text-[#9b4326]">
        ← Back to orders
      </Link>

      {action && (
        <ReasonSheet
          kind={action.kind}
          itemName={action.item ? itemName(action.item) : "Entire order"}
          needsBank={(action.kind === "CANCEL" && paid) || action.kind === "REFUND"}
          onClose={() => setAction(null)}
          onSubmit={submitAction}
        />
      )}
    </div>
  );
}