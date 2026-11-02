"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Product, inr, off } from "../data";
import { useCart } from "../cart";
import WishlistButton from "./WishlistButton";
import { StarsDisplay } from "./Stars";

export default function ProductCard({ p }: { p: Product }) {
  const add = useCart((s) => s.add);
  const [done, setDone] = useState(false);

  const quickAdd = () => {
    add(p.slug);
    setDone(true);
    setTimeout(() => setDone(false), 1200);
  };

  const rating = Number(p.rating) || 0;
  const count = Number(p.reviews) || 0;
  const top = p.topReview;

  return (
    <div className="group flex w-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#fff1da] shadow-[0_8px_24px_rgba(74,7,16,.10)]">
        <Link href={`/shop/product/${p.slug}`} className="block h-full">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        </Link>

        <WishlistButton productId={p.slug} className="absolute right-3 top-3 z-10 h-9 w-9" />
        <span className="absolute left-0 top-3 rounded-r-full bg-[#a3161c] px-3 py-1 text-[11px] font-bold text-white shadow">Sale</span>
        <button
          onClick={quickAdd}
          aria-label="Add to cart"
          className={`shop-add absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-xl shadow-lg ${done ? "bg-green-600 text-white" : "bg-white text-[#7a1118]"}`}
        >
          {done ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <span className="mt-3 w-fit rounded-md border border-[#e8cfa8] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#6b4a4a]">
        {p.tag ?? p.category}
      </span>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-lg font-extrabold text-[#2a0a0d]">{inr(p.price)}</span>
        <span className="text-xs text-[#9a8080] line-through">{inr(p.mrp)}</span>
      </div>
      <div className="text-xs font-bold text-green-700">{off(p)}% OFF</div>
      <Link
        href={`/shop/product/${p.slug}`}
        className="mt-1 line-clamp-2 text-sm font-semibold leading-snug hover:text-[#a3161c]"
      >
        {p.name}
      </Link>

      {/* rating (half star shoho) */}
      <div className="mt-1 flex items-center gap-1.5 text-xs">
        {count > 0 ? (
          <>
            <StarsDisplay value={rating} size={12} />
            <b className="text-[#2a0a0d]">{rating.toFixed(1)}</b>
            <span className="text-[#9a8080]">({count.toLocaleString("en-IN")})</span>
          </>
        ) : (
          <span className="text-[#9a8080]">No reviews yet</span>
        )}
      </div>

      {/* sobcheye beshi rating er review */}
      {top?.comment && (
        <p className="mt-1.5 line-clamp-2 text-[11px] italic leading-snug text-[#6b4a4a]">
          “{top.comment}”
          <span className="not-italic text-[#9a8080]">
            {" "}
            — {top.user?.name ?? "Customer"}
          </span>
        </p>
      )}
    </div>
  );
}