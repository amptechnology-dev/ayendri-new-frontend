"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Mic, Bell, Heart, ShoppingCart, Truck, ChevronDown, ChevronRight, Flame, Landmark, MapPin } from "lucide-react";
import { useCart } from "../cart";
import { useOrders } from "../orders";
import AccountMenu from "./AccountMenu";
import { useShop } from "../shop-data";
import { useWishlist } from "../wishlist-store";
import { useAuth } from "../auth";
const HINTS = ["Shri Yantra", "Ganesh idol", "Karungali mala", "Rudraksha", "Tulsi mala", "Pyrite frame", "Puja booking"];

// TODO: put your real store details here
const STORE = {
  label: "Our Store",
  place: "Dunlop, Kolkata",
  href: "/store", // or a Google Maps link, e.g. "https://maps.google.com/?q=Ayendri+Dunlop+Kolkata"
};

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
    <header data-scrolled={scrolled} onMouseLeave={() => setOpen(null)} className="shop-header shop-hero-bg sticky top-0 z-40 text-white shadow-lg">
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
            <div className="text-[10px] opacity-70">Sacred · Vedic · Lifestyle</div>
          </div>
        </Link>

        {/* search with rotating placeholder */}
        <form
          onSubmit={(e) => { e.preventDefault(); router.push(`/shop/search?q=${encodeURIComponent(val)}`); }}
          className="shop-search relative mx-auto flex h-12 w-full max-w-[580px] items-center gap-3 rounded-full border border-white/25 bg-white/10 px-5 backdrop-blur transition"
        >
          <Search size={18} />
          <div className="relative flex-1 overflow-hidden">
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onFocus={() => !val && router.push("/shop/search")}
              className="relative z-10 h-12 w-full bg-transparent text-sm outline-none"
              aria-label="Search"
            />
            {!val && (
              <span key={hint} className="shop-ph pointer-events-none absolute inset-0 flex items-center text-sm opacity-80">
                Search “{HINTS[hint]}”
              </span>
            )}
          </div>
          <Mic size={18} />
        </form>

        <div className="ml-auto flex items-center gap-4">
          <Link href={STORE.href} className="shop-pill hidden items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition lg:flex" aria-label={`${STORE.label}: ${STORE.place}`}>
            <MapPin size={16} className="text-[#f2b632]" />
            <span className="leading-tight">
              <span className="block text-[10px] font-medium uppercase tracking-wider opacity-70">{STORE.label}</span>
              <span className="block max-w-[160px] truncate">{STORE.place}</span>
            </span>
          </Link>
          <Link href="/shop/notifications" className="relative" aria-label="Notifications">
            <Bell size={22} />
            {mounted && unread > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#e0262d]" />}
          </Link>
          <Link href="/shop/wishlist" className="relative" aria-label="Wishlist">
            <Heart size={22} />
            {mounted && wishCount > 0 && (
              <span className="absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e0262d] px-1 text-[10px] font-bold text-white">
                {wishCount}
              </span>
            )}
          </Link>
          <AccountMenu />
          <Link href="/shop/cart" className="relative" aria-label="Cart">
            <ShoppingCart size={22} />
            <span className={`${bump ? "shop-bump" : ""} absolute -right-2 -top-2 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#e0262d] px-1 text-[10px] font-bold text-white`}>
              {mounted ? count : 0}
            </span>
          </Link>
        </div>
      </div>

      {/* nav row */}
      <nav className="shop-scroll mx-auto flex min-h-[52px] max-w-[1400px] items-center gap-3 overflow-x-auto px-5 pb-3 pt-1 text-sm font-semibold">
        <Link href="/shop/category/idols" onMouseEnter={() => setOpen(null)} className="shop-pill relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5">
          <span className="absolute -top-2 right-2 rounded-full bg-[#e0262d] px-2 text-[9px] font-bold text-white">Sale</span>
          <Flame size={16} /> Diwali Offers
        </Link>
        <Link href="/shop/category/services" onMouseEnter={() => setOpen(null)} className="shop-pill relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5">
          <span className="absolute -top-2 right-2 rounded-full bg-[#e0262d] px-2 text-[9px] font-bold text-white">New</span>
          <Landmark size={16} /> Pujas
        </Link>
        <Link href="/shop/category/all" onMouseEnter={() => setOpen(null)} className="relative shrink-0 px-2 py-2 font-bold after:absolute after:-bottom-1 after:left-2 after:h-[3px] after:w-8 after:rounded after:bg-[#f2b632]">
          Shop All
        </Link>

        {!loaded &&
          Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-9 w-28 shrink-0 animate-pulse rounded-full bg-white/10" />
          ))}
        {loaded && categories.map((c) => (
          <Link
            key={c.slug}
            href={`/shop/category/${c.slug}`}
            onMouseEnter={() => { setOpen(c.slug); setSubIdx(0); }}
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 transition ${open === c.slug ? "bg-white/15 ring-1 ring-white/30" : ""}`}
          >
            {c.image ? (
              <img src={c.image} alt="" loading="lazy" decoding="async" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[11px]">✦</span>
            )}
            {c.name}
            <ChevronDown size={12} className={`transition ${open === c.slug ? "rotate-180" : ""}`} />
          </Link>
        ))}
      </nav>

      {/* mega menu: sub-categories on the left, products on the right */}
      {active && (
        <div className="shop-mega absolute inset-x-0 top-full z-50 hidden border-t border-[#f0dcc0] bg-[#fffaf3] text-[#2a0a0d] shadow-2xl md:block">
          <div className="mx-auto grid max-w-[1300px] grid-cols-[280px_1fr] gap-8 px-8 py-6">
            <div className="space-y-3">
              {subs.map((s, i) => (
                <Link
                  key={s}
                  href={subHref(s)}
                  onMouseEnter={() => setSubIdx(i)}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 text-sm font-extrabold uppercase tracking-wide transition ${
                    i === subSel ? "bg-[#7a1118] text-white" : "bg-[#f6efe6] text-[#3a2a22] hover:bg-[#efe3d3]"
                  }`}
                >
                  {s}
                  {i === subSel && <ChevronRight size={16} />}
                </Link>
              ))}
            </div>

            <div>
              {catProducts.length ? (
                <div className="grid grid-cols-5 gap-x-5 gap-y-6">
                  {catProducts.map((p) => (
                    <Link key={p.slug} href={`/shop/product/${p.slug}`} className="group/p block">
                      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f6efe6]">
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover/p:scale-110"
                        />
                      </div>
                      <div className="mt-2 line-clamp-2 text-xs font-semibold leading-snug">{p.name}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-sm text-[#8b5a3c]">No products in {active.name} yet.</div>
              )}
              <Link href={subHref(subs[subSel])} className="mt-6 inline-block text-sm font-bold text-[#7a1118]">
                View {active.sub.length ? subs[subSel] : active.name} →
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}