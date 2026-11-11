"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth";
import { rawOrderItems, itemImage, itemName, itemQty } from "../order-items";
import { inr } from "../data";

const API = process.env.NEXT_PUBLIC_API_URL;

type Status = "open" | "in_progress" | "resolved" | "closed";
type Ticket = {
  _id: string;
  ticketNo: string;
  subject: string;
  description: string;
  status: Status;
  resolution: string;
  unreadByUser: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
};
type Msg = { _id: string; role: "user" | "assistant" | "store"; content: string; createdAt: string };

const STATUS: Record<Status, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-red-100 text-red-700" },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-800" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-700" },
  closed: { label: "Closed", cls: "bg-neutral-200 text-neutral-700" },
};

const ROLE_LABEL = { user: "You", assistant: "AYENDRI Assistant", store: "AYENDRI Help Center" };

// ⚠️ Tomar baki shop API call gulo jemon token pathay (cart-api.ts dekho), oi bhabe header milao
const authHeaders = (token?: string | null): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

// profile menu te badge dekhate: const unread = useTicketUnread();
export function useTicketUnread() {
  const token = useAuth((s) => s.token);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setCount(0);
      return;
    }
    let cancelled = false;
    const load = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`${API}/api/ticket/my/unread`, { headers: authHeaders(token) });
        const json = await res.json();
        if (!cancelled && json?.success) setCount(json.data?.count ?? 0);
      } catch {}
    };
    load();
    window.addEventListener("ayendriTicketsChanged", load);
    const t = setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.removeEventListener("ayendriTicketsChanged", load);
      clearInterval(t);
    };
  }, [token]);

  return count;
}

export default function MyTickets({ initialTicketId }: { initialTicketId?: string | null }) {
  const token = useAuth((s) => s.token);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{ ticket: Ticket; messages: Msg[]; order: any | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/ticket/my?limit=50`, { headers: authHeaders(token) });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load tickets");
      setTickets(json.tickets || []);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadList();
    const t = setInterval(() => !document.hidden && loadList(), 30000);
    return () => clearInterval(t);
  }, [loadList]);

  const openTicket = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/api/ticket/my/${id}`, { headers: authHeaders(token) });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load ticket");
      setDetail({ ticket: json.ticket, messages: json.messages || [], order: json.order || null });
      window.dispatchEvent(new Event("ayendriTicketsChanged")); // badge refresh
      loadList();
    } catch (e: any) {
      setError(e?.message || "Failed to load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

    useEffect(() => {
    if (initialTicketId && token) void openTicket(initialTicketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicketId, token]);

  if (!token) {
    return <p className="p-4 text-sm text-neutral-500">Please login to see your tickets.</p>;
  }

  /* ---------- DETAIL ---------- */
  if (detail) {
    const t = detail.ticket;
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setDetail(null)}
          className="text-sm font-medium text-[#6b1f2a] hover:underline"
        >
          ← Back to My Tickets
        </button>

        <div className="rounded-xl border border-[#f2b632]/40 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-[#6b1f2a]">#{t.ticketNo}</h3>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[t.status].cls}`}>
              {STATUS[t.status].label}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-800">{t.subject}</p>
          <p className="text-xs text-neutral-500">Raised on {new Date(t.createdAt).toLocaleString()}</p>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase text-neutral-500">Your complaint</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">{t.description}</p>
          </div>

          <div className="mt-3 rounded-lg bg-[#fff8e6] p-3">
            <p className="text-xs font-semibold uppercase text-[#6b1f2a]">Solution</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
              {t.resolution || "Our support team is working on this. We will update you here."}
            </p>
            {t.resolvedAt && (
              <p className="mt-1 text-[11px] text-neutral-500">
                Resolved on {new Date(t.resolvedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>

{detail.order ? (() => {
  const o = detail.order;
  const items: any[] = rawOrderItems(o);
  const orderHref = `/shop/orders/${encodeURIComponent(String(o._id))}`;
  const orderNo = o.orderNumber ?? o.orderId ?? String(o._id).slice(-6);
  const total =
    Number(o.totalAmount) > 0 ? Number(o.totalAmount) : Number(o.quote?.total ?? 0);
  const addr = o.deliveryAddress ?? o.shippingAddress ?? o.address;
  const addrText =
    typeof addr === "string"
      ? addr
      : addr
        ? [
            addr.fullName,
            addr.phone,
            [addr.addressLine, addr.area].filter(Boolean).join(", "),
            [addr.city, addr.state].filter(Boolean).join(", ") +
              (addr.pincode ? ` - ${addr.pincode}` : ""),
          ]
            .filter(Boolean)
            .join(" · ")
        : "";

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-neutral-800">Complaint regarding this order</p>
        <Link href={orderHref} className="text-sm font-medium text-[#6b1f2a] hover:underline">
          View full order →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-neutral-50 p-3 text-xs">
        <div>
          <p className="text-neutral-500">Order No.</p>
          <p className="font-semibold text-neutral-800">#{orderNo}</p>
        </div>
        <div>
          <p className="text-neutral-500">Status</p>
          <p className="font-semibold capitalize text-neutral-800">
            {String(o.status ?? o.orderStatus ?? "-").toLowerCase()}
          </p>
        </div>
        {o.createdAt && (
          <div>
            <p className="text-neutral-500">Placed on</p>
            <p className="font-semibold text-neutral-800">
              {new Date(o.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        )}
        <div>
          <p className="text-neutral-500">Total</p>
          <p className="font-semibold text-neutral-800">{total > 0 ? inr(total) : "Price pending"}</p>
        </div>
        {(o.paymentMethod || o.paymentStatus) && (
          <div className="col-span-2">
            <p className="text-neutral-500">Payment</p>
            <p className="font-semibold text-neutral-800">
              {[o.paymentMethod === "COD" ? "Cash on Delivery" : o.paymentMethod, o.paymentStatus && String(o.paymentStatus).toLowerCase()]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        )}
        {addrText && (
          <div className="col-span-2">
            <p className="text-neutral-500">Delivery address</p>
            <p className="font-semibold text-neutral-800">{addrText}</p>
          </div>
        )}
      </div>

      <p className="mb-2 mt-4 text-xs font-semibold uppercase text-neutral-500">
        {items.length > 1 ? `Products in this order (${items.length})` : "Product"}
      </p>
      <div className="space-y-2">
        {items.map((it: any, i: number) => {
          const img = itemImage(it);
          const name = itemName(it);
          const qty = itemQty(it);
          const variant = [it.color, it.size, it.weight, it.height].filter(Boolean).join(" · ");
          const unit = it.offerPrice != null ? Number(it.offerPrice) : null;
          return (
            <Link
              key={it._id ?? i}
              href={orderHref}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 transition hover:border-[#6b1f2a]/50 hover:bg-[#fff8e6]"
            >
              {img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt={name} className="h-16 w-16 shrink-0 rounded-lg border object-cover" />
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-800">{name}</p>
                {variant && <p className="truncate text-xs text-neutral-500">{variant}</p>}
                <p className="text-xs text-neutral-500">
                  {unit != null ? `Qty ${qty} × ${inr(unit)}` : `Qty ${qty}`}
                </p>
              </div>
              <span className="shrink-0 text-sm text-[#6b1f2a]">→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
})() : (
  <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-neutral-500">
    No order is linked to this ticket.
  </div>
)}

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="mb-2 text-sm font-semibold text-neutral-800">Chat history</p>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {detail.messages.map((m) => (
              <div key={m._id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] ${
                    m.role === "user"
                      ? "rounded-br-sm bg-[#6b1f2a] text-white"
                      : m.role === "store"
                        ? "rounded-bl-sm border border-[#f2b632]/60 bg-[#fff8e6] text-neutral-800"
                        : "rounded-bl-sm border bg-neutral-50 text-neutral-800"
                  }`}
                >
                  <span className="mb-0.5 block text-[10px] font-semibold uppercase opacity-70">
                    {ROLE_LABEL[m.role]}
                  </span>
                  {m.role === "assistant" ? m.content.replace(/\*\*/g, "") : m.content}
                  <span className="mt-1 block text-right text-[10px] opacity-60">
                    {new Date(m.createdAt).toLocaleString([], {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ---------- LIST ---------- */
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold text-[#6b1f2a]">My Tickets</h2>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && tickets.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">
          No tickets yet. If you have a complaint, chat with us and our support team will raise a ticket.
        </div>
      )}

      {tickets.map((t) => (
        <button
          key={t._id}
          type="button"
          onClick={() => openTicket(t._id)}
          disabled={detailLoading}
          className="w-full rounded-xl border border-[#f2b632]/30 bg-white p-4 text-left shadow-sm transition hover:border-[#6b1f2a]/40 hover:shadow"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 font-bold text-[#6b1f2a]">
              #{t.ticketNo}
              {t.unreadByUser > 0 && <span className="h-2 w-2 rounded-full bg-red-500" title="New update" />}
            </span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[t.status].cls}`}>
              {STATUS[t.status].label}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-800">{t.subject}</p>
          <p className="mt-1 text-xs text-neutral-500">
            Updated {new Date(t.updatedAt).toLocaleString()}
          </p>
        </button>
      ))}
    </div>
  );
}