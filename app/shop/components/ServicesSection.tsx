"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarCheck, ArrowRight } from "lucide-react";
import { inr, type Product } from "../data";
import { useShop } from "../shop-data";

// Change this one line if your field is named differently
export const isService = (p: Product) => p.productType === "SERVICE";

export default function ServicesSection() {
  const products = useShop((s) => s.products);
  const services = products.filter(isService);
  if (!services.length) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#6e0d18] via-[#4a0710] to-[#2e040a] px-4 py-12 sm:px-6 sm:py-16">
      {/* decorative glow + corner ornaments */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#f2b632]/20 blur-3xl" />
      <span className="pointer-events-none absolute left-4 top-4 text-3xl opacity-60 sm:text-5xl">🪔</span>
      <span className="pointer-events-none absolute right-4 top-4 text-3xl opacity-60 sm:text-5xl">🪔</span>

      <div className="relative mx-auto max-w-[1300px]">
        <div className="text-center">
          <div className="text-xs font-bold tracking-[.45em] text-[#f2b632] sm:text-sm">✦ AYENDRI ✦</div>
          <h2 className="mt-1 font-serif text-5xl font-bold text-[#ffd66b] sm:text-6xl md:text-7xl [text-shadow:0_2px_12px_rgba(242,182,50,.45)]">
            Crafted for Devotion
          </h2>
          <div className="mx-auto mt-3 flex items-center justify-center gap-3 text-[#f2b632]">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#f2b632] sm:w-20" />
            <span>❖</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#f2b632] sm:w-20" />
          </div>
          <p className="mt-3 text-sm font-medium italic text-[#fff1c2] sm:text-lg">
            Sacred rituals, performed with devotion.
          </p>
        </div>

        <div className="shop-scroll mt-8 flex gap-4 overflow-x-auto pb-4 sm:gap-6 md:flex-wrap md:justify-center md:overflow-visible max-md:[&>*:first-child]:ml-auto max-md:[&>*:last-child]:mr-auto">
          {services.slice(0, 8).map((p) => (
            <Link
              key={p.slug}
              href={`/shop/product/${p.slug}`}
              className="group relative flex w-[230px] shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-[#f2b632]/70 bg-[#fff4dc] shadow-xl transition hover:-translate-y-1.5 hover:shadow-2xl md:w-[calc((100%-3rem)/3)] lg:w-[calc((100%-4.5rem)/4)]"
            >
              <span className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-[#7a1118] px-3 py-1 text-[10px] font-bold tracking-widest text-[#f2b632] shadow">
                <CalendarCheck size={12} /> SERVICE
              </span>
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#fff4dc] to-transparent" />
              </div>
              <div className="flex flex-1 flex-col p-4 pt-1 text-center">
                <h3 className="line-clamp-2 text-base font-extrabold leading-tight text-[#4a0710]">{p.name}</h3>
                <div className="mt-2 text-lg font-black text-[#a3161c]">
                  {inr(p.price)}
                  {p.mrp > p.price && <s className="ml-2 text-xs font-medium text-[#9a8080]">{inr(p.mrp)}</s>}
                </div>
                <span className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-[#f2b632] to-[#e0822d] px-5 py-2 text-sm font-bold text-[#4a0710] transition group-hover:brightness-110">
                  Book now <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}