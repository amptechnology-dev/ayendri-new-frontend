"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Product, inr, off } from "../data";
import { useBookingAdd } from "./useBookingAdd";
import WishlistButton from "./WishlistButton";
import { StarsDisplay } from "./Stars";

export default function ProductCard({ p }: { p: Product }) {
  const [done, setDone] = useState(false);
  const { add, modal } = useBookingAdd();
  const quickAdd = () =>
    add(p as any, 1, () => {
      setDone(true);
      setTimeout(() => setDone(false), 1200);
    });
  const rating = Number(p.rating) || 0;
  const count = Number(p.reviews) || 0;
  const top = p.topReview;

  return (
    <div className="group flex w-full min-w-0 flex-col">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#fff1da] shadow-[0_6px_18px_rgba(74,7,16,.10)] sm:rounded-2xl">
        <Link href={`/shop/product/${p.slug}`} className="block h-full">
          <img
            src={p.image}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
        </Link>

        <WishlistButton
          productId={p.slug}
          className="absolute right-2 top-2 z-10 h-8 w-8 sm:right-3 sm:top-3 sm:h-9 sm:w-9"
        />
        <span className="absolute left-0 top-2 rounded-r-full bg-[#a3161c] px-2 py-0.5 text-[10px] font-bold text-white shadow sm:top-3 sm:px-3 sm:py-1 sm:text-[11px]">
          Sale
        </span>
        <button
          onClick={quickAdd}
          aria-label="Add to cart"
          className={`shop-add absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-lg shadow-lg sm:bottom-3 sm:right-3 sm:h-9 sm:w-9 sm:rounded-xl ${done ? "bg-green-600 text-white" : "bg-white text-[#7a1118]"}`}
        >
          {done ? <Check size={16} /> : <Plus size={16} />}
        </button>
      </div>

      <span className="mt-2 w-fit max-w-full truncate rounded-md border border-[#e8cfa8] bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6b4a4a] sm:mt-3 sm:px-2 sm:text-[11px]">
        {p.tag ?? p.category}
      </span>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-1.5 sm:mt-1.5 sm:gap-x-2">
        <span className="text-base font-extrabold text-[#2a0a0d] sm:text-lg">
          {inr(p.price)}
        </span>
        <span className="text-[11px] text-[#9a8080] line-through sm:text-xs">
          {inr(p.mrp)}
        </span>
      </div>
      <div className="text-[11px] font-bold text-green-700 sm:text-xs">{off(p)}% OFF</div>
      <Link
        href={`/shop/product/${p.slug}`}
        className="mt-0.5 line-clamp-2 text-[13px] font-semibold leading-snug hover:text-[#a3161c] sm:mt-1 sm:text-sm"
      >
        {p.name}
      </Link>

      {/* rating (half star included) */}
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[11px] sm:gap-1.5 sm:text-xs">
        {count > 0 ? (
          <>
            <StarsDisplay value={rating} size={11} />
            <b className="text-[#2a0a0d]">{rating.toFixed(1)}</b>
            <span className="text-[#9a8080]">
              ({count.toLocaleString("en-IN")})
            </span>
          </>
        ) : (
          <span className="text-[#9a8080]">No reviews yet</span>
        )}
      </div>

      {/* top-rated review (hidden on phones to keep cards compact) */}
      {top?.comment && (
        <p className="mt-1.5 hidden text-[11px] italic leading-snug text-[#6b4a4a] sm:line-clamp-2">
          “{top.comment}”
          <span className="not-italic text-[#9a8080]">
            {" "}
            — {top.user?.name ?? "Customer"}
          </span>
        </p>
      )}
      {modal}
    </div>
  );
}