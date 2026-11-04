"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// NEXT_PUBLIC_API_URL e jodi already "/api" thake, tahole path theke "/api" soriye nin
const API = process.env.NEXT_PUBLIC_API_URL;
const CHAT_URL = `${API}/api/chatbot/chat`;
const HISTORY_URL = `${API}/api/chatbot/history`;

const SESSION_KEY = "ayendri_chat_session";
const USER_INFO_KEY = "ayendri_chat_user_info";

type Role = "user" | "assistant";
type Msg = { id: string; role: Role; content: string };
type UserInfo = { name: string; phoneNumber: string };

const INITIAL_MESSAGES: Msg[] = [
  {
    id: "welcome",
    role: "assistant",
    content:
      "Namaste 🙏 I'm the AYENDRI Assistant. Ask me about products, orders, delivery, payments or returns.",
  },
];

const CATEGORIES = [
  { id: "order", label: "Order Help", query: "I need help with my order." },
  { id: "track", label: "Track Order", query: "How can I track my order?" },
  { id: "delivery", label: "Delivery", query: "Tell me about delivery and shipping." },
  { id: "payment", label: "Payment", query: "What payment options are available?" },
  { id: "return", label: "Returns & Refunds", query: "How do I return or get a refund for an order?" },
  { id: "seller", label: "Become a Seller", query: "How can I sell my products on AYENDRI?" },
  { id: "other", label: "Other", query: "I have a different query." },
];

const makeId = (p: string) =>
  `${p}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

const generateSessionId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 12);

const normalizeHistory = (raw: any): Msg[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      const content = String(item?.content ?? "").trim();
      if (!content) return null;
      return {
        id: item?._id || `history-${i}`,
        role: (String(item?.role).toLowerCase() === "user" ? "user" : "assistant") as Role,
        content,
      };
    })
    .filter(Boolean) as Msg[];
};

const readUserInfo = (): UserInfo | null => {
  try {
    const s = localStorage.getItem(USER_INFO_KEY);
    if (!s) return null;
    const p = JSON.parse(s);
    return p?.name && p?.phoneNumber ? p : null;
  } catch {
    return null;
  }
};

/* ---------- tiny inline icons ---------- */
const Svg = ({ children, className = "h-5 w-5" }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);
const IconChat = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></Svg>
);
const IconClose = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M18 6 6 18M6 6l12 12" /></Svg>
);
const IconPlus = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M12 5v14M5 12h14" /></Svg>
);
const IconTrash = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></Svg>
);
const IconSend = ({ className }: { className?: string }) => (
  <Svg className={className}><path d="m22 2-7 20-4-9-9-4zM22 2 11 13" /></Svg>
);
const Spinner = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="opacity-75" />
  </svg>
);

export default function ChatBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [formError, setFormError] = useState("");
  const [bootstrapped, setBootstrapped] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const didInitialScroll = useRef(false);

  const canSend = useMemo(() => Boolean(input.trim()) && !loading, [input, loading]);

  // bootstrap: session + saved user info
  useEffect(() => {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = generateSessionId();
      localStorage.setItem(SESSION_KEY, sid);
    }
    setSessionId(sid);
    setUserInfo(readUserInfo());
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (open && bootstrapped && !userInfo) setShowForm(true);
  }, [open, bootstrapped, userInfo]);

  // history load
  useEffect(() => {
    if (!sessionId) return;
    const run = async () => {
      setHistoryLoading(true);
      didInitialScroll.current = false;
      try {
        const res = await fetch(`${HISTORY_URL}/${sessionId}`);
        const json = await res.json();
        if (!res.ok || !json?.success) return;
        const normalized = normalizeHistory(json.data);
        if (normalized.length > 0) setMessages([...INITIAL_MESSAGES, ...normalized]);
      } catch (e) {
        console.log(e);
      } finally {
        setHistoryLoading(false);
      }
    };
    run();
  }, [sessionId]);

  // scroll: prothombar instant, tarpor smooth
  useEffect(() => {
    if (historyLoading || !open) return;
    const go = (behavior: ScrollBehavior) =>
      endRef.current?.scrollIntoView({ behavior, block: "end" });

    if (!didInitialScroll.current) {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          go("auto");
          didInitialScroll.current = true;
        }),
      );
      return;
    }
    go("smooth");
  }, [messages, open, historyLoading]);

  const append = (role: Role, content: string) =>
    setMessages((cur) => [...cur, { id: makeId(role), role, content }]);

  const sendMessage = async (value: string) => {
    const message = String(value || "").trim();
    if (!message || loading || !sessionId || !userInfo) return;

    append("user", message);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message,
          name: userInfo.name,
          phoneNumber: userInfo.phoneNumber,
        }),
      });
      const json = await res.json();

      if (json?.data?.sessionId && json.data.sessionId !== sessionId) {
        localStorage.setItem(SESSION_KEY, json.data.sessionId);
        setSessionId(json.data.sessionId);
      }

      const reply = json?.data?.reply;
      if (!res.ok || !json?.success || !reply) {
        throw new Error(json?.message || "Bot response failed");
      }
      append("assistant", reply);
    } catch (e: any) {
      append("assistant", e?.message || "Sorry, I could not respond just now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const name = form.name.trim();
    const phone = form.phone.trim();

    if (name.length < 2) return setFormError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 10)
      return setFormError("Please enter a valid phone number.");

    const info = { name, phoneNumber: phone };
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info));
    setUserInfo(info);
    setShowForm(false);
  };

  const startFreshChat = () => {
    const id = generateSessionId();
    localStorage.setItem(SESSION_KEY, id);
    didInitialScroll.current = false;
    setSessionId(id);
    setMessages(INITIAL_MESSAGES);
    setInput("");
    if (!userInfo) setShowForm(true);
  };

  return (
    <>
      {/* Floating button (mobile e BottomNav er upore) */}
      {!open && (
        <button
          type="button"
          aria-label="Open AYENDRI chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-amber-300 md:bottom-8 md:right-8"
        >
          <IconChat className="h-7 w-7" />
          <span className="absolute -right-1 -top-1 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400" />
          </span>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 md:inset-x-auto md:bottom-8 md:right-8 md:w-[400px]">
          <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-[0_30px_80px_rgba(120,53,15,0.3)]">
            {/* Header */}
            <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 px-4 py-3 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                    <IconChat className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-semibold leading-tight">AYENDRI Assistant</p>
                    <p className="flex items-center gap-1.5 text-xs text-white/85">
                      <span className="h-2 w-2 rounded-full bg-emerald-300" /> Online
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={startFreshChat} title="New chat" aria-label="New chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
                    <IconPlus className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={startFreshChat} title="Delete chat" aria-label="Delete chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-red-700/70">
                    <IconTrash className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setOpen(false)} title="Close" aria-label="Close chat"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/30">
                    <IconClose className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="relative flex h-[min(62vh,540px)] flex-col bg-amber-50/40">
              {showForm && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95 px-5 backdrop-blur-sm">
                  <form onSubmit={handleFormSubmit}
                    className="w-full max-w-sm space-y-3 rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Before we start chatting</h3>
                      <p className="text-xs text-gray-500">Please share your name and phone number.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Your Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => { setFormError(""); setForm((p) => ({ ...p, name: e.target.value })); }}
                        placeholder="Enter your name"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-700">Phone Number</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => { setFormError(""); setForm((p) => ({ ...p, phone: e.target.value })); }}
                        placeholder="Enter your phone number"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                      />
                    </div>
                    {formError && <p className="text-xs font-medium text-red-500">{formError}</p>}
                    <button type="submit"
                      className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-red-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5">
                      Start Chatting
                    </button>
                    <p className="text-center text-[11px] text-gray-400">
                      We use this only to assist you better and follow up if needed.
                    </p>
                  </form>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {historyLoading && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs text-gray-600">
                      <Spinner className="h-3.5 w-3.5 text-orange-500" /> Loading conversation...
                    </div>
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 shadow-sm ${
                          isUser
                            ? "rounded-br-md bg-gradient-to-br from-amber-500 to-red-600 text-white"
                            : "rounded-bl-md border border-amber-100 bg-white text-gray-800"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-amber-100 bg-white px-4 py-2.5 text-sm text-gray-600 shadow-sm">
                      <Spinner className="h-4 w-4 text-orange-500" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-amber-100 bg-white px-4 py-3">
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => sendMessage(c.query)}
                      disabled={loading}
                      className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    rows={2}
                    maxLength={1000}
                    className="min-h-[56px] flex-1 resize-none rounded-2xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-md transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <IconSend className="h-4 w-4" />
                  </button>
                </form>
                <p className="mt-1.5 text-[11px] text-gray-400">
                  Enter to send, Shift + Enter for a new line.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}