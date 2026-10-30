"use client";
/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useShop } from "../shop-data";

const fallbackSlides = [
  <div key="s1" className="absolute inset-0 bg-gradient-to-br from-[#ffb04a] to-[#f2762e]">
    <Image src="/img/photos/hero.jpg" alt="Diwali offers" fill priority className="object-cover mix-blend-multiply opacity-60" />
    <div className="absolute inset-0 bg-gradient-to-r from-[#ff9a3c]/95 via-[#ff9a3c]/40 to-transparent" />
    <div className="absolute left-[4%] top-[12%] text-white">
      <div className="text-lg font-bold">upto</div>
      <div className="text-6xl font-black leading-none md:text-8xl">70%<span className="ml-1 text-2xl md:text-3xl">off</span></div>
      <div className="mt-3 text-4xl font-extrabold text-[#a3161c] md:text-6xl">Lowest</div>
      <div className="text-3xl font-semibold md:text-5xl">price ever!</div>
    </div>
    <div className="absolute right-[6%] top-[8%] text-2xl font-extrabold text-[#a3161c] md:text-4xl">ये दिवाली राम राज्य वाली!</div>
  </div>,

  <div key="s2" className="absolute inset-0 bg-gradient-to-br from-[#fff1da] to-[#ffd27a]">
    <div className="absolute right-[8%] top-1/2 -translate-y-1/2 text-right text-[#a3161c]">
      <div className="text-lg font-bold">flat</div>
      <div className="text-6xl font-black leading-none md:text-8xl">50%<span className="ml-1 text-2xl">off</span></div>
    </div>
    <div className="absolute left-[6%] top-1/2 -translate-y-1/2 text-3xl font-extrabold text-[#4a0710] md:text-5xl">ये दिवाली<br />राम राज्य वाली!</div>
  </div>,
];

export default function HeroCarousel() {
  const allBanners = useShop((s) => s.banners);
  const banners = allBanners.filter((b) => !b.categoryId);

  const slides = banners.length
    ? banners.map((b, idx) => (
        <Link
          key={b.id}
          href={b.productId ? `/shop/product/${b.productId}` : "/shop/category/all"}
          className="absolute inset-0 block"
        >
          <img
            src={b.image}
            alt={b.name || "Offer"}
            loading={idx === 0 ? "eager" : "lazy"}
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </Link>
      ))
    : fallbackSlides;

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    setI(0);
  }, [slides.length]);

  useEffect(() => {
    if (paused || slides.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [paused, slides.length]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative aspect-[16/8.5] overflow-hidden rounded-[26px] shadow-[0_30px_60px_rgba(0,0,0,.35)]"
    >
      {slides.map((s, k) => (
        <div key={k} className={`shop-slide absolute inset-0 ${k === i ? "on" : ""}`}>
          {s}
        </div>
      ))}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {slides.map((_, k) => (
          <button
            key={k}
            aria-label={`Slide ${k + 1}`}
            onClick={() => setI(k)}
            className={`h-2 rounded-full transition-all ${k === i ? "w-7 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}