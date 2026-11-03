"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { useAuth } from "../auth";
import { useShop } from "../shop-data";
import { useNotifications } from "../notifications-store";
import { markRead, notificationOrderId, type AppNotification } from "../notifications-api";

const POLL_MS = 30000;
const SHOW_MS = 7000;

function Popup({ n }: { n: AppNotification }) {
  const router = useRouter();
  const { token } = useAuth();
  const storeMongoId = useShop((s) => s.storeMongoId);
  const dismiss = useNotifications((s) => s.dismiss);
  const setUnread = useNotifications((s) => s.setUnread);

  useEffect(() => {
    const t = setTimeout(() => dismiss(n._id), SHOW_MS);
    return () => clearTimeout(t);
  }, [n._id, dismiss]);

  const open = () => {
    dismiss(n._id);
    if (token) {
      markRead(token, [n._id], storeMongoId || undefined).catch(() => undefined);
      setUnread(useNotifications.getState().unread - 1);
    }
    if (n.type === "REVIEW_REPLY" && n.productId) {
      router.push(`/shop/product/${encodeURIComponent(String(n.productId))}#reviews`);
      return;
    }
    const orderId = notificationOrderId(n);
    router.push(orderId ? `/shop/orders/${encodeURIComponent(orderId)}` : "/shop/notifications");
  };

  return (
    <div
      role="status"
      className="shop-card flex items-start gap-3 border-l-4 border-[#e0622d] bg-white p-3 shadow-xl"
      style={{ animation: "shop-pop-in .25s ease-out" }}
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#fff1da] text-[#e0622d]">
        <Bell size={16} />
      </span>
      <button onClick={open} className="min-w-0 flex-1 text-left">
        <b className="block truncate text-sm">{n.title}</b>
        <span className="mt-0.5 line-clamp-2 block text-xs text-[#5a3a3a]">{n.body}</span>
      </button>
      <button
        onClick={() => dismiss(n._id)}
        aria-label="Close"
        className="shrink-0 rounded-full p-1 text-[#9a7a7a] hover:bg-[#fff1da]"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default function NotificationWatcher() {
  const { token, ready } = useAuth();
  const storeMongoId = useShop((s) => s.storeMongoId);
  const poll = useNotifications((s) => s.poll);
  const reset = useNotifications((s) => s.reset);
  const popups = useNotifications((s) => s.popups);

  useEffect(() => {
    if (!ready) return;
    if (!token) {
      reset();
      return;
    }
    const run = () => {
      if (!document.hidden) void poll(storeMongoId || undefined);
    };
    run();
    const t = setInterval(run, POLL_MS);
    document.addEventListener("visibilitychange", run);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", run);
    };
  }, [ready, token, storeMongoId, poll, reset]);

  if (!popups.length) return null;
  return (
    <div className="fixed right-3 top-20 z-[120] flex w-[min(92vw,360px)] flex-col gap-2">
      {popups.map((n) => (
        <Popup key={n._id} n={n} />
      ))}
    </div>
  );
}