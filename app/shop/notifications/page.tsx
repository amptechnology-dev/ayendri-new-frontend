"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, MessageSquare, Package, Ticket, Trash2 } from "lucide-react";
import { useAuth } from "../auth";
import { useShop } from "../shop-data";
import { useNotifications } from "../notifications-store";
import Pagination from "../components/Pagination";
import { fetchMyOrders, imgUrl } from "../api";
import { rawOrderItems, itemImage, itemProductId } from "../order-items";
import {
  clearAllNotifications,
  deleteNotification,
  fetchNotifications,
  filterNotificationsForStore,
  markRead,
  notificationOrderId,
  type AppNotification,
} from "../notifications-api";

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "";
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function notificationImage(
  n: AppNotification,
  productMap: Record<string, string>,
  orderMap: Record<string, string>
): string | null {
  const x = n as any;
  if (x.productId && productMap[String(x.productId)]) return productMap[String(x.productId)];
  const oid = notificationOrderId(n);
  if (oid && orderMap[oid]) return orderMap[oid];
  return null;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const storeMongoId = useShop((s) => s.storeMongoId);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [loading, setLoading] = useState(true);
  const products = useShop((s) => s.products);
  const productImages = useMemo(() => {
    const map: Record<string, string> = {};
    (products ?? []).forEach((p: any) => {
      const img = p.image ?? p.images?.[0];
      if (!img) return;
      [p.slug, p.raw?._id, p.id, p._id].forEach((k) => {
        if (k) map[String(k)] = imgUrl(img);
      });
    });
    return map;
  }, [products]);
  const [orderImages, setOrderImages] = useState<Record<string, string>>({});

  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const setGlobalUnread = useNotifications((s) => s.setUnread);

  // keep the header badge equal to what this page shows
  useEffect(() => {
    if (!loading) setGlobalUnread(unread);
  }, [loading, unread, setGlobalUnread]);

  const load = useCallback(async () => {
    if (!token) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const d = await fetchNotifications(token, 1, storeMongoId || undefined);
      let all = d.notifications ?? [];
      for (let p = 2; p <= (d.totalPages ?? 1); p++) {
        const more = await fetchNotifications(token, p, storeMongoId || undefined);
        all = all.concat(more.notifications ?? []);
      }
      const list = filterNotificationsForStore(all, [storeMongoId]);
      setItems(list);
      setUnread(d.unreadCount ?? list.filter((n) => !n.isRead).length);
      setPage(1);
    } catch {
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, storeMongoId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  // order images for ORDER_* notifications (same call the orders page uses)
  useEffect(() => {
    if (!token) return;
    fetchMyOrders()
      .then((res: any) => {
        const value = res?.data ?? res;
        const list: any[] = Array.isArray(value)
          ? value
          : Array.isArray(value?.orders)
            ? value.orders
            : Array.isArray(value?.data?.orders)
              ? value.data.orders
              : [];
        const map: Record<string, string> = {};
        list.forEach((o) => {
          const first: any = rawOrderItems(o)[0] ?? o.product;
          const img =
            (first ? itemImage(first) : "") ||
            (first ? productImages[itemProductId(first)] : "");
          if (o?._id && img) map[String(o._id)] = img;
        });
        setOrderImages(map);
      })
      .catch(() => undefined);
  }, [token, productImages]);

  

  const open = async (n: AppNotification) => {
    if (token && !n.isRead) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markRead(token, [n._id], storeMongoId || undefined).catch(() => undefined);
    }

    // [REVIEW] seller reply -> product page er reviews section
    if (n.type === "REVIEW_REPLY" && n.productId) {
      router.push(`/shop/product/${encodeURIComponent(String(n.productId))}#reviews`);
      return;
    }

    // ticket notification -> profile > My Tickets > that ticket's details
    const ticketId = (n as any).ticketId;
    if (ticketId) {
      router.push(`/shop/profile?tab=tickets&ticket=${encodeURIComponent(String(ticketId))}`);
      return;
    }

    const orderId = notificationOrderId(n);
    if (orderId) router.push(`/shop/orders/${encodeURIComponent(orderId)}`);
  };

  const readAll = async () => {
    if (!token) return;
    try {
      await markRead(token, undefined, storeMongoId || undefined);
      setItems((prev) => prev.map((x) => ({ ...x, isRead: true })));
      setUnread(0);
    } catch {
      setError("Could not mark notifications as read.");
    }
  };

  const remove = async (n: AppNotification) => {
    if (!token) return;
    try {
      await deleteNotification(token, n._id);
      setItems((prev) => prev.filter((x) => x._id !== n._id));
      if (!n.isRead) setUnread((u) => Math.max(0, u - 1));
    } catch {
      setError("Could not delete this notification.");
    }
  };

  const clearAll = async () => {
    if (!token || !items.length) return;
    if (!window.confirm("Clear all notifications?")) return;
    try {
      await clearAllNotifications(token, storeMongoId || undefined);
      setItems([]);
      setUnread(0);
    } catch {
      setError("Could not clear notifications.");
    }
  };

  const visible = useMemo(
    () => (filter === "unread" ? items.filter((n) => !n.isRead) : items),
    [items, filter]
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  if (!ready || loading) {
    return <p className="py-20 text-center text-sm text-[#9a7a7a]">Loading notifications…</p>;
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-black text-[#4a0710]">Notifications</h1>
        <p className="mt-3 text-sm text-[#9a7a7a]">Sign in to see your notifications.</p>
        <Link href="/shop/login?next=/shop/notifications" className="shop-gold-btn mt-5 inline-block rounded-full px-6 py-3">
          Sign in
        </Link>
      </main>
    );
  }

  const tabClass = (active: boolean) =>
    `flex w-full items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition ${
      active ? "bg-[#fff1da] text-[#9b4326]" : "text-[#5a3a3a] hover:bg-[#fff8ec]"
    }`;

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="text-2xl font-black text-[#4a0710] lg:text-3xl">Notifications</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-stretch">
        {/* Sidebar */}
        <aside className="shop-card p-4">
          <div className="flex gap-2 lg:flex-col lg:gap-1">
            <button onClick={() => { setFilter("all"); setPage(1); }} className={tabClass(filter === "all")}>
              <span>All</span>
              <span className="text-xs font-semibold text-[#9a7a7a]">{items.length}</span>
            </button>
            <button onClick={() => { setFilter("unread"); setPage(1); }} className={tabClass(filter === "unread")}>
              <span>Unread</span>
              <span
                className={`min-w-[22px] rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                  unread > 0 ? "bg-[#a3161c] text-white" : "text-[#9a7a7a]"
                }`}
              >
                {unread}
              </span>
            </button>
          </div>

          {items.length > 0 && (
            <div className="mt-4 flex gap-2 border-t border-[#f1e0c4] pt-4 text-xs font-bold lg:flex-col">
              {unread > 0 && (
                <button
                  onClick={readAll}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#e8cfa8] px-3 py-2 text-[#9b4326] hover:bg-[#fff8ec]"
                >
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
              <button
                onClick={clearAll}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-300 px-3 py-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} /> Clear all
              </button>
            </div>
          )}
        </aside>

        {/* List */}
        <section className="flex min-w-0 flex-col">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
              <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
            </div>
          )}

          {!error && visible.length === 0 && (
            <div className="shop-card p-12 text-center">
              <Bell size={36} className="mx-auto text-[#c9a98a]" />
              <h2 className="mt-3 text-lg font-extrabold">
                {filter === "unread" && items.length > 0 ? "You're all caught up" : "No notifications"}
              </h2>
              <p className="mt-1 text-sm text-[#9a7a7a]">
                {filter === "unread" && items.length > 0
                  ? "No unread notifications right now."
                  : "Order updates and offers will show up here."}
              </p>
            </div>
          )}

          {visible.length > 0 && (
            <div className="shop-card flex flex-1 flex-col divide-y divide-[#f1e0c4] overflow-hidden">
              {pageItems.map((n) => {
                const Icon = n.type === "REVIEW_REPLY" ? MessageSquare : String(n.type).startsWith("TICKET_") ? Ticket : notificationOrderId(n) ? Package : Bell;
const img = notificationImage(n, productImages, orderImages);
                return (
                  <div
                    key={n._id}
                    className={`group flex items-center gap-4 px-5 py-4 transition hover:bg-[#fffaf1] ${
                      n.isRead ? "" : "bg-[#fffdf8] shadow-[inset_4px_0_0_#e0622d]"
                    }`}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        loading="lazy"
                        className="h-14 w-14 shrink-0 rounded-xl border border-[#f1e0c4] object-cover"
                      />
                    ) : (
                      <div
                        className={`grid h-14 w-14 shrink-0 place-items-center rounded-xl ${
                          n.isRead ? "bg-[#f6efe4] text-[#9a7a7a]" : "bg-[#fff1da] text-[#e0622d]"
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                    )}

                    <button onClick={() => void open(n)} className="min-w-0 flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <b className={`truncate text-sm ${n.isRead ? "font-semibold text-[#5a3a3a]" : "text-[#4a0710]"}`}>
                          {n.title}
                        </b>
                        {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-[#e0622d]" />}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-[#5a3a3a]">{n.body}</p>
                    </button>

                    <span className="hidden shrink-0 text-xs text-[#9a7a7a] sm:block">{timeAgo(n.createdAt)}</span>

                    <button
                      onClick={() => void remove(n)}
                      aria-label="Delete notification"
                      className="shrink-0 rounded-full p-2 text-[#9a7a7a] transition hover:bg-[#fff1da] hover:text-red-600 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              <div className="mt-auto flex justify-center bg-[#fffdf8] px-5 py-4">
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={(p) => setPage(p)}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}