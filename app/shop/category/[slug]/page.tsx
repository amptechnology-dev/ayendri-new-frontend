"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useShop } from "../../shop-data";
import WishlistButton from "../../components/WishlistButton";

// Adjust these two to your real routes
const CATEGORY_BASE = "/shop/category";
const PRODUCT_BASE = "/shop/product";

// Tries the usual field names so the tile picks up your product image
const imgOf = (p: any): string | undefined =>
  p.image ??
  p.img ??
  p.thumbnail ??
  p.images?.[0]?.url ??
  p.images?.[0] ??
  undefined;
const nameOf = (p: any): string => p.name ?? p.title ?? "";
const priceOf = (p: any): string | null => {
  const n = Number(p.price);
  return n ? `₹${n.toLocaleString("en-IN")}` : null;
};

function Mandala({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      style={style}
      viewBox="0 0 200 200"
      fill="none"
      stroke="#f6c453"
      strokeWidth="1"
      className={className}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="96" />
      <circle cx="100" cy="100" r="78" strokeDasharray="2 5" />
      <circle cx="100" cy="100" r="60" />
      <circle cx="100" cy="100" r="22" />
      {Array.from({ length: 12 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 30} 100 100)`}>
          <path d="M100 40 C112 62 112 80 100 96 C88 80 88 62 100 40Z" />
          <path d="M100 6 C106 20 106 30 100 38 C94 30 94 20 100 6Z" />
          <circle cx="100" cy="70" r="2" fill="#f6c453" />
        </g>
      ))}
    </svg>
  );
}

function HangingBell() {
  return (
    <svg viewBox="0 0 60 120" className="h-28 w-14" aria-hidden="true">
      <line
        x1="30"
        y1="0"
        x2="30"
        y2="40"
        stroke="#f6c453"
        strokeWidth="1.5"
        strokeDasharray="3 3"
      />
      <circle cx="30" cy="42" r="4" fill="#f6c453" />
      <path
        d="M14 96 C14 70 20 52 30 48 C40 52 46 70 46 96 Z"
        fill="#f6c453"
        fillOpacity=".9"
        stroke="#fff4dc"
        strokeWidth="1"
      />
      <path d="M12 96 H48 V101 H12 Z" fill="#e0a82e" />
      <circle cx="30" cy="108" r="5" fill="#f59e0b" />
      <path
        d="M22 72 C24 64 27 60 30 58"
        stroke="#fff4dc"
        strokeOpacity=".6"
        fill="none"
      />
    </svg>
  );
}

function Diya() {
  return (
    <svg viewBox="0 0 80 80" className="h-16 w-16" aria-hidden="true">
      <ellipse
        cx="40"
        cy="30"
        rx="16"
        ry="22"
        fill="#f59e0b"
        fillOpacity=".3"
        className="animate-pulse"
      />
      <path d="M40 8 C48 20 50 28 40 38 C30 28 32 20 40 8Z" fill="#ffd36b" />
      <path d="M40 20 C44 26 44 30 40 35 C36 30 36 26 40 20Z" fill="#fff4dc" />
      <path
        d="M10 46 C12 62 28 68 40 68 C52 68 68 62 70 46 C58 52 22 52 10 46Z"
        fill="#f6c453"
        stroke="#fff4dc"
        strokeWidth="1"
      />
      <path
        d="M10 46 C22 40 58 40 70 46 C58 52 22 52 10 46Z"
        fill="#e0a82e"
      />
      <rect x="34" y="68" width="12" height="5" rx="2" fill="#e0a82e" />
    </svg>
  );
}

function Lotus() {
  return (
    <svg
      viewBox="0 0 100 60"
      className="h-12 w-20"
      fill="none"
      stroke="#f6c453"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <path
        d="M50 56 C38 44 38 22 50 6 C62 22 62 44 50 56Z"
        fill="#f6c453"
        fillOpacity=".25"
      />
      <path
        d="M48 56 C30 50 18 36 16 18 C34 22 46 36 48 56Z"
        fill="#f6c453"
        fillOpacity=".15"
      />
      <path
        d="M52 56 C70 50 82 36 84 18 C66 22 54 36 52 56Z"
        fill="#f6c453"
        fillOpacity=".15"
      />
      <path
        d="M46 57 C26 58 8 50 2 36 C20 34 38 42 46 57Z"
        fill="#f6c453"
        fillOpacity=".1"
      />
      <path
        d="M54 57 C74 58 92 50 98 36 C80 34 62 42 54 57Z"
        fill="#f6c453"
        fillOpacity=".1"
      />
    </svg>
  );
}

function SideOrnaments({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-y-0 hidden w-20 flex-col items-center justify-between pb-10 pt-5 lg:flex ${
        side === "left" ? "left-10" : "right-10"
      }`}
    >
      <div
        style={{
          transformOrigin: "50% 0",
          animation: `bellSwing 4s ease-in-out ${side === "left" ? "0s" : "-2s"} infinite`,
        }}
      >
        <HangingBell />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Diya />
        <Lotus />
      </div>
    </div>
  );
}

const ordersOf = (p: any): number =>
  Number(
    p.orderCount ?? p.ordersCount ?? p.totalOrders ?? p.sold ?? p.soldCount ?? 0,
  ) || 0;

function TopTile({ p }: { p: any }) {
  const img = imgOf(p);
  const price = priceOf(p);
  return (
    <Link
      href={`${PRODUCT_BASE}/${encodeURIComponent(p.slug)}`}
      className="group w-[150px] text-center sm:w-[200px]"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-b-2xl rounded-t-[999px] border-2 border-[#f6c453]/70 bg-gradient-to-br from-[#fff4dc] to-[#f6d9a8] shadow-[0_0_24px_rgba(246,196,83,0.25)] transition group-hover:-translate-y-1 group-hover:shadow-[0_0_32px_rgba(246,196,83,0.45)]">
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
      <p className="mt-4 line-clamp-2 text-base font-bold leading-snug tracking-wide text-[#fff4dc]">
        {nameOf(p)}
      </p>
      {price && (
        <p className="mt-1 text-sm font-semibold text-[#f6c453]">{price}</p>
      )}
    </Link>
  );
}

function Tile({ p }: { p: any }) {
  const img = imgOf(p);
  const price = priceOf(p);
  return (
    <div className="group relative w-[150px] shrink-0 text-center sm:w-[200px] lg:w-[220px]">
      <Link
        href={`${PRODUCT_BASE}/${encodeURIComponent(p.slug)}`}
        className="block"
      >
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
        <p className="mt-3 line-clamp-2 text-base font-bold leading-snug text-[#1a1013] sm:text-[17px]">
          {nameOf(p)}
        </p>
        {price && <p className="mt-1 text-sm text-[#8a7f7f]">{price}</p>}
      </Link>
      <WishlistButton
        productId={p.slug}
        size={16}
        className="absolute right-2 top-2 z-10 h-8 w-8"
      />
    </div>
  );
}

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);


  const router = useRouter();
  const [type, setType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");


  // Opening a single category link (e.g. a service) selects its matching tab
  useEffect(() => {
    // the header "Pujas" button links to /shop/category/services
    if (slug === "services") {
      setType("SERVICE");
      return;
    }
    const ct = categories.find((c) => c.slug === slug)?.type;
    if (ct) setType(ct);
  }, [slug, categories]);


  const cat = categories.find((c) => c.slug === slug);
  const isAll = slug === "all" || !cat;

  // One section per category, each holding only its own products
  const sections = useMemo(() => {
    const scoped = (
      isAll ? categories : categories.filter((c) => c.slug === slug)
    ).filter((c) => (c.type ?? "PRODUCT") === type);
    return scoped
      .map((c) => {
        const list: any[] = products.filter((p) => p.category === c.slug);
        return { cat: c, list };
      })
      .filter((s) => s.list.length);
  }, [categories, products, slug, isAll, type]);

  // Top 3 services: most ordered, then highest price
  const topServices = useMemo(() => {
    const serviceSlugs = new Set(
      categories.filter((c) => c.type === "SERVICE").map((c) => c.slug),
    );
    return products
      .filter((p: any) => serviceSlugs.has(p.category))
      .sort(
        (a: any, b: any) =>
          ordersOf(b) - ordersOf(a) || Number(b.price) - Number(a.price),
      )
      .slice(0, 3);
  }, [products, categories]);

  return (
    <div className="relative pb-24">
      {/* HERO */}
      <section className="mx-auto mt-6 max-w-[1140px] px-4">
        <div
          className="relative overflow-hidden rounded-[32px] border border-[#f6c453]/50 px-6 pb-8 pt-12 text-center shadow-[0_20px_40px_-20px_rgba(90,8,20,0.6)]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(246,196,83,0.30), transparent 55%), radial-gradient(circle at 1px 1px, rgba(246,196,83,0.10) 1.5px, transparent 0) 0 0/34px 34px, linear-gradient(180deg,#5a0612 0%,#7d0b1e 55%,#8f1025 100%)",
          }}
        >
          {/* marigold toran along the top */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-5"
            style={{
              background:
                "radial-gradient(circle at 11px 8px, #f59e0b 6px, transparent 7px) 0 0/22px 18px repeat-x, radial-gradient(circle at 22px 8px, #f6c453 4px, transparent 5px) 0 0/22px 18px repeat-x",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#f6c453] to-transparent" />

          {/* inner gold frame */}
          <div className="pointer-events-none absolute inset-3 rounded-[24px] border border-[#f6c453]/25" />

          {/* slowly turning mandalas */}
          <Mandala
            className="pointer-events-none absolute -left-16 top-1/2 h-64 w-64 -translate-y-1/2 animate-spin opacity-20"
            // @ts-ignore
            style={{ animationDuration: "90s" }}
          />
          <Mandala
            className="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 animate-spin opacity-20"
            // @ts-ignore
            style={{ animationDuration: "90s", animationDirection: "reverse" }}
          />


          <style>{`@keyframes bellSwing{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}`}</style>
          <SideOrnaments side="left" />
          <SideOrnaments side="right" />

          {topServices.length > 0 && (
            <div className="relative z-10">
              <div
                className="text-4xl leading-none text-[#f6c453]"
                style={{ textShadow: "0 0 18px rgba(246,196,83,0.7)" }}
              >
                ॐ
              </div>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.2em] text-[#f6c453] sm:text-3xl">
                Top Services
              </h2>
              <p className="mt-1 text-sm text-[#f1dfb6]/80">
                Most loved sacred services, chosen by devotees
              </p>

              {/* lotus divider */}
              <div className="my-5 flex items-center justify-center gap-3 text-[#f6c453]">
                <span className="h-px w-20 bg-gradient-to-r from-transparent to-[#f6c453]" />
                <span className="text-lg">❁</span>
                <span className="h-px w-20 bg-gradient-to-l from-transparent to-[#f6c453]" />
              </div>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-8">
                {topServices.map((p: any) => (
                  <TopTile key={p.slug} p={p} />
                ))}
              </div>

              <div className="mt-7 flex items-center justify-center gap-3 text-[#f6c453]/80">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#f6c453]/70" />
                <span className="text-sm tracking-[0.3em]">✦ ✦ ✦</span>
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#f6c453]/70" />
              </div>
            </div>
          )}

          



          
        </div>
      </section>

      {/* TYPE TOGGLE */}
      <div className="relative z-10 mt-8 flex justify-center px-4">
        <div className="inline-flex rounded-full border border-[#f1dfb6] bg-white p-1 shadow-md">
          {(["PRODUCT", "SERVICE"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setType(k);
                if (!isAll) router.push(`${CATEGORY_BASE}/all`);
              }}
              className={`rounded-full px-8 py-2.5 text-sm font-bold transition ${
                type === k
                  ? "bg-[#7a1118] text-[#f6c453] shadow"
                  : "text-[#8a1024] hover:bg-[#fff8e6]"
              }`}
            >
              {k === "PRODUCT" ? "Products" : "Services"}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS BY CATEGORY */}
      <section className="mx-auto mt-8 max-w-[1140px] px-4">
        <div className="mb-8 flex items-center gap-5">
          <h2 className="text-3xl font-black text-[#1a1013]">
            {isAll ? (type === "SERVICE" ? "Service categories" : "Product categories") : cat!.name}
          </h2>
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
            <div
              key={c.slug}
              id={c.slug}
              className={`scroll-mt-28 py-7 ${idx ? "border-t border-[#f6edd2]" : ""}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-3 text-[22px] font-extrabold text-[#8a0b27]">
                  {c.name}
                  {(c as any).type && (
                    <span className="rounded-full border border-[#f1dfb6] bg-[#fff8e6] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8a1024]">
                      {(c as any).type === "SERVICE" ? "Service" : "Product"}
                    </span>
                  )}
                </h3>
                {isAll && (
                  <Link
                    href={`${CATEGORY_BASE}/${c.slug}`}
                    className="rounded-full border border-[#efe3cc] bg-white px-5 py-2 text-sm font-bold text-[#8a0b27] shadow-sm transition hover:bg-[#fff8e6]"
                  >
                    View All →
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-10">
                {shown.map((p) => (
                  <Tile key={p.slug} p={p} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
