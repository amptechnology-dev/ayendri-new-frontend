"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
const Svg = ({ children, className = "h-4 w-4" }: { children: React.ReactNode; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}
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
const Spinner = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-20" />
    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

export default function ChatBotWidget() {
  const pathname = usePathname();
  // Store page er route onujayi regex ta bodle nin. Example: /shop/store/<24-char id>
  const storeId =
    pathname.match(/\/shop\/(?:store|stores)\/([a-f0-9]{24})/i)?.[1] ||
    undefined;

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
          ...(storeId ? { storeId } : {}),
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

  const iconBtn =
    "flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 transition hover:bg-[#6b1f2a]/10 hover:text-[#6b1f2a]";
  const field =
    "w-full rounded-lg border border-neutral-200/80 bg-white/60 px-3 py-2 text-[13px] text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#6b1f2a]/50";

  return (
    <>
      {/* Floating button (mobile e BottomNav er upore) */}
      {!open && (
        <button
          type="button"
          aria-label="Open AYENDRI chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-24 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#6b1f2a] text-white shadow-lg shadow-black/20 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#6b1f2a]/40 md:bottom-8 md:right-8"
        >
          <IconChat className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 md:inset-x-auto md:bottom-8 md:right-8 md:w-[340px]">
          <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/70 shadow-[0_20px_50px_rgba(0,0,0,0.15)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/5 bg-white/40 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6b1f2a]" />
                <p className="text-[13px] font-medium tracking-wide text-neutral-900">
                  AYENDRI Assistant
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <button type="button" onClick={startFreshChat} title="New chat" aria-label="New chat" className={iconBtn}>
                  <IconPlus className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={startFreshChat} title="Delete chat" aria-label="Delete chat" className={iconBtn}>
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setOpen(false)} title="Close" aria-label="Close chat" className={iconBtn}>
                  <IconClose className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="relative flex h-[min(54vh,420px)] flex-col">
              {showForm && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 px-5 backdrop-blur-md">
                  <form
                    onSubmit={handleFormSubmit}
                    className="w-full max-w-[280px] space-y-3 rounded-xl border border-white/60 bg-white/70 p-4 shadow-lg backdrop-blur-xl"
                  >
                    <div>
                      <h3 className="text-[13px] font-medium text-neutral-900">Before we start</h3>
                      <p className="text-[11px] text-neutral-500">Please share your name and phone number.</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-600">Name</label>
                      <input
                        value={form.name}
                        onChange={(e) => { setFormError(""); setForm((p) => ({ ...p, name: e.target.value })); }}
                        placeholder="Your name"
                        className={field}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-neutral-600">Phone</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => { setFormError(""); setForm((p) => ({ ...p, phone: e.target.value })); }}
                        placeholder="Your phone number"
                        className={field}
                      />
                    </div>
                    {formError && <p className="text-[11px] text-[#6b1f2a]">{formError}</p>}
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-[#6b1f2a] py-2 text-[13px] font-medium text-white transition hover:bg-[#561922]"
                    >
                      Start Chatting
                    </button>
                    <p className="text-center text-[10px] text-neutral-400">
                      Used only to assist you and follow up if needed.
                    </p>
                  </form>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
                {historyLoading && (
                  <div className="flex justify-center">
                    <div className="flex items-center gap-1.5 rounded-full border border-black/5 bg-white/60 px-2.5 py-1 text-[11px] text-neutral-500">
                      <Spinner className="h-3 w-3 text-[#6b1f2a]" /> Loading...
                    </div>
                  </div>
                )}

                {messages.map((m) => {
                  const isUser = m.role === "user";
                  return (
                    <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-3 py-2 text-[13px] leading-5 ${
                          isUser
                            ? "rounded-br-sm bg-[#6b1f2a] text-white"
                            : "rounded-bl-sm border border-white/60 bg-white/70 text-neutral-800"
                        }`}
                      >
                        {m.role === "assistant"
                          ? m.content.replace(/\*\*/g, "")
                          : m.content}
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1.5 rounded-xl rounded-bl-sm border border-white/60 bg-white/70 px-3 py-2 text-[12px] text-neutral-500">
                      <Spinner className="h-3 w-3 text-[#6b1f2a]" /> Thinking...
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>

              {/* Input area */}
              <div className="border-t border-black/5 bg-white/40 px-3 py-2.5">
                <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => sendMessage(c.query)}
                      disabled={loading}
                      className="shrink-0 rounded-full border border-neutral-300/70 bg-white/50 px-2.5 py-1 text-[11px] text-neutral-600 transition hover:border-[#6b1f2a]/50 hover:text-[#6b1f2a] disabled:cursor-not-allowed disabled:opacity-50"
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
                    rows={1}
                    maxLength={1000}
                    className="max-h-24 min-h-[38px] flex-1 resize-none rounded-lg border border-neutral-200/80 bg-white/60 px-3 py-2 text-[13px] text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-[#6b1f2a]/50"
                  />
                  <button
                    type="submit"
                    disabled={!canSend}
                    aria-label="Send"
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg bg-[#6b1f2a] text-white transition hover:bg-[#561922] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <IconSend className="h-3.5 w-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}