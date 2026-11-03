"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

const POINTS = [
  "100% certified & energised Rudraksha, malas and idols",
  "Puja essentials for every day, in one place",
  "Careful packaging and delivery across India",
  "Easy 7-day returns and friendly support",
];

export default function AboutCard() {
  return (
    <section className="mx-auto max-w-[1300px] px-3 py-5 sm:px-6 sm:py-8">
      <div className="grid overflow-hidden rounded-3xl bg-gradient-to-r from-[#fde7c8] to-[#fff1da] transition hover:shadow-xl md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* image (left) */}
        <div className="relative h-[180px] md:h-auto md:min-h-[280px]">
          <img
            src="/img/photos/product-puja.jpg" // replace with your own about image
            alt="About AYENDRI"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* description (right) */}
        <div className="flex flex-col justify-center p-5 sm:p-8">
          <span className="w-fit rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-widest">
            OUR STORY
          </span>
          <h2 className="mt-3 text-xl font-black text-[#4a0710] sm:text-2xl">About AYENDRI</h2>

          <ul className="mt-3 space-y-2">
            {POINTS.map((t) => (
              <li key={t} className="flex items-start gap-2 text-[13px] leading-5 text-[#4a2a20] sm:text-sm">
                <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-[#7a1118] text-white">
                  <Check size={10} strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>

          <Link
            href="/shop/about"
            className="shop-gold-btn mt-5 inline-flex w-fit items-center gap-2 rounded-full px-6 py-2.5 text-sm transition hover:-translate-y-0.5"
          >
            Know more about us <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}