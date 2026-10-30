"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useShop } from "../../shop-data";
import WishlistButton from "../../components/WishlistButton";

// Adjust these two to your real routes
const CATEGORY_BASE = "/category";
const PRODUCT_BASE = "/product";

// Tries the usual field names so the tile picks up your product image
const imgOf = (p: any): string | undefined =>
  p.image ?? p.img ?? p.thumbnail ?? p.images?.[0]?.url ?? p.images?.[0] ?? undefined;
const nameOf = (p: any): string => p.name ?? p.title ?? "";
const priceOf = (p: any): string | null => {
  const n = Number(p.price);
  return n ? `₹${n.toLocaleString("en-IN")}` : null;
};

function Tile({ p }: { p: any }) {
  const img = imgOf(p);
  const price = priceOf(p);
  return (
    <div className="group relative w-[130px] shrink-0 text-center sm:w-[147px]">
    <Link href={`${PRODUCT_BASE}/${p.slug}`} className="block">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-[#f1dfb6] bg-gradient-to-br from-[#fff4dc] to-[#f6d9a8] shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={nameOf(p)}
            loading="lazy"
            onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        )}
      </div>
      <p className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug text-[#1a1013]">{nameOf(p)}</p>
      {price && <p className="mt-1 text-xs text-[#8a7f7f]">{price}</p>}
    </Link>
    <WishlistButton productId={p.slug} size={16} className="absolute right-2 top-2 z-10 h-8 w-8" />
    </div>
  );
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);

  const [q, setQ] = useState("");
  const t = q.trim().toLowerCase();

  const cat = categories.find((c) => c.slug === slug);
  const isAll = slug === "all" || !cat;

  // One section per category, each holding only its own products
  const sections = useMemo(() => {
    const scoped = isAll ? categories : categories.filter((c) => c.slug === slug);
    return scoped
      .map((c) => {
        let list: any[] = products.filter((p) => p.category === c.slug);
        if (t) list = list.filter((p) => nameOf(p).toLowerCase().includes(t));
        return { cat: c, list };
      })
      .filter((s) => s.list.length);
  }, [categories, products, slug, isAll, t]);

  const total = sections.reduce((n, s) => n + s.list.length, 0);

  return (
    <div className="pb-24">
      {/* HERO */}
      <section className="mx-auto mt-6 max-w-[1140px] px-4">
        <div
          className="relative overflow-hidden rounded-[32px] px-6 pb-16 pt-12 text-center shadow-[0_20px_40px_-20px_rgba(90,8,20,0.6)]"
          style={{
            background:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1.5px, transparent 0) 0 0/34px 34px, linear-gradient(180deg,#5a0612 0%,#7d0b1e 55%,#8f1025 100%)",
          }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#f6c453]">Divine Hindu</p>
          <h1 className="mt-2 text-4xl font-black text-white md:text-5xl">{isAll ? "All collections" : cat!.name}</h1>

          <div className="mx-auto mt-7 flex max-w-[534px] items-center gap-3 rounded-full bg-white px-5 py-3 shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a1024" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products"
              className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#9a8f8f]"
            />
            <span className="shrink-0 rounded-full border border-[#f1dfb6] bg-[#fff8e6] px-3 py-1 text-xs font-bold text-[#8a1024]">
              {t || !isAll ? `${total} products` : `${categories.length} collections`}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            {categories.map((c) => (
              <Link
                key={c.slug}
                href={`${CATEGORY_BASE}/${c.slug}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-bold transition ${
                  c.slug === slug
                    ? "border-[#f6c453] bg-[#f6c453] text-[#5a0612]"
                    : "border-white/30 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* gold zig-zag edge */}
          <svg className="absolute inset-x-0 bottom-3 h-5 w-full" preserveAspectRatio="none" viewBox="0 0 400 20">
            <path d="M0 10 Q5 0 10 10 T20 10 T30 10 T40 10 T50 10 T60 10 T70 10 T80 10 T90 10 T100 10 T110 10 T120 10 T130 10 T140 10 T150 10 T160 10 T170 10 T180 10 T190 10 T200 10 T210 10 T220 10 T230 10 T240 10 T250 10 T260 10 T270 10 T280 10 T290 10 T300 10 T310 10 T320 10 T330 10 T340 10 T350 10 T360 10 T370 10 T380 10 T390 10 T400 10" fill="none" stroke="#f6c453" strokeWidth="1.4" />
          </svg>
        </div>
      </section>

      {/* PRODUCTS BY CATEGORY */}
      <section className="mx-auto mt-14 max-w-[1140px] px-4">
        <div className="mb-8 flex items-center gap-5">
          <h2 className="text-3xl font-black text-[#1a1013]">{isAll ? "Shop by category" : cat!.name}</h2>
          <span className="h-px flex-1 bg-gradient-to-r from-[#e9c46a] to-transparent" />
        </div>

        {sections.length === 0 && (
          <p className="rounded-2xl border border-dashed border-[#e9c46a] bg-[#fffaf0] py-16 text-center text-[#8a7f7f]">
            No products found here yet.
          </p>
        )}

        {sections.map(({ cat: c, list }, idx) => {
          // On the overview page show a preview row; on a category page show everything
          const shown = isAll ? list.slice(0, 12) : list;
          return (
            <div key={c.slug} id={c.slug} className={`scroll-mt-28 py-7 ${idx ? "border-t border-[#f6edd2]" : ""}`}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className="text-[22px] font-extrabold text-[#8a0b27]">{c.name}</h3>
                {isAll && (
                  <Link
                    href={`${CATEGORY_BASE}/${c.slug}`}
                    className="rounded-full border border-[#efe3cc] bg-white px-5 py-2 text-sm font-bold text-[#8a0b27] shadow-sm transition hover:bg-[#fff8e6]"
                  >
                    View All →
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-x-[17px] gap-y-8">
                {shown.map((p) => <Tile key={p.slug} p={p} />)}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}