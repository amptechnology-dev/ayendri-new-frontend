"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useShop } from "../shop-data";
import type { Product } from "../data";
import ProductCard from "../components/ProductCard";

const RKEY = "ayendri-recent-searches";
type Sort = "Relevance" | "Price: Low to High" | "Price: High to Low" | "Rating";

/* ---------- matching (same idea as the app) ---------- */
const JEWELRY = [
  "jewelry", "jewellery", "ring", "rings", "bracelet", "bracelets",
  "earring", "earrings", "necklace", "necklaces", "pendant", "pendants",
  "accessory", "accessories",
];
const SYNONYMS: Record<string, string[]> = {
  ring: JEWELRY, jewelry: JEWELRY, jewellery: JEWELRY,
  bracelet: JEWELRY, necklace: JEWELRY, earring: JEWELRY,
};

const expand = (word: string) => {
  const stem = word.length > 3 ? word.replace(/s$/, "") : word;
  return [word, stem, ...(SYNONYMS[word] ?? SYNONYMS[stem] ?? [])].filter(Boolean);
};

const matches = (p: Product, query: string) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [p.name, p.description, p.categoryName].filter(Boolean).join(" ").toLowerCase();
  return words.every((w) => expand(w).some((t) => hay.includes(t)));
};

const priceKey = (p: Product, missing: number) => (p.price > 0 ? p.price : missing);

function Inner() {
  const q = (useSearchParams().get("q") ?? "").trim();
  const router = useRouter();
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);

  const [text, setText] = useState(q);
  const [recent, setRecent] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [sort, setSort] = useState<Sort>("Relevance");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [rating, setRating] = useState(0);
  const [onlyOffer, setOnlyOffer] = useState(false);

  useEffect(() => setText(q), [q]);
  useEffect(() => {
    try {
      setRecent(JSON.parse(localStorage.getItem(RKEY) || "[]"));
    } catch {}
  }, []);

  const go = (s: string) => {
    const term = s.trim();
    if (!term) return;
    const next = [term, ...recent.filter((r) => r !== term)].slice(0, 6);
    try {
      localStorage.setItem(RKEY, JSON.stringify(next));
    } catch {}
    setRecent(next);
    router.push(`/shop/search?q=${encodeURIComponent(term)}`);
  };

  const resetFilters = () => {
    setMin("");
    setMax("");
    setRating(0);
    setOnlyOffer(false);
    setSort("Relevance");
  };

  const activeCount =
    (sort !== "Relevance" ? 1 : 0) +
    (min || max ? 1 : 0) +
    (rating > 0 ? 1 : 0) +
    (onlyOffer ? 1 : 0);

  const results = useMemo(() => {
    const lo = Number(min) || 0;
    const hi = Number(max) || Infinity;
    let r = products.filter((p) => matches(p, q));
    // price-on-request items (price 0) can't be compared with a range
    if (lo > 0 || hi !== Infinity) r = r.filter((p) => p.price > 0 && p.price >= lo && p.price <= hi);
    if (rating) r = r.filter((p) => p.rating >= rating);
    if (onlyOffer) r = r.filter((p) => p.mrp > p.price);
    r = [...r];
    if (sort === "Price: Low to High")
      r.sort((a, b) => priceKey(a, Number.MAX_SAFE_INTEGER) - priceKey(b, Number.MAX_SAFE_INTEGER));
    if (sort === "Price: High to Low") r.sort((a, b) => priceKey(b, -1) - priceKey(a, -1));
    if (sort === "Rating") r.sort((a, b) => b.rating - a.rating);
    return r;
  }, [products, q, min, max, rating, onlyOffer, sort]);

  const loading = products.length === 0;
  const chip = (on: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-sm ${on ? "border-[#e0622d] bg-orange-50 font-bold" : "bg-white"}`;

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
        className="flex items-center gap-3 rounded-full border border-[#e8cfa8] bg-white px-5 py-3"
      >
        <Search size={18} />
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search products"
          className="flex-1 outline-none"
        />
      </form>

      {!q ? (
        <div className="mt-8 space-y-8">
          <div>
            <h3 className="text-xs font-bold tracking-widest text-[#9a7a7a]">RECENT SEARCHES</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.length ? (
                recent.map((r) => (
                  <button key={r} onClick={() => go(r)} className="rounded-full bg-white px-4 py-1.5 text-sm shadow">
                    {r}
                  </button>
                ))
              ) : (
                <span className="text-sm text-[#9a7a7a]">No recent searches</span>
              )}
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#9a7a7a]">RECOMMENDED STORES</h3>
              <div className="mt-2 flex flex-wrap gap-4">
                {categories.slice(0, 4).map((c) => (
                  <button
                    key={c.slug}
                    onClick={() => router.push(`/shop/category/${c.slug}`)}
                    className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#f2b632] bg-[#4a0710] p-1 text-center text-[10px] font-bold leading-tight text-white"
                  >
                    {c.name.slice(0, 12)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {products.length > 0 && (
            <div>
              <h3 className="text-xs font-bold tracking-widest text-[#9a7a7a]">TRENDING TODAY</h3>
              <div className="mt-2 grid grid-cols-2 gap-4 md:grid-cols-4">
                {products.slice(0, 4).map((p) => (
                  <ProductCard key={p.slug} p={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="shop-scroll mt-5 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setSheet(true)}
              className={`flex items-center gap-2 ${chip(activeCount > 0)}`}
            >
              <SlidersHorizontal size={14} /> Sort & Filter{activeCount > 0 ? ` (${activeCount})` : ""}
            </button>
            <button
              onClick={() => setSort(sort === "Price: Low to High" ? "Relevance" : "Price: Low to High")}
              className={chip(sort === "Price: Low to High")}
            >
              Price: Low to High
            </button>
            <button onClick={() => setRating(rating === 4 ? 0 : 4)} className={chip(rating === 4)}>
              4★ & above
            </button>
            <button onClick={() => setOnlyOffer((v) => !v)} className={chip(onlyOffer)}>
              On offer
            </button>
          </div>

          {loading ? (
            <p className="py-16 text-center text-[#9a7a7a]">Loading products…</p>
          ) : results.length > 0 ? (
            <>
              <p className="mt-4 text-sm text-[#9a7a7a]">
                {results.length} result{results.length === 1 ? "" : "s"} for “{q}”
              </p>
              <div className="mt-3 grid grid-cols-2 gap-5 md:grid-cols-4">
                {results.map((p) => (
                  <ProductCard key={p.slug} p={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-[#9a7a7a]">
              <p>No results for “{q}”.</p>
              {activeCount > 0 && (
                <button onClick={resetFilters} className="mt-3 font-bold text-[#e0622d]">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </>
      )}

      {sheet && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-black/50 md:place-items-center">
          <div className="w-full max-w-md space-y-4 rounded-t-3xl bg-white p-6 md:rounded-3xl">
            <div className="flex justify-between">
              <b className="text-lg">Sort & Filter</b>
              <button onClick={() => setSheet(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-widest">SORT BY</p>
              <div className="flex flex-wrap gap-2">
                {(["Relevance", "Price: Low to High", "Price: High to Low", "Rating"] as Sort[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${sort === s ? "border-[#e0622d] bg-orange-50 font-bold" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-widest">PRICE RANGE (₹)</p>
              <div className="flex items-center gap-2">
                <input
                  value={min}
                  onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Min"
                  className="w-full rounded-xl border p-2"
                />
                to
                <input
                  value={max}
                  onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder="Max"
                  className="w-full rounded-xl border p-2"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold tracking-widest">RATING</p>
              <div className="flex flex-wrap gap-2">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRating(r)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${rating === r ? "border-[#e0622d] bg-orange-50 font-bold" : ""}`}
                  >
                    {r ? `${r}★ & above` : "Any"}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyOffer}
                onChange={(e) => setOnlyOffer(e.target.checked)}
                className="accent-[#e0622d]"
              />{" "}
              Only products on offer
            </label>

            <div className="flex gap-3">
              <button onClick={resetFilters} className="rounded-full border-2 border-[#4a0710] px-6 py-3 font-bold">
                Reset
              </button>
              <button onClick={() => setSheet(false)} className="shop-gold-btn flex-1 rounded-full py-3">
                Show {results.length} results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}