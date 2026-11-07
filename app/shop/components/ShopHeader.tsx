"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Mic,
  Bell,
  Heart,
  ShoppingCart,
  Truck,
  ChevronDown,
  ChevronRight,
  Flame,
  Landmark,
  X,
  Menu,
} from "lucide-react";
import { useCart } from "../cart";
import { useOrders } from "../orders";
import AccountMenu from "./AccountMenu";
import { useShop } from "../shop-data";
import { useWishlist } from "../wishlist-store";
import { useAuth } from "../auth";
import HeaderArt from "./HeaderArt";
import { useNotifications } from "../notifications-store";

const HINTS = [
  "Shri Yantra",
  "Ganesh idol",
  "Karungali mala",
  "Rudraksha",
  "Tulsi mala",
  "Pyrite frame",
  "Puja booking",
];

// TODO: put your real store details here
// const STORE = {
//   label: "Our Store",
//   place: "Dunlop, Kolkata",
//   href: "/store", // or a Google Maps link, e.g. "https://maps.google.com/?q=Ayendri+Dunlop+Kolkata"
// };

/* ---------- shared button styles (high contrast on the maroon header) ---------- */

// round icon buttons: bell, wishlist, cart
// smaller on very small phones; the ::after layer keeps the tap area bigger than the circle
const ICON_BTN =
  "relative grid h-9 w-9 min-[380px]:h-10 min-[380px]:w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full " +
  "after:absolute after:-inset-1 after:content-[''] " +
  "border border-[#f6c453]/70 bg-white/15 text-white " +
  "shadow-[0_2px_10px_rgba(0,0,0,.35)] backdrop-blur transition duration-200 " +
  "hover:-translate-y-0.5 hover:border-[#fff1c2] hover:bg-[#f2b632] hover:text-[#4a0710] active:scale-95 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1c2]";
// solid maroon button so it stays visible on the cream, scrolled header
const BTN_SCROLLED = "!border-[#7a1118] !bg-[#7a1118] !text-white";
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
  const pathname = usePathname();
  const count = useCart((s) => s.lines.reduce((a, l) => a + l.qty, 0));
  const unread = useNotifications((s) => s.unread);
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
  const [drawer, setDrawer] = useState(false);

  // close the drawer after navigating
  useEffect(() => {
    setDrawer(false);
  }, [pathname]);

  // lock page scroll + close on Escape while the drawer is open
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  // dynamic search suggestions: every product name, with category names mixed in
  const hints = useMemo(() => {
    const cats = categories.map((c) => c.name).filter(Boolean);
    const prods = Array.from(
      new Set(products.map((p) => p.name).filter(Boolean)),
    );
    const out: string[] = [];
    prods.forEach((name, i) => {
      out.push(name);
      if (cats.length && i % 3 === 2)
        out.push(cats[Math.floor(i / 3) % cats.length]);
    });
    if (out.length) return out;
    return cats.length ? cats : HINTS;
  }, [products, categories]);

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
    closeTimer.current = setTimeout(() => setOpen(null), 200);
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
    const t = setInterval(() => setHint((h) => (h + 1) % hints.length), 2600);
    return () => clearInterval(t);
  }, [hints.length]);

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
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceMsg(
        "Voice search isn't supported in this browser. Try Chrome or Edge.",
      );
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
      for (let i = 0; i < e.results.length; i++)
        text += e.results[i][0].transcript;
      finalText = text.trim();
      setVal(finalText);
    };
    rec.onerror = (e: any) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setVoiceMsg(
          "Microphone access is blocked. Allow it in your browser settings.",
        );
      } else if (e.error === "no-speech") {
        setVoiceMsg("Didn't catch that. Please try again.");
      } else if (e.error !== "aborted") {
        setVoiceMsg("Voice search failed. Please try again.");
      }
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText)
        router.push(`/shop/search?q=${encodeURIComponent(finalText)}`);
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
  const catProducts = active
    ? products.filter((p) => p.category === active.slug).slice(0, 10)
    : [];
  const subs = active
    ? active.sub.length
      ? active.sub
      : [`All ${active.name}`]
    : [];
  const subSel = subs[subIdx] ? subIdx : 0;
  const subHref = (s: string) =>
    active && active.sub.length
      ? `/shop/category/${active.slug}?sub=${encodeURIComponent(s)}`
      : `/shop/category/${active?.slug}`;

  return (
    <header
      data-scrolled={scrolled}
      className="shop-header shop-hero-bg sticky top-0 z-40 text-white shadow-lg"
      style={
        scrolled
          ? {
              background: "rgba(255, 248, 234, 0.45)",
              backdropFilter: "blur(16px) saturate(160%)",
              WebkitBackdropFilter: "blur(16px) saturate(160%)",
              color: "#4a0710",
              borderBottom: "1px solid rgba(242, 182, 50, 0.6)",
              transition: "background .3s ease, backdrop-filter .3s ease",
            }
          : {
              background: "linear-gradient(180deg,#fff8ea 0%,#fde7c8 100%)",
              color: "#4a0710",
              borderBottom: "3px solid #f2b632",
              transition: "background .3s ease",
            }
      }
    >
      <HeaderArt />
      {/* announcement strip (desktop only, collapses on scroll) */}
      <div className="shop-strip flex max-md:hidden items-center justify-between gap-3 px-4 py-2 text-[13px] font-semibold md:px-6">
        <span className="hidden w-[170px] md:block" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-center">
          Flat 50% Off · Up to 70% Off on Combos
        </span>
        <Link
          href="/shop/orders"
          className="flex w-[170px] shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] px-3.5 py-1.5 text-xs font-extrabold text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.3)] transition hover:brightness-105 active:scale-95 max-md:w-auto"
        >
          <Truck size={14} /> Track Order
        </Link>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5 md:flex-nowrap md:gap-4">
        <Link href="/shop" className="flex shrink-0 items-center pl-3 sm:pl-5 md:pl-8" aria-label="AYENDRI home">
          <Image
            src="/img/photos/ayendri.png"
            alt="AYENDRI"
            width={400}
            height={160}
            priority
            className="relative z-10 -mb-[6px] -mt-[22px] h-16 w-auto object-contain min-[380px]:-mb-2 min-[380px]:-mt-6 min-[380px]:h-[72px] sm:-mb-3 sm:-mt-6 sm:h-20 md:-mb-4 md:-mt-9 md:h-24"
          />
        </Link>

        {/* search with rotating placeholder (desktop only) */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.push(`/shop/search?q=${encodeURIComponent(val)}`);
          }}
          className="shop-search max-md:hidden relative order-last flex h-12 w-full basis-full items-center gap-3 rounded-full border border-white/50 bg-white/20 px-4 md:order-none md:mx-auto md:max-w-[580px] md:basis-auto md:px-5 shadow-[0_2px_10px_rgba(0,0,0,.25)] backdrop-blur transition focus-within:border-[#f6c453] focus-within:bg-white/25"
          style={{ background: "#ffffff", borderColor: "#e8cfa8" }}
        >
          <Search
            size={20}
            className="shrink-0 text-white"
            style={{ color: "#7a1118" }}
          />
          <div className="relative flex-1 overflow-hidden">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onFocus={() => !val && router.push("/shop/search")}
              className="relative z-10 h-12 w-full bg-transparent text-base text-white outline-none md:text-sm"
              style={{ color: "#4a0710", caretColor: "#4a0710" }}
              aria-label="Search"
            />
            {!val && (
              <span
                key={hint}
                className="shop-ph pointer-events-none absolute inset-0 flex items-center text-base text-white/90 md:text-sm"
                style={{ color: "#6b4a4a" }}
              >
                <span className="truncate">
                  {listening ? (
                    "Listening…"
                  ) : (
                    <>Search “{hints[hint % hints.length]}”</>
                  )}
                </span>
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

        {/* desktop: wishlist, notifications, cart, account */}
        <div className="ml-auto flex max-md:hidden items-center gap-1.5 sm:gap-3">
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

          <Link
            href="/shop/wishlist"
            className={`${ICON_BTN} ${BTN_SCROLLED}`}
            aria-label="Wishlist"
          >
            <Heart size={20} />
            <span className="sr-only">Wishlist</span>
            {mounted && wishCount > 0 && (
              <span className={BADGE}>{wishCount}</span>
            )}
          </Link>

          <Link
            href="/shop/notifications"
            className={`${ICON_BTN} ${BTN_SCROLLED}`}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="sr-only">Notifications</span>
            {mounted && unread > 0 && (
              <span className={BADGE}>{unread > 9 ? "9+" : unread}</span>
            )}
          </Link>

          <Link href="/shop/cart" className={`${ICON_BTN} ${BTN_SCROLLED}`} aria-label="Cart">
            <ShoppingCart size={20} />
            <span className="sr-only">Cart</span>
            <span className={`${bump ? "shop-bump" : ""} ${BADGE}`}>
              {mounted ? count : 0}
            </span>
          </Link>

          <AccountMenu scrolled />
        </div>

        {/* mobile only: search icon + menu button */}
        <div className="ml-auto flex items-center gap-2 md:hidden">
          <Link
            href="/shop/search"
            className={`${ICON_BTN} ${BTN_SCROLLED}`}
            aria-label="Search"
          >
            <Search size={20} />
          </Link>
          <button
            type="button"
            onClick={() => setDrawer(true)}
            className={`${ICON_BTN} ${BTN_SCROLLED}`}
            aria-label="Open menu"
            aria-expanded={drawer}
          >
            <Menu size={22} />
            {mounted && count + wishCount + unread > 0 && (
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#e0262d] ring-2 ring-[#fff1c2]" />
            )}
          </button>
        </div>
      </div>

      {/* nav row (desktop only, collapses once the page is scrolled) */}
      <nav className="shop-navrow shop-scroll mx-auto flex max-md:hidden min-h-[52px] max-w-[1400px] snap-x items-center gap-3 overflow-x-auto px-3 pb-3 pt-2 text-sm font-semibold sm:px-5">
        <Link
          href="/shop/category/idols"
          onMouseEnter={() => setOpen(null)}
          className={GOLD_PILL}
        >
          <span className={TAG}>Sale</span>
          <Flame size={16} /> Diwali Offers
        </Link>
        <Link
          href="/shop/category/services"
          onMouseEnter={() => setOpen(null)}
          className={GOLD_PILL}
        >
          <span className={TAG}>New</span>
          <Landmark size={16} /> Pujas
        </Link>
        <Link
          href="/shop/category/all"
          onMouseEnter={() => setOpen(null)}
          className={`${GLASS_PILL} px-4 py-2.5 font-extrabold !border-[#7a1118]/40 !bg-white/70 !text-[#4a0710]`}
        >
          Shop All
        </Link>

        {!loaded &&
          Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="h-10 w-28 shrink-0 animate-pulse rounded-full bg-white/20"
            />
          ))}
        {loaded &&
          categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop/category/${c.slug}`}
              // only a real mouse opens the mega menu; touch taps go straight to the category
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                cancelClose();
                setOpen(c.slug);
                setSubIdx(0);
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") scheduleClose();
              }}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 shadow-[0_2px_8px_rgba(0,0,0,.25)] transition duration-200 active:scale-95 ${
                open === c.slug
                  ? "border-[#fff1c2] bg-[#fffaf3] !text-[#4a0710]"
                  : "border-[#7a1118]/40 bg-white/70 !text-[#4a0710] hover:border-[#f2b632] hover:bg-white"
              }`}
            >
              {c.image ? (
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-6 w-6 rounded-full object-cover ring-1 ring-white/60"
                />
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f2b632] text-[11px] text-[#4a0710]">
                  ✦
                </span>
              )}
              {c.name}
              <ChevronDown
                size={14}
                className={`transition ${open === c.slug ? "rotate-180" : ""}`}
              />
            </Link>
          ))}
      </nav>

      {/* mega menu: sub-categories on the left, products on the right (large screens only) */}
      {active && (
        <div className="shop-mega absolute inset-x-0 top-full z-50 hidden border-t-4 border-[#f2b632] bg-[#fffaf3] text-[#2a0a0d] shadow-2xl lg:block">
          <div className="mx-auto grid max-w-[1300px] gap-8 px-8 py-6 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr]">
            <div
              className="space-y-3 self-start"
              onMouseEnter={cancelClose}
              onMouseLeave={scheduleClose}
            >
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
                  {i === subSel && (
                    <ChevronRight
                      size={18}
                      className="shrink-0 !text-[#ffd66b]"
                    />
                  )}
                </Link>
              ))}
            </div>

            <div>
              {catProducts.length ? (
                <div className="grid grid-cols-4 gap-x-5 gap-y-6 xl:grid-cols-5">
                  {catProducts.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/shop/product/${p.slug}`}
                      onMouseEnter={cancelClose}
                      onMouseLeave={scheduleClose}
                      className="group/p block"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#e8d6bd] bg-[#f6efe6] shadow-sm transition duration-300 group-hover/p:-translate-y-1 group-hover/p:border-[#f2b632] group-hover/p:shadow-lg">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/p:scale-110"
                        />
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs font-semibold leading-snug !text-[#2a0a0d]">
                        {p.name}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid h-full min-h-[140px] place-items-center rounded-2xl border-2 border-dashed border-[#e8d6bd] bg-white/60 px-6 text-center">
                  <div>
                    <div className="text-2xl">🪔</div>
                    <div className="mt-1 text-sm font-semibold text-[#8b5a3c]">
                      No products in {active.name} yet.
                    </div>
                    <div className="text-xs text-[#a98466]">
                      New arrivals are on the way.
                    </div>
                  </div>
                </div>
              )}

              <Link
                href={subHref(subs[subSel])}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] px-5 py-2.5 text-sm font-extrabold !text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.2)] transition hover:brightness-105 active:scale-95"
              >
                View {active.sub.length ? subs[subSel] : active.name}{" "}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* mobile drawer (rendered in a portal so the sticky header can't break fixed positioning) */}
      {mounted &&
        createPortal(
          <div
            className={`fixed inset-0 z-[100] md:hidden ${drawer ? "" : "pointer-events-none"}`}
            aria-hidden={!drawer}
          >
            {/* dim overlay */}
            <div
              onClick={() => setDrawer(false)}
              className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${drawer ? "opacity-100" : "opacity-0"}`}
            />

            {/* panel */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className={`absolute right-0 top-0 flex h-full w-[86%] max-w-[340px] flex-col bg-gradient-to-b from-[#7a1118] to-[#4a0710] text-white shadow-2xl transition-transform duration-300 ${
                drawer ? "translate-x-0" : "translate-x-full"
              }`}
            >
              {/* top bar: logo, account, close */}
              <div className="flex items-center gap-2 border-b border-white/15 px-4 py-3">
                <Image
                  src="/img/photos/ayendri.png"
                  alt="AYENDRI"
                  width={36}
                  height={36}
                  className="h-9 w-9"
                />
                <span className="text-base font-extrabold tracking-[.14em]">
                  AYENDRI
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <AccountMenu scrolled={false} />
                  <button
                    type="button"
                    onClick={() => setDrawer(false)}
                    aria-label="Close menu"
                    className="grid h-9 w-9 place-items-center rounded-full border border-white/40 bg-white/15 active:scale-95"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
                {/* quick links */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      href: "/shop/wishlist",
                      label: "Wishlist",
                      icon: <Heart size={18} />,
                      n: wishCount,
                    },
                    {
                      href: "/shop/notifications",
                      label: "Alerts",
                      icon: <Bell size={18} />,
                      n: unread,
                    },
                    {
                      href: "/shop/cart",
                      label: "Cart",
                      icon: <ShoppingCart size={18} />,
                      n: count,
                    },
                    {
                      href: "/shop/orders",
                      label: "Track Order",
                      icon: <Truck size={18} />,
                      n: 0,
                    },
                  ].map((t) => (
                    <Link
                      key={t.label}
                      href={t.href}
                      onClick={() => setDrawer(false)}
                      className="relative flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-3 py-3 text-sm font-bold active:scale-95"
                    >
                      <span className="text-[#ffd66b]">{t.icon}</span>
                      {t.label}
                      {mounted && t.n > 0 && (
                        <span className="ml-auto grid h-5 min-w-[20px] place-items-center rounded-full bg-[#e0262d] px-1 text-[11px] font-extrabold ring-2 ring-[#fff1c2]">
                          {t.n > 9 ? "9+" : t.n}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>

                {/* highlighted links */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href="/shop/category/idols"
                    onClick={() => setDrawer(false)}
                    className={`${GOLD_PILL} px-3.5 py-2 text-sm`}
                  >
                    <Flame size={15} /> Diwali Offers
                  </Link>
                  <Link
                    href="/shop/category/services"
                    onClick={() => setDrawer(false)}
                    className={`${GOLD_PILL} px-3.5 py-2 text-sm`}
                  >
                    <Landmark size={15} /> Pujas
                  </Link>
                  <Link
                    href="/shop/category/all"
                    onClick={() => setDrawer(false)}
                    className={`${GLASS_PILL} px-3.5 py-2 text-sm font-extrabold`}
                  >
                    Shop All
                  </Link>
                </div>

                {/* categories */}
                <h3 className="mb-2 mt-6 text-[11px] font-extrabold uppercase tracking-[.25em] text-[#ffd66b]">
                  Categories
                </h3>
                <div className="space-y-1.5">
                  {!loaded &&
                    Array.from({ length: 6 }).map((_, i) => (
                      <span
                        key={i}
                        className="block h-12 animate-pulse rounded-xl bg-white/15"
                      />
                    ))}
                  {loaded &&
                    categories.map((c) => (
                      <Link
                        key={c.slug}
                        href={`/shop/category/${c.slug}`}
                        onClick={() => setDrawer(false)}
                        className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 text-sm font-semibold active:scale-[.98]"
                      >
                        {c.image ? (
                          <img
                            src={c.image}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-white/60"
                          />
                        ) : (
                          <span className="grid h-8 w-8 place-items-center rounded-full bg-[#f2b632] text-[11px] text-[#4a0710]">
                            ✦
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {c.name}
                        </span>
                        <ChevronRight
                          size={16}
                          className="shrink-0 opacity-70"
                        />
                      </Link>
                    ))}
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </header>
  );
}
