"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ChevronsRight } from "lucide-react";
import { inr, off, type Product } from "../data";
import { useCart } from "../cart";
import Reveal from "./Reveal";
import Carousel from "./Carousel";
import ProductCard from "./ProductCard";
import DivinePicks from "./DivinePicks";
import { useShop } from "../shop-data";

const Pic = ({ i, className = "" }: { i: number; className?: string }) => {
  const products = useShop((s) => s.products);
  const p = products.length ? products[i % products.length] : undefined;
  if (!p) return <div className={`relative overflow-hidden bg-[#f3e3c0] ${className}`} />;
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={p.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
};

/* ---------- 1. Divine Picks, Best Prices ---------- */
function MiniRow({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  return (
    <div className="flex items-center gap-3 border-b border-[#f0dcc0] py-3 last:border-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
        <img
          src={p.image}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span className="absolute left-0 top-0 rounded-br-lg bg-green-700 px-1.5 text-[9px] font-bold text-white">{off(p)}% OFF</span>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <div className="line-clamp-2 font-semibold leading-tight">{p.name}</div>
        <b>{inr(p.price)}</b> <s className="text-xs text-[#9a8080]">{inr(p.mrp)}</s>
      </div>
      <button onClick={() => add(p.slug)} className="shop-add rounded-lg border-2 border-[#a3161c] px-4 py-1.5 text-sm font-bold text-[#a3161c] hover:bg-[#a3161c] hover:text-white">ADD</button>
    </div>
  );
}

function ListCard({ title, sub, bg, children }: { title: string; sub: string; bg: string; children: React.ReactNode }) {
  return (
    <div className={`flex flex-col overflow-hidden rounded-3xl shadow-lg ${bg}`}>
      <div className="p-5 pb-3"><h3 className="text-xl font-extrabold text-[#4a0710]">{title}</h3><p className="text-xs text-[#6b4a4a]">{sub}</p></div>
      <div className="mx-3 flex-1 rounded-2xl bg-white/80 px-3">{children}</div>
      <Link href="/shop/category/all" className="mt-3 flex items-center justify-center gap-1 bg-black/5 py-3.5 font-bold text-[#4a0710]">See all <ChevronsRight size={16} /></Link>
    </div>
  );
}

export function LegacyPicks() {
  const products = useShop((s) => s.products);
  const [cap, setCap] = useState(199);
  const cheap = products.filter((p) => p.price <= cap);
  const low = (cheap.length ? cheap : [...products].sort((a, b) => a.price - b.price)).slice(0, 3);
  const tiles: [string, string, number][] = [["Puja Samagri", "Starts at ₹179", 4], ["Puja Kits", "Starts at ₹349", 7], ["Agarbatti", "Up to 75% off", 6], ["Daily Use", "Up to 75% off", 3]];
  return (
    <section className="bg-[#fdeedd] px-6 py-14">
      <div className="mx-auto max-w-[1300px]">
        <h2 className="text-center text-4xl font-black text-[#7a1118] md:text-5xl">
          Divine Picks, <span className="relative text-[#a3161c]">Best Prices
            <svg className="absolute -bottom-3 left-0 w-full" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M2 7 Q100 0 198 5" stroke="#d99a1e" strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
          </span>
        </h2>
        <p className="mt-5 text-center text-[#8b5a3c]">Puja essentials for every day, in one place</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col overflow-hidden rounded-3xl bg-gradient-to-b from-[#7a1118] to-[#4a0710] text-center text-white shadow-xl">
            <div className="pt-6"><div className="text-[11px] font-bold tracking-[.35em] text-[#f2b632]">DIWALI</div><h3 className="text-4xl font-black text-[#f2b632]">MAHASALE</h3><p className="px-4 text-xs">Up to 75% off on puja essentials</p></div>
            <div className="grid flex-1 grid-cols-2 gap-3 p-4">
              {tiles.map(([n, s, i]) => (
                <Link key={n} href="/shop/category/all" className="rounded-2xl border border-dashed border-[#f2b632]/50 bg-white/5 p-3">
                  <Pic i={i} className="mx-auto h-14 w-14 rounded-xl" /><div className="mt-2 text-sm font-bold">{n}</div>
                  <div className="mt-1 rounded-md bg-[#f2b632] py-1 text-[10px] font-bold text-[#4a0710]">{s}</div>
                </Link>
              ))}
            </div>
            <Link href="/shop/category/all" className="flex items-center justify-center gap-1 bg-black/25 py-4 font-bold text-[#f2b632]">Explore all offers <ChevronsRight size={16} /></Link>
          </div>
          <ListCard title="Your everyday needs" sub="Daily puja essentials" bg="bg-gradient-to-b from-[#ffe7c0] to-[#ffd9a0]">{products.slice(0, 3).map((p) => <MiniRow key={p.slug} p={p} />)}</ListCard>
          <ListCard title="Organic & natural" sub="Our natural agarbatti range" bg="bg-gradient-to-b from-[#dff3d6] to-[#bfe5b4]">{products.slice(3, 6).map((p) => <MiniRow key={p.slug} p={p} />)}</ListCard>
          <ListCard title="Lowest prices every day" sub="Puja needs for every budget" bg="bg-gradient-to-b from-[#fff0c0] to-[#f6dd8e]">
            <div className="-mx-1 mb-1 mt-3 flex rounded-xl bg-[#efe0cf] p-1">
              {[199, 299, 499].map((c) => (
                <button key={c} onClick={() => setCap(c)} className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${cap === c ? "bg-[#7a1118] text-white" : "text-[#4a0710]"}`}>Under<br /><span className="text-sm">₹ {c}</span></button>
              ))}
            </div>
            {low.map((p) => <MiniRow key={p.slug} p={p} />)}
          </ListCard>
        </div>
      </div>
    </section>
  );
}

/* ---------- 2. The Great Dharma · Festival Sale ---------- */
export function DharmaSale() {
  const products = useShop((s) => s.products);
  const t = products[0];
  if (!t) return null;
  const cats = [{ up: 74, t: "Karungali", a: 0, b: 1 }, { up: 90, t: "Rudraksha", a: 1, b: 2 }, { up: 73, t: "Pyrite for wealth", a: 5, b: 6 }, { up: 67, t: "Idols for your mandir", a: 2, b: 3 }];
  return (
    <section className="relative bg-gradient-to-b from-[#ffe08a] to-[#f6a93a] px-6 pb-16 pt-12">
      <div className="text-center">
        <div className="text-sm font-extrabold tracking-[.4em] text-[#4a0710]">THE GREAT</div>
        <h2 className="text-6xl font-black tracking-wide text-white md:text-8xl" style={{ WebkitTextStroke: "3px #4a0710", paintOrder: "stroke fill" }}>🪔 DHARMA 🪔</h2>
        <span className="mt-2 inline-block rounded-full border-2 border-[#f2b632] bg-[#6e0d18] px-8 py-2 text-lg font-extrabold tracking-[.3em] text-[#f2b632]">FESTIVAL SALE</span>
        <p className="mt-3 font-bold text-[#4a0710]">Flat 50% off on bestsellers · Up to 70% off on combos</p>
      </div>
      <div className="mx-auto mt-8 grid max-w-[1350px] gap-4 md:grid-cols-5">
        <Link href={`/shop/product/${t.slug}`} className="flex flex-col items-center overflow-hidden rounded-3xl bg-[#fff4dc] p-5 text-center shadow-lg transition hover:-translate-y-1">
          <div className="text-4xl font-black text-[#7a1118]">TOP</div><div className="text-xs font-bold tracking-[.4em]">DEAL</div>
          <s className="mt-2 rounded-md bg-[#4a0710] px-2 text-xs text-white">{inr(t.mrp)}</s>
          <div className="mt-1 rounded-xl bg-green-700 px-4 py-1 text-3xl font-black text-white">{inr(t.price)}</div>
          <div className="mt-3 font-extrabold text-[#4a0710]">{t.name}</div>
          <Pic i={0} className="mt-4 aspect-[3/4] w-3/4 rounded-xl" />
        </Link>
        {cats.map((c) => (
          <Link key={c.t} href="/shop/category/all" className="group relative min-h-[420px] overflow-hidden rounded-3xl bg-[#fff4dc] pt-12 text-center shadow-lg transition hover:-translate-y-1">
            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 overflow-hidden rounded-b-lg text-xs font-bold text-white"><span className="bg-[#4a0710] px-2 py-1">Up to</span><span className="bg-green-700 px-2 py-1">{c.up}% OFF</span></div>
            <h3 className="px-2 text-lg font-extrabold text-[#4a0710]">{c.t}</h3>
            <Pic i={c.a} className="absolute -left-2 bottom-0 h-40 w-1/2 -rotate-6 rounded-xl shadow-lg transition group-hover:-rotate-3" />
            <Pic i={c.b} className="absolute -right-2 bottom-0 h-36 w-1/2 rotate-6 rounded-xl shadow-lg transition group-hover:rotate-3" />
          </Link>
        ))}
      </div>
      <Link href="/shop/category/all" className="mx-auto mt-5 flex max-w-[1350px] items-center gap-4 rounded-2xl bg-[#fff4dc] p-4 shadow-lg">
        <div className="flex"><Pic i={3} className="h-14 w-14 -rotate-6 rounded-lg" /><Pic i={4} className="-ml-4 h-14 w-14 rotate-6 rounded-lg" /></div>
        <div className="flex-1"><b className="text-xl text-[#4a0710]">Diwali gifting</b><div className="text-sm text-[#6b4a4a]">Up to 73% off on gifts for family and friends</div></div>
        <ChevronRight />
      </Link>
      <div className="absolute inset-x-0 bottom-0 h-[14px]" style={{ background: "radial-gradient(circle at 14px 14px, transparent 13px, #fff7ec 14px) 0 0/28px 14px repeat-x" }} />
    </section>
  );
}

function GroupTile({
  name, keywords, fallbackIndex, showPrice = false, showName = true, className = "",
}: { name: string; keywords: string[]; fallbackIndex: number; showPrice?: boolean; showName?: boolean; className?: string }) {
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);
  const kw = keywords.map((k) => k.toLowerCase());
  const has = (s?: string) => !!s && kw.some((k) => s.toLowerCase().includes(k));

  const cat = categories.find((c) => has(c.name));
  const list = products.filter((p) => (cat ? p.category === cat.slug : has(p.name) || has(p.categoryName)));
  const img = cat?.image || list[0]?.image || products[fallbackIndex % (products.length || 1)]?.image;
  const from = list.length ? Math.min(...list.map((p) => p.price)) : null;

  return (
    <Link href={cat ? `/shop/category/${cat.slug}` : "/shop/category/all"} className="group block">
      <div className={`relative overflow-hidden ${className}`}>
        {img && (
          <img
            src={img}
            alt={name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      {showName && <div className="mt-2 font-bold">{name}</div>}
      {showPrice && from !== null && <div className="text-sm font-bold text-[#a3161c]">From {inr(from)}</div>}
    </Link>
  );
}

/* ---------- 4. Celebrate Diwali ---------- */
function CelebrateDiwali() {
  const products = useShop((s) => s.products);
  const tiles: [string, string[]][] = [
    ["Dhanteras pujas", ["dhanteras", "puja"]],
    ["Diwali pujas", ["diwali", "puja"]],
    ["Kali Puja", ["kali"]],
    ["Deep daan", ["deep", "diya"]],
    ["Lakshmi & Ganesh idols", ["idol", "lakshmi", "ganesh"]],
    ["Diyas & lamps", ["diya", "lamp"]],
  ];
  return (
    <section className="px-6 py-14">
      <div className="relative mx-auto max-w-[1180px] rounded-[44px] bg-[#fdeaa8] px-6 pb-8 pt-10 text-center">
        <span className="absolute -left-3 -top-5 -rotate-12 text-6xl">🪷</span><span className="absolute -right-3 -top-5 rotate-12 text-6xl">🪷</span>
        <div className="text-sm font-bold tracking-[.45em] text-[#4a0710]">CELEBRATE</div>
        <h2 className="font-serif text-6xl font-bold text-[#7a1118] md:text-7xl">Diwali</h2>
        <span className="mt-2 inline-block rounded-full border border-[#e3c36a] bg-white px-5 py-1.5 text-sm font-bold">🪔 Dhanteras 6 Nov · Lakshmi Puja 8 Nov</span>
        <div className="mt-6 rounded-3xl border border-dashed border-[#e3c36a] bg-[#fff7e0] p-5">
          <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
            {tiles.map(([t, kw], i) => (
              <GroupTile key={t} name={t} keywords={kw} fallbackIndex={i + 2}
                className="shop-arch mx-auto aspect-[3/4] w-full max-w-[190px] border-2 border-[#d9a13a] [&_img]:transition [&_img]:duration-700 group-hover:[&_img]:scale-110" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1180px]">
        <div className="mb-4 flex items-end justify-between"><h3 className="text-2xl font-extrabold text-[#4a0710]">Diwali puja essentials</h3><Link href="/shop/category/all" className="text-sm font-bold text-[#7a1118]">See all ›</Link></div>
        <Carousel itemWidth={220}>{products.map((p) => <ProductCard key={p.slug} p={p} />)}</Carousel>
      </div>
    </section>
  );
}

/* ---------- 5. Red festival banner ---------- */
function FestivalBanner() {
  const cards = [["DIWALI OFFER", "Flat 50% Off", "on bestsellers", "Shop now", "/shop/category/all"], ["COMBOS", "Up to 70% Off", "on Divine Combos", "Shop combos", "/shop/category/all"], ["FREE GIFT", "Free Silver Coin", "on purchase above ₹2,000", "Start shopping", "/shop/category/all"]];
  return (
    <section className="shop-pattern text-center text-[#ffe9bd]">
      <div className="shop-band" />
      <div className="px-6 py-12">
        <h2 className="text-5xl font-extrabold md:text-7xl">ये दिवाली राम राज्य वाली!</h2>
        <div className="mt-3 text-2xl font-extrabold tracking-[.25em] md:text-3xl">THE GREAT DHARMA FESTIVAL</div>
        <p className="mt-2 text-sm">Lowest price ever on Karungali, Rudraksha, Rashi stones and more</p>
        <div className="mx-auto mt-8 grid max-w-[1300px] gap-5 md:grid-cols-3">
          {cards.map(([k, t, s, b, h]) => (
            <div key={t} className="rounded-3xl border border-[#f2b632] bg-gradient-to-b from-[#fff4dc] to-[#ffe2b8] px-6 py-10 text-[#4a0710] shadow-xl transition hover:-translate-y-1.5">
              <div className="text-xs font-bold tracking-widest text-[#a3161c]">{k}</div>
              <div className="mt-2 text-4xl font-black md:text-5xl">{t}</div>
              <div className="mt-1 text-sm">{s}</div>
              <Link href={h} className="mt-5 inline-block rounded-full bg-[#7a1118] px-6 py-2.5 text-sm font-bold text-white">{b} →</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs opacity-70">*Offers valid during The Great Dharma Festival. T&amp;C apply.</p>
      </div>
      <div className="shop-band" />
    </section>
  );
}

/* ---------- 6. Shop by Intention ---------- */
function Intention() {
  const products = useShop((s) => s.products);
  const items: [string, string[], number][] = [
    ["Wealth", ["pyrite", "wealth"], 5],
    ["Health", ["rudraksha", "health"], 1],
    ["Protection", ["karungali", "protection"], 3],
    ["Peace", ["idol", "mala", "peace"], 6],
  ];
  return (
    <section className="px-6 py-14">
      <div className="relative mx-auto max-w-[1180px] rounded-t-[90px] rounded-b-3xl bg-gradient-to-b from-[#f9b85a] to-[#ee7d22] px-5 pb-12 pt-10 text-center">
        <div className="text-sm font-bold tracking-[.4em] text-[#4a0710]">SHOP WITH</div>
        <h2 className="text-6xl font-black text-[#4a0710] md:text-7xl">PURITY</h2>
        <div className="mt-6 rounded-3xl border border-dashed border-[#f0c88a] bg-[#fffaf0] p-6">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {items.map(([n, kw, i]) => (
              <GroupTile key={n} name={n} keywords={kw} fallbackIndex={i} showPrice showName={false}
                className="shop-arch mx-auto aspect-[3/4] w-full max-w-[190px] border-2 border-[#d9a13a] [&_img]:transition [&_img]:duration-700 group-hover:[&_img]:scale-110" />
            ))}
          </div>
        </div>
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#fcd7b0] px-6 py-2 text-sm font-bold text-[#7a1118] shadow">★ Flat 50% off on bestsellers</span>
      </div>
      <div className="mx-auto mt-12 max-w-[1180px]"><Carousel itemWidth={220}>{products.map((p) => <ProductCard key={p.slug} p={p} />)}</Carousel></div>
    </section>
  );
}

export default function HomeSections() {
  return (
    <>
      <Reveal><DivinePicks /></Reveal>
      <Reveal><CelebrateDiwali /></Reveal>
      <Reveal><FestivalBanner /></Reveal>
      <Reveal><Intention /></Reveal>
    </>
  );
}