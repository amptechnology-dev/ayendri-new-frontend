"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, Bell, Heart, ShoppingCart, Truck, ChevronDown, ChevronRight, Flame, Landmark, MapPin } from "lucide-react";
import { useCart } from "../cart";
import { useOrders } from "../orders";
import AccountMenu from "./AccountMenu";
import { useShop } from "../shop-data";
import { useWishlist } from "../wishlist-store";
import { useAuth } from "../auth";
import HeaderArt from "./HeaderArt";

const HINTS = ["Shri Yantra", "Ganesh idol", "Karungali mala", "Rudraksha", "Tulsi mala", "Pyrite frame", "Puja booking"];

// TODO: put your real store details here
// const STORE = {
//   label: "Our Store",
//   place: "Dunlop, Kolkata",
//   href: "/store", // or a Google Maps link, e.g. "https://maps.google.com/?q=Ayendri+Dunlop+Kolkata"
// };

/* ---------- shared button styles (high contrast on the maroon header) ---------- */

// round icon buttons: bell, wishlist, cart
const ICON_BTN =
  "relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#f6c453]/70 bg-white/15 text-white " +
  "shadow-[0_2px_10px_rgba(0,0,0,.35)] backdrop-blur transition duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#fff1c2] hover:bg-[#f2b632] hover:text-[#4a0710] active:scale-95 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1c2]";

// notification count badges
const BADGE =
  "absolute -right-1.5 -top-1.5 grid h-[20px] min-w-[20px] place-items-center rounded-full bg-[#e0262d] px-1 " +
  "text-[11px] font-extrabold text-white shadow-md ring-2 ring-[#fff1c2]";

// solid gold pills (Diwali Offers, Pujas)
const GOLD_PILL =
  "relative flex shrink-0 items-center gap-2 rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] " +
  "px-4 py-2.5 font-extrabold text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.35)] transition duration-200 " +
  "hover:-translate-y-0.5 hover:brightness-105 active:scale-95";

// outlined glass pills (Shop All, store, categories)
const GLASS_PILL =
  "flex shrink-0 items-center gap-2 rounded-full border border-white/40 bg-white/15 text-white " +
  "shadow-[0_2px_8px_rgba(0,0,0,.25)] backdrop-blur transition duration-200 " +
  "hover:border-[#f6c453] hover:bg-white/25 active:scale-95";

// pill badges ("Sale", "New")
const TAG =
  "absolute -top-2 right-2 rounded-full bg-[#e0262d] px-2 py-px text-[9px] font-extrabold text-white shadow ring-1 ring-[#fff1c2]";

export default function ShopHeader() {
  const router = useRouter();
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const unread = useOrders((s) => s.notices.filter((n) => !n.read).length);
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);
  const loaded = useShop((s) => s.loaded);
  const token = useAuth((s) => s.token);
  const authReady = useAuth((s) => s.ready);
  const wishCount = useWishlist((s) => s.ids.size);
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hint, setHint] = useState(0);
  const [val, setVal] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [subIdx, setSubIdx] = useState(0);
  const [bump, setBump] = useState(false);

  // mega menu closes shortly after the cursor leaves BOTH the category pills and the menu
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    void useShop.getState().load();
  }, []);

  // load wishlist when logged in, clear it on logout
  useEffect(() => {
    if (!authReady) return;
    if (token) void useWishlist.getState().load(true);
    else useWishlist.getState().clear();
  }, [authReady, token]);

  // scroll-aware theme
  useEffect(() => {
    // different thresholds for on/off, so the layout shift can't flip it back
    const on = () => {
      const y = window.scrollY;
      setScrolled((s) => (s ? y > 8 : y > 90));
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // rotating placeholder
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2600);
    return () => clearInterval(t);
  }, []);

  // cart badge bump
  useEffect(() => {
    if (!mounted || count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(t);
  }, [count, mounted]);

  // voice search (Web Speech API)
  const [listening, setListening] = useState(false);
  const [voiceMsg, setVoiceMsg] = useState("");
  const recRef = useRef<any>(null);

  const startVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg("Voice search isn't supported in this browser. Try Chrome or Edge.");
      return;
    }

    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";

    rec.onstart = () => {
      setListening(true);
      setVoiceMsg("");
    };
    rec.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      finalText = text.trim();
      setVal(finalText);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceMsg("Microphone access is blocked. Allow it in your browser settings.");
      } else if (e.error === "no-speech") {
        setVoiceMsg("Didn't catch that. Please try again.");
      } else if (e.error !== "aborted") {
        setVoiceMsg("Voice search failed. Please try again.");
      }
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText) router.push(`/shop/search?q=${encodeURIComponent(finalText)}`);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  // stop the mic if the header unmounts
  useEffect(() => {
    return () => {
      if (recRef.current) {
        recRef.current.onend = null;
        recRef.current.abort();
      }
    };
  }, []);

  // mega menu data (backend categories + products only)
  const active = loaded ? categories.find((c) => c.slug === open) : undefined;
  const catProducts = active ? products.filter((p) => p.category === active.slug).slice(0, 10) : [];
  const subs = active ? (active.sub.length ? active.sub : [`All ${active.name}`]) : [];
  const subSel = subs[subIdx] ? subIdx : 0;
  const subHref = (s: string) =>
    active && active.sub.length
      ? `/shop/category/${active.slug}?sub=${encodeURIComponent(s)}`
      : `/shop/category/${active?.slug}`;

  return (
    <header data-scrolled={scrolled} className="shop-header shop-hero-bg sticky top-0 z-40 text-white shadow-lg">
      <HeaderArt />
      {/* announcement strip (collapses on scroll) */}
      <div className="shop-strip flex items-center justify-between gap-3 px-4 py-2 text-[13px] font-semibold md:px-6">
        <span className="hidden w-[170px] md:block" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-center">Flat 50% Off · Up to 70% Off on Combos</span>
        <Link
          href="/shop/orders"
          className="flex w-[170px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] px-3.5 py-1.5 text-xs font-extrabold text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.3)] transition hover:brightness-105 active:scale-95 max-md:w-auto"
        >
          <Truck size={14} /> Track Order
        </Link>
      </div>

      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-5 py-2">
        <Link href="/shop" className="flex items-center gap-2">
          <Image src="/img/photos/ayendri-logo.png" alt="AYENDRI" width={44} height={44} />
          <div className="leading-tight">
            <div className="text-xl font-extrabold tracking-[.18em]">AYENDRI</div>
            <div className="text-[10px] opacity-80">Sacred · Vedic · Lifestyle</div>
          </div>
        </Link>

        {/* search with rotating placeholder */}
        <form
          onSubmit={(e) => { e.preventDefault(); router.push(`/shop/search?q=${encodeURIComponent(val)}`); }}
          className="shop-search relative mx-auto flex h-12 w-full max-w-[580px] items-center gap-3 rounded-full border border-white/50 bg-white/20 px-5 shadow-[0_2px_10px_rgba(0,0,0,.25)] backdrop-blur transition focus-within:border-[#f6c453] focus-within:bg-white/25"
        >
          <Search size={20} className="shrink-0 text-white" />
          <div className="relative flex-1 overflow-hidden">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onFocus={() => !val && router.push("/shop/search")}
              className="relative z-10 h-12 w-full bg-transparent text-sm text-white outline-none"
              aria-label="Search"
            />
            {!val && (
              <span key={hint} className="shop-ph pointer-events-none absolute inset-0 flex items-center text-sm text-white/90">
                {listening ? "Listening…" : <>Search “{HINTS[hint]}”</>}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={startVoice}
            aria-label={listening ? "Stop voice search" : "Voice search"}
            aria-pressed={listening}
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-b from-[#ffd66b] to-[#f2b632] text-[#4a0710] shadow transition hover:brightness-105 active:scale-95 ${
              listening ? "animate-pulse ring-2 ring-[#e0262d]" : ""
            }`}
          >
            <Mic size={16} />
          </button>
          {voiceMsg && (
            <span
              role="alert"
              className="absolute left-5 top-full z-50 mt-1 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#4a0710] shadow-lg"
            >
              {voiceMsg}
            </span>
          )}
        </form>

        <div className="ml-auto flex items-center gap-3">
          {/* <Link
            href={STORE.href}
            className={`${GLASS_PILL} hidden px-4 py-2 text-sm font-semibold lg:flex`}
            aria-label={`${STORE.label}: ${STORE.place}`}
          >
            <MapPin size={18} className="text-[#ffd66b]" />
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-white/80">{STORE.label}</span>
              <span className="block max-w-[160px] truncate">{STORE.place}</span>
            </span>
          </Link> */}

          <Link href="/shop/notifications" className={ICON_BTN} aria-label="Notifications">
            <Bell size={20} />
            {mounted && unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full bg-[#e0262d] ring-2 ring-[#fff1c2]" />
            )}
          </Link>

          <Link href="/shop/wishlist" className={ICON_BTN} aria-label="Wishlist">
            <Heart size={20} />
            {mounted && wishCount > 0 && <span className={BADGE}>{wishCount}</span>}
          </Link>

          <AccountMenu />

          <Link href="/shop/cart" className={ICON_BTN} aria-label="Cart">
            <ShoppingCart size={20} />
            <span className={`${bump ? "shop-bump" : ""} ${BADGE}`}>{mounted ? count : 0}</span>
          </Link>
        </div>
      </div>

      {/* nav row */}
      <nav className="shop-scroll mx-auto flex min-h-[52px] max-w-[1400px] items-center gap-3 overflow-x-auto px-5 pb-3 pt-2 text-sm font-semibold">
        <Link href="/shop/category/idols" onMouseEnter={() => setOpen(null)} className={GOLD_PILL}>
          <span className={TAG}>Sale</span>
          <Flame size={16} /> Diwali Offers
        </Link>
        <Link href="/shop/category/services" onMouseEnter={() => setOpen(null)} className={GOLD_PILL}>
          <span className={TAG}>New</span>
          <Landmark size={16} /> Pujas
        </Link>
        <Link
          href="/shop/category/all"
          onMouseEnter={() => setOpen(null)}
          className={`${GLASS_PILL} px-4 py-2.5 font-extrabold`}
        >
          Shop All
        </Link>

        {!loaded &&
          Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-10 w-28 shrink-0 animate-pulse rounded-full bg-white/20" />
          ))}
        {loaded && categories.map((c) => (
          <Link
            key={c.slug}
            href={`/shop/category/${c.slug}`}
            onMouseEnter={() => { cancelClose(); setOpen(c.slug); setSubIdx(0); }}
            onMouseLeave={scheduleClose}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,.25)] transition duration-200 active:scale-95 ${
              open === c.slug
                ? "border-[#fff1c2] bg-[#fffaf3] text-[#4a0710]"
                : "border-white/40 bg-white/15 text-white hover:border-[#f6c453] hover:bg-white/25"
            }`}
          >
            {c.image ? (
              <img src={c.image} alt="" loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover ring-1 ring-white/60" />
            ) : (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f2b632] text-[11px] text-[#4a0710]">✦</span>
            )}
            {c.name}
            <ChevronDown size={14} className={`transition ${open === c.slug ? "rotate-180" : ""}`} />
          </Link>
        ))}
      </nav>

      {/* mega menu: sub-categories on the left, products on the right */}
            {/* mega menu: sub-categories on the left, products on the right */}
      {active && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="shop-mega absolute inset-x-0 top-full z-50 hidden border-t-4 border-[#f2b632] bg-[#fffaf3] text-[#2a0a0d] shadow-2xl md:block"
        >
          <div className="mx-auto grid max-w-[1300px] grid-cols-[280px_1fr] gap-8 px-8 py-6">
            <div className="space-y-3">
              {subs.map((s, i) => (
                <Link
                  key={s}
                  href={subHref(s)}
                  onMouseEnter={() => setSubIdx(i)}
                  className={`flex items-center justify-between rounded-2xl border-2 px-5 py-4 text-sm font-extrabold uppercase tracking-wide shadow-sm transition duration-200 ${
                    i === subSel
                      ? "border-[#f2b632] bg-gradient-to-r from-[#7a1118] to-[#a3161f] !text-white shadow-md"
                      : "border-[#e8d6bd] bg-white !text-[#3a2a22] hover:border-[#f2b632] hover:bg-[#fff1d6]"
                  }`}
                >
                  <span className="!text-inherit">{s}</span>
                  {i === subSel && <ChevronRight size={18} className="shrink-0 !text-[#ffd66b]" />}
                </Link>
              ))}
            </div>

            <div>
              {catProducts.length ? (
                <div className="grid grid-cols-5 gap-x-5 gap-y-6">
                  {catProducts.map((p) => (
                    <Link key={p.slug} href={`/shop/product/${p.slug}`} className="group/p block">
                      <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#e8d6bd] bg-[#f6efe6] shadow-sm transition duration-300 group-hover/p:-translate-y-1 group-hover/p:border-[#f2b632] group-hover/p:shadow-lg">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/p:scale-110"
                        />
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs font-semibold leading-snug !text-[#2a0a0d]">{p.name}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid h-full min-h-[140px] place-items-center rounded-2xl border-2 border-dashed border-[#e8d6bd] bg-white/60 px-6 text-center">
                  <div>
                    <div className="text-2xl">🪔</div>
                    <div className="mt-1 text-sm font-semibold text-[#8b5a3c]">No products in {active.name} yet.</div>
                    <div className="text-xs text-[#a98466]">New arrivals are on the way.</div>
                  </div>
                </div>
              )}

              <Link
                href={subHref(subs[subSel])}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] px-5 py-2.5 text-sm font-extrabold !text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.2)] transition hover:brightness-105 active:scale-95"
              >
                View {active.sub.length ? subs[subSel] : active.name} <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}