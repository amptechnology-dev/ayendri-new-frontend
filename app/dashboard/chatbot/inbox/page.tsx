"use client";

import React, { useEffect, useRef, useState } from "react";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import OrderSummary, { OrderLite } from "@/components/chatbot/OrderSummary";

type Conv = {
  _id: string;
  name: string;
  phoneNumber: string;
  mode: "bot" | "human";
  status: "active" | "closed";
  unreadByStore: number;
  humanRequested?: boolean;
  lastMessageAt: string;
  lastMessagePreview: string;
  storeId?: { storeName?: string } | string;
  orderId?: { _id: string; orderNumber?: string; status?: string } | string | null;
};
type Msg = {
  _id: string;
  role: "user" | "assistant" | "store";
  content: string;
  createdAt: string;
};

const BASE = "/api/chatbot/conversations";
const notifySidebar = () => window.dispatchEvent(new Event("storeChatChanged"));
const notifyTickets = () => window.dispatchEvent(new Event("storeTicketsChanged"));

const initial = (n?: string) => (n?.trim()?.[0] || "C").toUpperCase();

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const orderNo = (c: Conv) =>
  c.orderId && typeof c.orderId === "object" ? c.orderId.orderNumber : "";

export default function ChatInboxPage() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "needs">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<Conv | null>(null);
  const [order, setOrder] = useState<OrderLite | null>(null);
  const [showOrder, setShowOrder] = useState(true);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketForm, setTicketForm] = useState({ subject: "", description: "" });
  const [raising, setRaising] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const fetchList = async () => {
    try {
      const res = await axiosInstance.get(BASE, {
        params: { limit: 50, ...(search ? { search } : {}) },
      });
      setConvs(res.data.conversations || []);
    } catch {}
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await axiosInstance.get(`${BASE}/${id}/messages`);
      setMessages(res.data.messages || []);
      setActive(res.data.conversation);
      setOrder(res.data.order || null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load chat");
    }
  };

  useEffect(() => {
    fetchList();
    const t = setInterval(() => !document.hidden && fetchList(), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (!activeId) return;
    lastCount.current = 0;
    fetchMessages(activeId).then(() => {
      notifySidebar();
      fetchList();
    });
    const t = setInterval(() => !document.hidden && fetchMessages(activeId), 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // chat box er bhitore-i scroll (puro page na)
  useEffect(() => {
    if (messages.length === lastCount.current) return;
    const first = lastCount.current === 0;
    lastCount.current = messages.length;
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: first ? "auto" : "smooth" });
  }, [messages]);

  const send = async () => {
    const content = text.trim();
    if (!content || !activeId || sending) return;
    setSending(true);
    try {
      await axiosInstance.post(`${BASE}/${activeId}/messages`, { content });
      setText("");
      await fetchMessages(activeId);
      fetchList();
      notifySidebar();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || "Send failed",
      );
    } finally {
      setSending(false);
    }
  };

  const updateState = async (body: { mode?: "bot" | "human"; status?: "active" | "closed" }) => {
    if (!activeId) return;
    try {
      await axiosInstance.patch(`${BASE}/${activeId}/state`, body);
      toast.success(body.mode === "bot" ? "Bot is handling this chat again" : "Updated");
      await fetchMessages(activeId);
      fetchList();
      notifySidebar();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const openTicketDialog = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    setTicketForm({
      subject: order?.orderNumber ? `Order #${order.orderNumber}: ` : "",
      description: lastUser?.content?.slice(0, 500) || "",
    });
    setTicketOpen(true);
  };

  const raiseTicket = async () => {
    if (!activeId || raising) return;
    setRaising(true);
    try {
      const res = await axiosInstance.post("/api/ticket/store", {
        conversationId: activeId,
        ...(order?._id ? { orderId: order._id } : {}),
        subject: ticketForm.subject,
        description: ticketForm.description,
      });
      toast.success(`Ticket #${res.data.ticket.ticketNo} raised`);
      setTicketOpen(false);
      await fetchMessages(activeId);
      fetchList();
      notifyTickets();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0]?.message ||
          err?.response?.data?.message ||
          "Failed to raise ticket",
      );
    } finally {
      setRaising(false);
    }
  };

  const visible = filter === "needs" ? convs.filter((c) => c.humanRequested || c.unreadByStore > 0) : convs;
  const storeName = (c: Conv) => (typeof c.storeId === "object" ? c.storeId?.storeName : "");

  return (
    <div className="w-full pt-2">
      <div className="grid h-[calc(100vh-150px)] min-h-[520px] grid-cols-1 grid-rows-[minmax(0,1fr)] overflow-hidden rounded-xl bg-white shadow md:grid-cols-[340px_minmax(0,1fr)]">
        {/* ============ LEFT ============ */}
        <div className={`min-h-0 flex-col border-r ${activeId ? "hidden md:flex" : "flex"}`}>
          <div className="shrink-0 space-y-2 border-b p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Customer Chats</h2>
              <span className="text-xs text-gray-400">{convs.length}</span>
            </div>
            <InputText
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name / phone"
              className="p-inputtext-sm w-full"
            />
            <div className="flex gap-1.5">
              {(["all", "needs"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f === "all" ? "All" : "Needs reply"}
                </button>
              ))}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {visible.length === 0 && <p className="p-4 text-sm text-gray-500">No chats.</p>}
            {visible.map((c) => (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`flex w-full gap-2.5 border-b px-3 py-2.5 text-left transition hover:bg-blue-50 ${
                  activeId === c._id ? "bg-blue-50" : ""
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  {initial(c.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-gray-800">
                      {c.name || "Customer"}
                    </span>
                    <span className="shrink-0 text-[10px] text-gray-400">{timeAgo(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-gray-500">{c.lastMessagePreview}</p>
                    {c.unreadByStore > 0 && (
                      <span className="shrink-0 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {c.unreadByStore}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px]">
                    <span
                      className={`rounded-full px-1.5 py-0.5 ${
                        c.mode === "human" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.mode === "human" ? "You" : "Bot"}
                    </span>
                    {c.humanRequested && c.mode !== "human" && (
                      <span className="rounded-full bg-red-100 px-1.5 py-0.5 font-semibold text-red-700">
                        Needs reply
                      </span>
                    )}
                    {orderNo(c) && (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-800">
                        🛒 #{orderNo(c)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ============ RIGHT ============ */}
        <div className={`min-h-0 min-w-0 flex-col overflow-hidden ${activeId ? "flex" : "hidden md:flex"}`}>
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-gray-400">
              <i className="pi pi-comments text-4xl" />
              <span className="text-sm">Select a chat to start</span>
            </div>
          ) : (
            <>
              {/* header */}
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Button
                    icon="pi pi-arrow-left"
                    text
                    className="md:!hidden"
                    onClick={() => {
                      setActiveId(null);
                      setActive(null);
                      setOrder(null);
                    }}
                  />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {initial(active.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-800">
                      {active.name || "Customer"}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {active.phoneNumber}
                      {storeName(active) ? ` · ${storeName(active)}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order && (
                    <Button
                      size="small"
                      text
                      icon={showOrder ? "pi pi-chevron-up" : "pi pi-chevron-down"}
                      label={`Order #${order.orderNumber}`}
                      onClick={() => setShowOrder((v) => !v)}
                    />
                  )}
                  {active.mode === "human" ? (
                    <Button
                      size="small"
                      outlined
                      label="Back to bot"
                      icon="pi pi-android"
                      onClick={() => updateState({ mode: "bot" })}
                    />
                  ) : (
                    <Button
                      size="small"
                      outlined
                      label="Take over"
                      icon="pi pi-user"
                      onClick={() => updateState({ mode: "human" })}
                    />
                  )}
                  <Button
                    size="small"
                    severity="warning"
                    outlined
                    label="Raise Ticket"
                    icon="pi pi-ticket"
                    onClick={openTicketDialog}
                  />
                </div>
              </div>

              {/* order panel */}
              {order && showOrder && (
                <div className="max-h-56 shrink-0 overflow-y-auto border-b bg-white p-3">
                  <OrderSummary order={order} />
                </div>
              )}

              {/* messages: eta-i scroll korbe */}
              <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
                {messages.map((m) => {
                  const mine = m.role === "store";
                  return (
                    <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm [overflow-wrap:anywhere] ${
                          mine
                            ? "rounded-br-sm bg-blue-600 text-white"
                            : m.role === "assistant"
                              ? "rounded-bl-sm border border-dashed border-gray-300 bg-gray-100 text-gray-600"
                              : "rounded-bl-sm border bg-white text-gray-800"
                        }`}
                      >
                        {m.role === "assistant" && (
                          <span className="mb-0.5 block text-[10px] font-semibold uppercase">Bot</span>
                        )}
                        {m.content}
                        <span className="mt-1 block text-right text-[10px] opacity-60">
                          {new Date(m.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* input: sobsomoy niche */}
              <div className="flex shrink-0 items-end gap-2 border-t bg-white p-3">
                <InputTextarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  autoResize
                  maxLength={1000}
                  placeholder="Type your reply..."
                  className="max-h-28 flex-1"
                />
                <Button
                  icon={sending ? "pi pi-spin pi-spinner" : "pi pi-send"}
                  onClick={send}
                  disabled={sending || !text.trim()}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog
        header="Raise Ticket"
        visible={ticketOpen}
        style={{ width: "32rem" }}
        breakpoints={{ "641px": "95vw" }}
        onHide={() => setTicketOpen(false)}
      >
        <div className="space-y-3">
          {order ? (
            <OrderSummary order={order} compact />
          ) : (
            <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
              No order is linked to this chat. This will be a general ticket.
            </p>
          )}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Subject *</label>
            <InputText
              className="w-full"
              value={ticketForm.subject}
              onChange={(e) => setTicketForm((p) => ({ ...p, subject: e.target.value }))}
              placeholder="e.g. Wrong item delivered"
              maxLength={150}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Complaint details *</label>
            <InputTextarea
              className="w-full"
              rows={5}
              autoResize
              value={ticketForm.description}
              onChange={(e) => setTicketForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={2000}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              label="Cancel"
              outlined
              className="flex-1"
              onClick={() => setTicketOpen(false)}
              disabled={raising}
            />
            <Button
              label={raising ? "Raising..." : "Raise Ticket"}
              icon={raising ? "pi pi-spin pi-spinner" : "pi pi-check"}
              className="flex-1"
              onClick={raiseTicket}
              disabled={
                raising ||
                ticketForm.subject.trim().length < 3 ||
                ticketForm.description.trim().length < 5
              }
            />
          </div>
        </div>
      </Dialog>
      <ToastContainer position="top-right" />
    </div>
  );
}