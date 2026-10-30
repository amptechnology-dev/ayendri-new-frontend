"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { useAuth } from "../auth";
import { useShop } from "../shop-data";
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

export default function NotificationsPage() {
  const router = useRouter();
  const { token, ready } = useAuth();
  const storeMongoId = useShop((s) => s.storeMongoId);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

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
      const list = filterNotificationsForStore(d.notifications ?? [], [storeMongoId]);
      setItems(list);
      setUnread(d.unreadCount ?? list.filter((n) => !n.isRead).length);
      setPage(1);
      setTotalPages(d.totalPages ?? 1);
    } catch {
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token, storeMongoId]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const loadMore = async () => {
    if (!token || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const d = await fetchNotifications(token, page + 1, storeMongoId || undefined);
      const list = filterNotificationsForStore(d.notifications ?? [], [storeMongoId]);
      setItems((prev) => [...prev, ...list]);
      setPage(page + 1);
      setTotalPages(d.totalPages ?? totalPages);
    } catch {
      setError("Unable to load more notifications.");
    } finally {
      setLoadingMore(false);
    }
  };

  const open = async (n: AppNotification) => {
    if (token && !n.isRead) {
      setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markRead(token, [n._id], storeMongoId || undefined).catch(() => undefined);
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

  return (
    <main className="mx-auto max-w-[640px] px-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black text-[#4a0710]">
          Notifications{unread > 0 && <span className="ml-2 rounded-full bg-[#a3161c] px-2 py-0.5 align-middle text-xs text-white">{unread}</span>}
        </h1>
        {items.length > 0 && (
          <div className="flex gap-2 text-xs font-bold">
            {unread > 0 && (
              <button onClick={readAll} className="rounded-full border border-[#e8cfa8] px-3 py-1.5 text-[#9b4326]">
                Mark all read
              </button>
            )}
            <button onClick={clearAll} className="rounded-full border border-red-300 px-3 py-1.5 text-red-600">
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
          <button onClick={() => void load()} className="ml-2 font-bold underline">Retry</button>
        </div>
      )}

      {!error && items.length === 0 && (
        <section className="shop-card mt-8 p-10 text-center">
          <Bell size={32} className="mx-auto text-[#c9a98a]" />
          <h2 className="mt-3 text-lg font-extrabold">No notifications</h2>
          <p className="mt-1 text-sm text-[#9a7a7a]">Order updates and offers will show up here.</p>
        </section>
      )}

      <div className="mt-5 space-y-3">
        {items.map((n) => (
          <div
            key={n._id}
            className={`shop-card flex items-start gap-3 p-4 ${n.isRead ? "" : "border-l-4 border-[#e0622d]"}`}
          >
            <button onClick={() => void open(n)} className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-[#e0622d]" />}
                <b className="text-sm">{n.title}</b>
              </div>
              <p className="mt-1 text-sm text-[#5a3a3a]">{n.body}</p>
              <p className="mt-1.5 text-xs text-[#9a7a7a]">{timeAgo(n.createdAt)}</p>
            </button>
            <button
              onClick={() => void remove(n)}
              aria-label="Delete notification"
              className="shrink-0 rounded-full p-2 text-[#9a7a7a] hover:bg-[#fff1da]"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {page < totalPages && (
        <button
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mx-auto mt-6 block rounded-full border border-[#e8cfa8] px-6 py-2.5 text-sm font-bold text-[#9b4326] disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </main>
  );
}