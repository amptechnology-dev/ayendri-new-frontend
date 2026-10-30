"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Heart, ShoppingBag, Trash2 } from "lucide-react";
import { useAuth, errMsg } from "../auth";
import {
  fetchWishlist,
  removeFromWishlist,
  type WishlistProduct,
} from "../wishlist";
import { fetchProducts, mapProduct } from "../api";

const inr = (amount: number) =>
new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 0,
}).format(amount);

export default function WishlistPage() {
const token = useAuth((state) => state.token);
const ready = useAuth((state) => state.ready);
const [items, setItems] = useState<WishlistProduct[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [removing, setRemoving] = useState<string | null>(null);
const [livePrices, setLivePrices] = useState<Record<string, number>>({});

const loadWishlist = useCallback(async () => {
if (!ready) return;
if (!token) {
setItems([]);
setLoading(false);
return;
}

setLoading(true);
setError("");

try {
  const wishlist = await fetchWishlist();
  setItems(wishlist);
} catch (err) {
  setError(
    errMsg(err, "Unable to load your wishlist."),
  );
} finally {
  setLoading(false);
}

}, [token, ready]);

useEffect(() => {
void loadWishlist();
}, [loadWishlist]);

useEffect(() => {
let active = true;
fetchProducts()
  .then((json) => {
    if (!active) return;
    const map: Record<string, number> = {};
    for (const p of json?.products ?? []) {
      const m = mapProduct(p);
      if (m.price > 0) map[m.slug] = m.price;
    }
    setLivePrices(map);
  })
  .catch(() => undefined);
return () => {
  active = false;
};
}, []);

const removeItem = async (productId: string) => {
const previous = items;

setRemoving(productId);
setError("");
setItems((current) => current.filter((item) => item.id !== productId));

try {
  await removeFromWishlist(productId);
} catch (err) {
    if ((err as any)?.response?.status === 401) useAuth.getState().signOut();
  setItems(previous);
  setError(
    errMsg(err, "Unable to update your wishlist."),
  );
} finally {
  setRemoving(null);
}

};

if (!ready) {
return <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-12" aria-busy="true" />;
}

if (!token) {
return (
<main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
<Heart size={48} className="mb-4 text-[#D5684A]" />
<h1 className="text-2xl font-extrabold text-[#17211D]">
Your Wishlist
</h1>
<p className="mt-2 text-sm text-gray-500">
Sign in to view your saved products.
</p>
<Link href="/shop/login" className="mt-6 rounded-full bg-[#D5684A] px-6 py-3 font-bold text-white transition hover:bg-[#bd563c]" >
Sign In
</Link>
</main>
);
}

return (
<main className="mx-auto min-h-[65vh] max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
<Link href="/shop" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-[#D5684A]" >
<ArrowLeft size={17} />
Continue Shopping
</Link>

  <div className="mb-8 flex items-center justify-between gap-4">
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-[#D5684A]">
        Your favourites
      </p>
      <h1 className="text-3xl font-extrabold tracking-tight text-[#17211D] sm:text-4xl">
        My Wishlist
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        {items.length} {items.length === 1 ? "product" : "products"} saved
      </p>
    </div>

    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#FBEAE6]">
      <Heart size={23} className="text-[#D5684A]" />
    </div>
  </div>

  {error && (
    <div
      role="alert"
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
    >
      <span>{error}</span>
      <button
        onClick={() => void loadWishlist()}
        className="font-bold underline"
      >
        Retry
      </button>
    </div>
  )}

  {loading ? (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl border border-gray-100"
        >
          <div className="aspect-square bg-gray-100" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-3/4 rounded bg-gray-100" />
            <div className="h-4 w-1/2 rounded bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  ) : items.length === 0 ? (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 px-6 py-16 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-full bg-[#FBEAE6]">
        <ShoppingBag size={34} className="text-[#D5684A]" />
      </div>
      <h2 className="text-xl font-extrabold text-[#17211D]">
        Your wishlist is empty
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
        Save products you love and they will appear here for you to find
        later.
      </p>
      <Link
        href="/shop"
        className="mt-6 rounded-full bg-[#D5684A] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#bd563c]"
      >
        Explore Products
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {items.map((product) => (
        <article
          key={product.id}
          className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="relative aspect-square overflow-hidden bg-[#F6F3F2]">
            <Link
              href={`/shop/product/${encodeURIComponent(product.slug || product.id)}`}
              aria-label={`View ${product.name}`}
              className="absolute inset-0"
            >
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-full place-items-center text-gray-300">
                  <ShoppingBag size={40} />
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={() => void removeItem(product.id)}
              disabled={removing === product.id}
              aria-label={`Remove ${product.name} from wishlist`}
              title="Remove from wishlist"
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#D5684A] shadow-sm transition hover:bg-[#D5684A] hover:text-white disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>

            {product.isAvailable === false && (
              <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                Unavailable
              </span>
            )}
          </div>

          <div className="p-3 sm:p-4">
            {product.brand && (
              <p className="mb-1 truncate text-xs text-gray-500">
                {product.brand}
              </p>
            )}

            <Link href={`/shop/product/${encodeURIComponent(product.slug || product.id)}`}>
              <h2 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-[#17211D] transition hover:text-[#D5684A]">
                {product.name}
              </h2>
            </Link>

            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-base font-extrabold text-[#17211D]">
                {(livePrices[product.id] || product.price) > 0
  ? inr(livePrices[product.id] || product.price)
  : "View price"}
              </p>
              <Link
                href={`/shop/product/${encodeURIComponent(product.id)}`}
                aria-label={`View ${product.name}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#FBEAE6] text-[#D5684A] transition hover:bg-[#D5684A] hover:text-white"
              >
                <ShoppingBag size={15} />
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )}
</main>

);
}