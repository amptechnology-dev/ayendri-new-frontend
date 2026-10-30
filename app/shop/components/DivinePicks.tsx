"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronsRight, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { off, type Product } from "../data";
import { useCart } from "../cart";
import { useShop } from "../shop-data";
import WishlistButton from "./WishlistButton";

const fmt = (x: number) => x.toLocaleString("en-IN");

/* ───────── small decorations ───────── */
const Spark = ({ className = "", size = 14 }: { className?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="#e8a838" aria-hidden>
    <path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />
  </svg>
);

/* ───────── illustrations (76 × 72) ───────── */
const DiyaArt = () => (
  <svg viewBox="0 0 80 76" className="h-[72px] w-[76px]" aria-hidden>
    <defs>
      <linearGradient id="dp-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd66b" /><stop offset="1" stopColor="#d4801a" /></linearGradient>
      <linearGradient id="dp-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff7f1a" /><stop offset="1" stopColor="#ffd75e" /></linearGradient>
      <radialGradient id="dp-glow"><stop offset="0" stopColor="#ffcf5a" stopOpacity=".65" /><stop offset="1" stopColor="#ffcf5a" stopOpacity="0" /></radialGradient>
    </defs>
    <circle cx="38" cy="26" r="24" fill="url(#dp-glow)" />
    <path d="M38 4C46 14 49 22 45 30C43 35 33 35 31 30C27 22 32 13 38 4Z" fill="url(#dp-flame)" />
    <path d="M38 16C41.5 21 42.5 26 40.5 29.5C39 32 36.5 32 35.5 29.5C34 26 35.5 21.5 38 16Z" fill="#fff4b8" />
    <path d="M5 42H71C71 58 57 68 38 68C19 68 5 58 5 42Z" fill="url(#dp-bowl)" />
    <ellipse cx="38" cy="42" rx="33" ry="5.5" fill="#ffe597" />
    <ellipse cx="38" cy="42.5" rx="27" ry="3.2" fill="#f2a93a" />
    <path d="M29 69H47L45 74H31Z" fill="#c47516" />
    <path d="M70 10l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z" fill="#f0b43c" />
    <path d="M8 24l1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1z" fill="#f0b43c" />
  </svg>
);

const PlantArt = () => (
  <svg viewBox="0 0 80 76" className="h-[72px] w-[76px]" aria-hidden>
    <defs>
      <linearGradient id="dp-pot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e07b47" /><stop offset="1" stopColor="#b9482a" /></linearGradient>
      <linearGradient id="dp-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7ccb68" /><stop offset="1" stopColor="#2f8f3b" /></linearGradient>
    </defs>
    <path d="M40 48V28" stroke="#3b8a37" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M40 32C29 33 22 25 24 15C34 14 41 21 40 32Z" fill="url(#dp-leaf)" />
    <path d="M40 36C51 37 59 29 57 18C46 17 39 25 40 36Z" fill="#3f9b3d" />
    <path d="M40 27C35 21 37 12 42 6C47 11 46 20 40 27Z" fill="#8bd47a" />
    <path d="M25 52H55L51.5 71H28.5Z" fill="url(#dp-pot)" />
    <rect x="22" y="45" width="36" height="9" rx="2.5" fill="#e98a55" />
    <circle cx="68" cy="26" r="2.6" fill="#b8452a" /><circle cx="73" cy="34" r="2.2" fill="#8a3a1e" /><circle cx="65" cy="36" r="1.9" fill="#c95a32" />
    <path d="M11 14l1.4 3.4 3.4 1.4-3.4 1.4-1.4 3.4-1.4-3.4-3.4-1.4 3.4-1.4z" fill="#f0b43c" />
    <path d="M70 8l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" fill="#f0b43c" />
  </svg>
);

const TagArt = () => (
  <svg viewBox="0 0 80 76" className="h-[72px] w-[76px]" aria-hidden>
    <defs>
      <linearGradient id="dp-tag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#a8242e" /><stop offset="1" stopColor="#6f0f1e" /></linearGradient>
      <linearGradient id="dp-coin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd96a" /><stop offset="1" stopColor="#d99a1e" /></linearGradient>
    </defs>
    <path d="M58 16Q70 8 74 3" stroke="#d9a13a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    <g transform="rotate(-16 42 30)">
      <path d="M20 12H56Q64 12 64 20V40Q64 48 56 48H20Q14 48 14 42V18Q14 12 20 12Z" fill="url(#dp-tag)" />
      <circle cx="56" cy="20" r="3" fill="#fde7b0" />
      <circle cx="36" cy="31" r="11.5" fill="url(#dp-coin)" />
      <text x="36" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="#7a1118" fontFamily="Inter,sans-serif">₹</text>
    </g>
    <ellipse cx="22" cy="68" rx="14" ry="4.5" fill="#c98a12" /><ellipse cx="22" cy="64" rx="14" ry="4.5" fill="#f2b632" />
    <ellipse cx="22" cy="60" rx="14" ry="4.5" fill="#ffd966" /><ellipse cx="34" cy="69" rx="10" ry="3.5" fill="#f2b632" />
    <path d="M72 30l1.2 3 3 1.2-3 1.2-1.2 3-1.2-3-3-1.2 3-1.2z" fill="#f0b43c" />
  </svg>
);

/* ───────── swipeable product image (touch swipe, mouse drag, arrows, dots) ───────── */
function Swiper({ images, alt, discount, productId }: { images: string[]; alt: string; discount: number; productId: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number } | null>(null);
  const [i, setI] = useState(0);
  const n = images.length;

  const go = (k: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(n - 1, k)) * el.clientWidth, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = ref.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const endDrag = () => {
    const el = ref.current;
    if (!drag.current || !el) return;
    drag.current = null;
    el.style.scrollSnapType = "";
    go(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div className="group relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-2xl bg-[#fff1da] shadow-[0_4px_10px_rgba(90,40,10,.22)]">
      <div
        ref={ref}
        onScroll={onScroll}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse" || n < 2 || !ref.current) return;
          drag.current = { x: e.clientX, left: ref.current.scrollLeft };
          ref.current.style.scrollSnapType = "none";
        }}
        onPointerMove={(e) => {
          if (drag.current && ref.current) ref.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
        }}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={`flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${n > 1 ? "cursor-grab" : ""}`}
      >
        {images.map((src, k) => (
          <div key={src + k} className="relative h-full w-full shrink-0 snap-center">
            <img
              src={src}
              alt={k === 0 ? alt : ""}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full select-none object-cover"
            />
          </div>
        ))}
      </div>

      {discount > 0 && (
        <span className="pointer-events-none absolute left-0 top-0 z-10 rounded-br-lg bg-[#1a6e35] px-1.5 text-[9px] font-extrabold leading-[14px] text-white">
          {discount}% OFF
        </span>
      )}

      {n > 1 && (
        <>
          {i > 0 && (
            <button aria-label="Previous image" onClick={() => go(i - 1)} className="absolute left-0.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#4a0710] shadow group-hover:grid">
              <ChevronLeft size={13} />
            </button>
          )}
          {i < n - 1 && (
            <button aria-label="Next image" onClick={() => go(i + 1)} className="absolute right-0.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#4a0710] shadow group-hover:grid">
              <ChevronRight size={13} />
            </button>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 flex justify-center gap-1">
            {images.map((_, k) => (
              <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-3 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        </>
      )}

      <WishlistButton productId={productId} size={12} className="absolute right-1 top-1 z-20 h-6 w-6" />
    </div>
  );
}

/* ───────── product row (swipe images, open product, add to cart) ───────── */
function Row({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);
  const extra = (p as Product & { images?: string[] }).images;
  const imgs: string[] = extra && extra.length ? extra : [p.image];

  return (
    <div className="mx-2.5 flex min-h-0 flex-1 items-center gap-2.5 border-b border-[#f0e3d2] last:border-b-0">
      <Swiper images={imgs} alt={p.name} discount={off(p)} productId={p.slug} />
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <Link href={`/shop/product/${p.slug}`} className="line-clamp-2 text-[13px] font-semibold leading-[17px] text-[#2b1a12] hover:underline">
          {p.name}
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
          <b className="whitespace-nowrap text-[16px] font-extrabold text-[#241410]">₹{fmt(p.price)}</b>
          {p.mrp > p.price && <s className="whitespace-nowrap text-[11px] text-[#9d8f86]">₹{fmt(p.mrp)}</s>}
        </div>
        <button
          onClick={() => {
            add(p.slug);
            setDone(true);
            setTimeout(() => setDone(false), 1200);
          }}
          className={`mt-1.5 flex h-[30px] w-full items-center justify-center gap-1 rounded-lg border-2 text-[13px] font-bold tracking-[.03em] transition active:scale-95 ${
            done ? "border-[#1a6e35] bg-[#1a6e35] text-white" : "border-[#8e1a22] bg-white text-[#8e1a22] hover:bg-[#8e1a22] hover:text-white"
          }`}
        >
          {done ? <><Check size={14} /> ADDED</> : "ADD"}
        </button>
      </div>
    </div>
  );
}

/* ───────── tall arched card (jharokha-style niche) ───────── */
function PickCard({ title, sub, art, bg, footBg, tabs, children }: {
  title: string; sub: string; art: React.ReactNode; bg: string; footBg: string;
  tabs?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className={`relative flex h-[640px] w-[272px] shrink-0 snap-start flex-col overflow-hidden rounded-b-[28px] rounded-t-[136px] border border-white/70 shadow-[0_22px_44px_-18px_rgba(120,60,20,.4)] transition duration-300 hover:-translate-y-1 ${bg}`}>
      <div className="flex flex-col items-center px-4 pt-9 text-center">
        {art}
        <h3 className="mt-2 text-[22px] font-extrabold leading-[1.1] tracking-[-.01em] text-[#2e1409]">{title}</h3>
        <p className="mt-1 text-[13px] leading-[17px] text-[#7a5a48]">{sub}</p>
      </div>
      {tabs && <div className="mx-3 mt-3">{tabs}</div>}
      <div className="mx-3 mb-3 mt-3 flex min-h-0 flex-1 flex-col rounded-[20px] bg-[#fffaf3] shadow-[0_2px_10px_rgba(120,60,20,.08)]">
        {children}
      </div>
      <Link href="/shop/category/all" className={`flex h-[52px] shrink-0 items-center justify-center gap-1 text-[17px] font-extrabold text-[#5a1218] ${footBg}`}>
        See all <ChevronsRight size={18} />
      </Link>
    </div>
  );
}

/* ───────── MAHASALE: gopuram tower + pillars + sanctum arch ───────── */
function Window({ x, b, h }: { x: number; b: number; h: number }) {
  return <path d={`M${x - 5} ${b} v-${h} a5 5 0 0 1 10 0 v${h}z`} fill="#4d0716" stroke="#f2c25a" strokeWidth="1" />;
}

function Mahasale() {
  const products = useShop((s) => s.products);
  const top = [...products].sort((a, b) => off(b) - off(a)).slice(0, 3);
  const pillar = {
    background: "repeating-linear-gradient(90deg,#c99a4b 0 2px,#f4dfae 2px 5px)",
  } as const;

  return (
    <div className="relative flex h-[640px] w-[300px] shrink-0 snap-start flex-col transition duration-300 hover:-translate-y-1">
      {/* gopuram tower */}
      <svg viewBox="0 0 300 112" className="h-[112px] w-full shrink-0" aria-hidden>
        <defs>
          <linearGradient id="dp-tier" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ee8a3d" /><stop offset="1" stopColor="#b3361a" /></linearGradient>
          <linearGradient id="dp-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#d99a1e" /></linearGradient>
        </defs>
        <path d="M150 1C154.5 7 154.5 12 150 15C145.5 12 145.5 7 150 1Z" fill="#ffae2b" />
        <polygon points="136,16 164,16 170,38 130,38" fill="url(#dp-tier)" />
        <rect x="124" y="38" width="52" height="5" rx="2" fill="url(#dp-gold)" />
        <polygon points="122,43 178,43 188,66 112,66" fill="url(#dp-tier)" />
        <rect x="104" y="66" width="92" height="5" rx="2" fill="url(#dp-gold)" />
        <polygon points="100,71 200,71 214,96 86,96" fill="url(#dp-tier)" />
        <rect x="74" y="96" width="152" height="6" rx="2" fill="url(#dp-gold)" />
        <rect x="0" y="102" width="300" height="10" fill="#8f1632" />
        <Window x={150} b={36} h={6} />
        <Window x={138} b={64} h={7} /><Window x={162} b={64} h={7} />
        <Window x={124} b={94} h={9} /><Window x={150} b={94} h={9} /><Window x={176} b={94} h={9} />
      </svg>

      {/* sandstone body with fluted pillars */}
      <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#f4dcae] to-[#e3c488] px-[18px] pb-3">
        <span aria-hidden className="absolute bottom-0 left-[2px] top-0 w-[13px]" style={pillar} />
        <span aria-hidden className="absolute bottom-0 right-[2px] top-0 w-[13px]" style={pillar} />
        <span aria-hidden className="absolute left-0 top-0 h-[6px] w-[17px] rounded-sm bg-[#b9822c]" />
        <span aria-hidden className="absolute right-0 top-0 h-[6px] w-[17px] rounded-sm bg-[#b9822c]" />

        {/* sanctum arch */}
        <div className="relative flex min-h-0 flex-1 flex-col rounded-b-2xl rounded-t-[130px] bg-gradient-to-b from-[#7d1228] to-[#4d0716] px-1.5 pb-2 pt-6 shadow-[inset_0_4px_14px_rgba(0,0,0,.35)]">
          <div className="text-center text-[11px] font-extrabold tracking-[.4em] text-[#fbe3b0]">DIWALI</div>
          <h3 className="bg-gradient-to-b from-[#ffe28d] via-[#f5c04a] to-[#dd9c26] bg-clip-text text-center text-[27px] font-black leading-[32px] tracking-[.04em] text-transparent">MAHASALE</h3>
          <p className="mb-2 text-center text-[12px] text-[#f6e3c4]">Up to 75% off on puja essentials</p>

          <div className="flex min-h-0 flex-1 flex-col rounded-[16px] bg-[#fffaf3]">
            {top.map((p) => <Row key={p.slug} p={p} />)}
          </div>
        </div>
      </div>

      {/* plinth steps */}
      <div className="h-1.5 bg-[#e0b25c]" />
      <div className="h-1.5 bg-[#b98a3a]" />
      <Link href="/shop/category/all" className="flex h-[44px] shrink-0 items-center justify-center gap-1 rounded-b-[24px] bg-[#4d0716] text-[16px] font-extrabold text-[#f5c04a]">
        Explore all offers <ChevronsRight size={18} />
      </Link>
    </div>
  );
}

/* ───────── section ───────── */
export default function DivinePicks() {
  const products = useShop((s) => s.products);
  const [cap, setCap] = useState(199);
  const sorted = [...products].sort((a, b) => a.price - b.price);
  const within = sorted.filter((p) => p.price <= cap);
  const low = [...within, ...sorted.filter((p) => !within.includes(p))].slice(0, 3);

  return (
    <section
      className="px-6 pb-11 pt-6"
      style={{ background: "radial-gradient(circle at 24px 24px, transparent 14px, rgba(222,170,120,.12) 15px, transparent 16px) 0 0/48px 48px, #fdf1e3" }}
    >
      <div className="relative mx-auto max-w-[1260px]">
        <Spark className="absolute left-[calc(50%-382px)] top-3 hidden lg:block" size={14} />
        <Spark className="absolute left-[calc(50%+378px)] top-[30px] hidden lg:block" size={12} />

        <h2 className="text-center text-[34px] font-extrabold leading-[56px] tracking-[-.015em] text-[#7a1520] sm:text-[48px]">
          Divine Picks,{" "}
          <span className="relative whitespace-nowrap text-[#b1141c]">
            Best Prices
            <svg className="absolute -bottom-[7px] left-0 w-full" viewBox="0 0 250 12" preserveAspectRatio="none" aria-hidden>
              <path d="M3 9Q125 -2 247 6" stroke="#d99a1e" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h2>
        <p className="mt-[14px] text-center text-[20px] font-medium text-[#8b5a3c]">Puja essentials for every day, in one place</p>

        {/* tall, narrow cards side by side; scrolls sideways on smaller screens */}
        <div className="mt-8 flex items-stretch gap-5 overflow-x-auto px-1 pb-8 pt-2 snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden min-[1230px]:justify-center">
          <Mahasale />

          <PickCard title="Your everyday needs" sub="Daily puja essentials" art={<DiyaArt />}
                    bg="bg-gradient-to-b from-[#fff2df] to-[#ffe4c0]" footBg="bg-[#ffdfad]">
            {products.slice(0, 3).map((p) => <Row key={p.slug} p={p} />)}
          </PickCard>

          <PickCard title="Organic & natural" sub="Our natural agarbatti range" art={<PlantArt />}
                    bg="bg-gradient-to-b from-[#e9f8e1] to-[#c9eabf]" footBg="bg-[#c4e7ba]">
            {products.slice(3, 6).map((p) => <Row key={p.slug} p={p} />)}
          </PickCard>

          <PickCard title="Lowest prices every day" sub="Puja needs for every budget" art={<TagArt />}
                    bg="bg-gradient-to-b from-[#fff6d6] to-[#f6df97]" footBg="bg-[#f3dc8e]"
                    tabs={
                      <div className="flex h-14 rounded-2xl bg-[#eddcc9] p-[5px]">
                        {[199, 299, 499].map((c) => (
                          <button key={c} onClick={() => setCap(c)}
                                  className={`flex-1 rounded-xl leading-tight transition ${cap === c ? "bg-[#7a1118] text-white shadow-md" : "text-[#3a1a10]"}`}>
                            <div className="text-[12px] font-semibold">Under</div>
                            <div className="text-[17px] font-extrabold">₹ {c}</div>
                          </button>
                        ))}
                      </div>
                    }>
            {low.map((p) => <Row key={p.slug} p={p} />)}
          </PickCard>
        </div>
      </div>
    </section>
  );
}