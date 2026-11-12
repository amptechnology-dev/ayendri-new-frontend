"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  images?: string[];
  feedback?: { rating: number; comment: string; at: string } | null;
};
type OrderOpt = {
  _id: string;
  orderNumber: string;
  status: string;
  storeName?: string;
  createdAt: string;
  itemNames: string[];
};
type Msg = {
  _id: string;
  role: "user" | "assistant" | "store";
  content: string;
  createdAt: string;
};

const STATUS: Record<Status, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-red-100 text-red-700" },
  in_progress: { label: "In Progress", cls: "bg-amber-100 text-amber-800" },
  resolved: { label: "Resolved", cls: "bg-green-100 text-green-700" },
  closed: { label: "Closed", cls: "bg-neutral-200 text-neutral-700" },
};

const ROLE_LABEL = {
  user: "You",
  assistant: "AYENDRI Assistant",
  store: "AYENDRI Help Center",
};

// ⚠️ Tomar baki shop API call gulo jemon token pathay (cart-api.ts dekho), oi bhabe header milao
const authHeaders = (token?: string | null): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

function Stars({
  value,
  onChange,
  size = "text-2xl",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= (hover || value);
        return (
          <button
            key={n}
            type="button"
            disabled={!onChange}
            aria-label={`${n} star`}
            onClick={() => onChange?.(n)}
            onMouseEnter={() => onChange && setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={`${size} leading-none ${on ? "text-[#f2b632]" : "text-neutral-300"} ${
              onChange ? "cursor-pointer" : "cursor-default"
            }`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

const MAX_IMAGES = 5;
const MAX_MB = 5;

function NewTicketForm({
  token,
  onCancel,
  onCreated,
}: {
  token: string;
  onCancel: () => void;
  onCreated: () => void;
}) {
  const [orders, setOrders] = useState<OrderOpt[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/ticket/my/orders`, {
          headers: authHeaders(token),
        });
        const json = await res.json();
        if (json?.success) setOrders(json.orders || []);
      } catch {}
      setOrdersLoading(false);
    })();
  }, [token]);

  const previews = useMemo(
    () => files.map((f) => URL.createObjectURL(f)),
    [files],
  );
  useEffect(
    () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
    [previews],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    setErr("");
    const valid: File[] = [];
    for (const f of picked) {
      if (!/^image\/(jpe?g|png|webp)$/.test(f.type)) {
        setErr("Only JPG, PNG or WEBP images are allowed");
        continue;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setErr(`Each image must be under ${MAX_MB}MB`);
        continue;
      }
      valid.push(f);
    }
    setFiles((prev) => {
      const next = [...prev, ...valid];
      if (next.length > MAX_IMAGES)
        setErr(`You can upload up to ${MAX_IMAGES} images`);
      return next.slice(0, MAX_IMAGES);
    });
  };

  const canSubmit =
    !!orderId &&
    subject.trim().length >= 3 &&
    description.trim().length >= 5 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setErr("");
    try {
      const fd = new FormData();
      fd.append("orderId", orderId);
      fd.append("subject", subject.trim());
      fd.append("description", description.trim());
      files.forEach((f) => fd.append("images", f));

      // Content-Type manually set korbe na, browser boundary nijei dibe
      const res = await fetch(`${API}/api/ticket/my`, {
        method: "POST",
        headers: authHeaders(token),
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.errors?.[0]?.message ||
            json?.message ||
            "Failed to raise ticket",
        );
      }
      onCreated();
    } catch (e: any) {
      setErr(e?.message || "Failed to raise ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onCancel}
        className="text-sm font-medium text-[#6b1f2a] hover:underline"
      >
        ← Back to My Tickets
      </button>

      <div className="space-y-3 rounded-xl border border-[#f2b632]/40 bg-white p-4 shadow-sm">
        <h3 className="text-lg font-bold text-[#6b1f2a]">Raise a ticket</h3>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Order *
          </label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm"
            disabled={ordersLoading}
          >
            <option value="">
              {ordersLoading ? "Loading orders..." : "Select the order"}
            </option>
            {orders.map((o) => (
              <option key={o._id} value={o._id}>
                #{o.orderNumber} · {o.itemNames.join(", ") || "Order"} ·{" "}
                {new Date(o.createdAt).toLocaleDateString("en-IN")}
              </option>
            ))}
          </select>
          {!ordersLoading && orders.length === 0 && (
            <p className="text-xs text-neutral-500">You have no orders yet.</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Subject *
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={150}
            placeholder="e.g. Wrong item delivered"
            className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Complaint details *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={2000}
            rows={5}
            className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase text-neutral-500">
            Photos (optional, up to {MAX_IMAGES})
          </label>
          <div className="flex flex-wrap gap-2">
            {previews.map((src, i) => (
              <div key={src} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Selected ${i + 1}`}
                  className="h-20 w-20 rounded-lg border object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove image"
                  onClick={() =>
                    setFiles((p) => p.filter((_, idx) => idx !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {files.length < MAX_IMAGES && (
              <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-neutral-300 text-2xl text-neutral-400 hover:border-[#6b1f2a]/50">
                +
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={onPick}
                />
              </label>
            )}
          </div>
        </div>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm font-medium text-neutral-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="flex-1 rounded-lg bg-[#6b1f2a] py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
        const res = await fetch(`${API}/api/ticket/my/unread`, {
          headers: authHeaders(token),
        });
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

export default function MyTickets({
  initialTicketId,
}: {
  initialTicketId?: string | null;
}) {
  const token = useAuth((s) => s.token);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{
    ticket: Ticket;
    messages: Msg[];
    order: any | null;
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [view, setView] = useState<"list" | "new">("list");
  const [closing, setClosing] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [closeBusy, setCloseBusy] = useState(false);
  const [closeErr, setCloseErr] = useState("");

  const loadList = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/ticket/my?limit=50`, {
        headers: authHeaders(token),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.message || "Failed to load tickets");
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
      const res = await fetch(`${API}/api/ticket/my/${id}`, {
        headers: authHeaders(token),
      });
      const json = await res.json();
      if (!res.ok || !json?.success)
        throw new Error(json?.message || "Failed to load ticket");
      setClosing(false);
      setRating(0);
      setComment("");
      setCloseErr("");
      setDetail({
        ticket: json.ticket,
        messages: json.messages || [],
        order: json.order || null,
      });
      window.dispatchEvent(new Event("ayendriTicketsChanged")); // badge refresh
      loadList();
    } catch (e: any) {
      setError(e?.message || "Failed to load ticket");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeTicket = async () => {
    if (!detail || rating < 1 || closeBusy) return;
    setCloseBusy(true);
    setCloseErr("");
    try {
      const id = detail.ticket._id;
      const res = await fetch(`${API}/api/ticket/my/${id}/close`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(
          json?.errors?.[0]?.message ||
            json?.message ||
            "Failed to close ticket",
        );
      }
      await openTicket(id); // fresh data + badge refresh + list reload
    } catch (e: any) {
      setCloseErr(e?.message || "Failed to close ticket");
    } finally {
      setCloseBusy(false);
    }
  };

  useEffect(() => {
    if (initialTicketId && token) void openTicket(initialTicketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTicketId, token]);

  if (!token) {
    return (
      <p className="p-4 text-sm text-neutral-500">
        Please login to see your tickets.
      </p>
    );
  }

  if (view === "new") {
    return (
      <NewTicketForm
        token={token}
        onCancel={() => setView("list")}
        onCreated={() => {
          setView("list");
          loadList();
          window.dispatchEvent(new Event("ayendriTicketsChanged"));
        }}
      />
    );
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
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[t.status].cls}`}
            >
              {STATUS[t.status].label}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-neutral-800">
            {t.subject}
          </p>
          <p className="text-xs text-neutral-500">
            Raised on {new Date(t.createdAt).toLocaleString()}
          </p>

          <div className="mt-3">
            <p className="text-xs font-semibold uppercase text-neutral-500">
              Your complaint
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700">
              {t.description}
            </p>
          </div>

          <div className="mt-3 rounded-lg bg-[#fff8e6] p-3">
            <p className="text-xs font-semibold uppercase text-[#6b1f2a]">
              Solution
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-neutral-800">
              {t.resolution ||
                "Our support team is working on this. We will update you here."}
            </p>
            {t.resolvedAt && (
              <p className="mt-1 text-[11px] text-neutral-500">
                Resolved on {new Date(t.resolvedAt).toLocaleString()}
              </p>
            )}
          </div>

          {t.images && t.images.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Attachments
              </p>
              <div className="mt-1 flex flex-wrap gap-2">
                {t.images.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Attachment ${i + 1}`}
                      className="h-20 w-20 rounded-lg border object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {t.status === "closed" ? (
          t.feedback && (
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Your feedback
              </p>
              <div className="mt-1">
                <Stars value={t.feedback.rating} size="text-xl" />
              </div>
              {t.feedback.comment && (
                <p className="mt-2 whitespace-pre-wrap text-sm text-neutral-700">
                  {t.feedback.comment}
                </p>
              )}
            </div>
          )
        ) : (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            {!closing ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-neutral-700">
                  {t.status === "resolved"
                    ? "Is your issue solved?"
                    : "Issue sorted out already?"}
                </p>
                <button
                  type="button"
                  onClick={() => setClosing(true)}
                  className="rounded-lg bg-[#6b1f2a] px-3 py-1.5 text-sm font-semibold text-white"
                >
                  Close ticket
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-neutral-800">
                  Rate our support to close this ticket
                </p>
                <Stars value={rating} onChange={setRating} />
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Share your feedback (optional)"
                  className="w-full rounded-lg border border-neutral-300 p-2 text-sm"
                />
                {closeErr && <p className="text-sm text-red-600">{closeErr}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClosing(false)}
                    disabled={closeBusy}
                    className="flex-1 rounded-lg border border-neutral-300 py-2 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={closeTicket}
                    disabled={rating < 1 || closeBusy}
                    className="flex-1 rounded-lg bg-[#6b1f2a] py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {closeBusy ? "Closing..." : "Submit & close"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {detail.order ? (
          (() => {
            const o = detail.order;
            const items: any[] = rawOrderItems(o);
            const orderHref = `/shop/orders/${encodeURIComponent(String(o._id))}`;
            const orderNo =
              o.orderNumber ?? o.orderId ?? String(o._id).slice(-6);
            const total =
              Number(o.totalAmount) > 0
                ? Number(o.totalAmount)
                : Number(o.quote?.total ?? 0);
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
                  <p className="text-sm font-semibold text-neutral-800">
                    Complaint regarding this order
                  </p>
                  <Link
                    href={orderHref}
                    className="text-sm font-medium text-[#6b1f2a] hover:underline"
                  >
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
                    <p className="font-semibold text-neutral-800">
                      {total > 0 ? inr(total) : "Price pending"}
                    </p>
                  </div>
                  {(o.paymentMethod || o.paymentStatus) && (
                    <div className="col-span-2">
                      <p className="text-neutral-500">Payment</p>
                      <p className="font-semibold text-neutral-800">
                        {[
                          o.paymentMethod === "COD"
                            ? "Cash on Delivery"
                            : o.paymentMethod,
                          o.paymentStatus &&
                            String(o.paymentStatus).toLowerCase(),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  )}
                  {addrText && (
                    <div className="col-span-2">
                      <p className="text-neutral-500">Delivery address</p>
                      <p className="font-semibold text-neutral-800">
                        {addrText}
                      </p>
                    </div>
                  )}
                </div>

                <p className="mb-2 mt-4 text-xs font-semibold uppercase text-neutral-500">
                  {items.length > 1
                    ? `Products in this order (${items.length})`
                    : "Product"}
                </p>
                <div className="space-y-2">
                  {items.map((it: any, i: number) => {
                    const img = itemImage(it);
                    const name = itemName(it);
                    const qty = itemQty(it);
                    const variant = [it.color, it.size, it.weight, it.height]
                      .filter(Boolean)
                      .join(" · ");
                    const unit =
                      it.offerPrice != null ? Number(it.offerPrice) : null;
                    return (
                      <Link
                        key={it._id ?? i}
                        href={orderHref}
                        className="flex items-center gap-3 rounded-lg border border-neutral-200 p-2 transition hover:border-[#6b1f2a]/50 hover:bg-[#fff8e6]"
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={img}
                            alt={name}
                            className="h-16 w-16 shrink-0 rounded-lg border object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-neutral-800">
                            {name}
                          </p>
                          {variant && (
                            <p className="truncate text-xs text-neutral-500">
                              {variant}
                            </p>
                          )}
                          <p className="text-xs text-neutral-500">
                            {unit != null
                              ? `Qty ${qty} × ${inr(unit)}`
                              : `Qty ${qty}`}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-[#6b1f2a]">
                          →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-4 text-sm text-neutral-500">
            No order is linked to this ticket.
          </div>
        )}

        {detail.messages.length > 0 && (
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-neutral-800">
              Chat history
            </p>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {detail.messages.map((m) => (
                <div
                  key={m._id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
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
                    {m.role === "assistant"
                      ? m.content.replace(/\*\*/g, "")
                      : m.content}
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
        )}
      </div>
    );
  }

  /* ---------- LIST ---------- */
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold text-[#6b1f2a]">My Tickets</h2>
        <button
          type="button"
          onClick={() => setView("new")}
          className="rounded-lg bg-[#6b1f2a] px-3 py-1.5 text-sm font-semibold text-white"
        >
          + New Ticket
        </button>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && tickets.length === 0 && (
        <div className="rounded-xl border border-dashed p-8 text-center text-sm text-neutral-500">
          No tickets yet. If you have a complaint, tap &quot;New Ticket&quot; to
          raise one.
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
              {t.unreadByUser > 0 && (
                <span
                  className="h-2 w-2 rounded-full bg-red-500"
                  title="New update"
                />
              )}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS[t.status].cls}`}
            >
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