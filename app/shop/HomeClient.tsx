"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { useShop } from "./shop-data";
import ProductCard from "./components/ProductCard";
import Countdown from "./components/Countdown";
import HeroCarousel from "./components/HeroCarousel";
import Carousel from "./components/Carousel";
import HomeSections from "./components/HomeSections";
import HeroArt from "./components/HeroArt";

function Reveal({ children }: { children: ReactNode; delay?: number }) {
  return <>{children}</>;
}

export default function ShopHome() {
  const offers = useShop((s) => s.offerBanners);
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);
  const t = (d?: string) => Date.parse(d ?? "") || 0;
  const newest = [...products]
    .sort((a, b) => t(b.createdAt) - t(a.createdAt))
    .slice(0, 8);

  return (
    <>
      {/* HERO */}
      <section className="shop-hero-bg relative isolate overflow-hidden">
        <h1 className="sr-only">
          AYENDRI: Sacred Rudraksha, Malas, Idols &amp; Puja Essentials
        </h1>
        <HeroArt />
        <div className="relative mx-auto max-w-[1000px] px-4 pt-5">
          <HeroCarousel />
          <Link
            href="/shop/category/idols"
            className="shop-gold-btn relative z-10 mx-auto -mt-5 flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-[13px] transition hover:-translate-y-0.5 sm:-mt-6 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base"
          >
            Explore Diwali offers <ArrowRight size={16} />
          </Link>
        </div>
        <div className="shop-scallop mt-6" />
      </section>

      {/* For You + store circles */}
      <Reveal>
        <section className="shop-scroll mx-auto flex max-w-[1300px] items-start gap-3 overflow-x-auto px-4 pt-4 sm:gap-5 sm:px-6 sm:pt-6">
          <div className="flex shrink-0 flex-col items-center gap-1 text-center text-[10px] font-semibold leading-tight sm:text-xs">
            <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-[#f7a04b] bg-[#fff1da] text-lg sm:h-16 sm:w-16 sm:text-2xl">
              🏪
            </div>
            For You
          </div>
          {categories.slice(0, 5).map((c, i) => (
            <Link
              key={c.slug}
              href={`/shop/category/${c.slug}`}
              className="group flex shrink-0 flex-col items-center gap-1 text-center text-[10px] font-semibold leading-tight sm:text-xs"
            >
              <span className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-[#f2b632] bg-white transition group-hover:scale-110 sm:h-16 sm:w-16">
                <img
                  src={
                    c.image ||
                    (products.length ? products[i % products.length]?.image : undefined) ||
                    "/img/photos/product-puja.jpg"
                  }
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </span>
              <span className="max-w-[80px] sm:max-w-[96px]">{c.name}</span>
            </Link>
          ))}
        </section>
      </Reveal>

      {/* DEALS LIVE */}
      <Reveal>
        <section className="mx-auto flex max-w-[1300px] flex-col items-start gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-8">
          <div>
            <h2 className="flex items-center gap-2 whitespace-nowrap text-2xl font-black text-[#a3161c] sm:gap-3 sm:text-3xl">
              <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#e0262d]" />{" "}
              DEALS LIVE NOW
            </h2>
            <Link
              href="/shop/category/all"
              className="mt-1 inline-flex items-center gap-1 font-semibold text-[#7a1118]"
            >
              Explore all <ArrowRight size={15} />
            </Link>
          </div>
          <Countdown />
        </section>
      </Reveal>
      <Reveal>
        <div className="mx-auto max-w-[1300px] px-6">
          <Carousel>
            {newest.map((p) => (
              <ProductCard key={p.slug} p={p} />
            ))}
          </Carousel>
        </div>
      </Reveal>

      {/* Bundle & Save */}
      <Reveal>
        <section className="mx-auto max-w-[1300px] px-6 py-8">
          {offers.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {offers.map((o) => (
                <Link
                  key={o.id}
                  href={
                    o.productId
                      ? `/shop/product/${o.productId}`
                      : "/shop/category/all"
                  }
                  className="relative block min-h-[160px] overflow-hidden rounded-3xl bg-gradient-to-r from-[#fde7c8] to-[#fff1da] p-8 transition hover:shadow-xl"
                >
                  <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-widest">
                    LIMITED TIME
                  </span>
                  <h3 className="mt-3 max-w-[60%] text-2xl font-black text-[#4a0710]">
                    {o.name || "Bundle & Save This Week"}
                  </h3>
                  {o.image && (
                    <div className="absolute right-0 top-0 h-full w-2/5">
                      <img
                        src={o.image}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-r from-[#fde7c8] to-[#fff1da] p-8 transition hover:shadow-xl">
              <span className="rounded-full bg-white/70 px-3 py-1 text-[10px] font-bold tracking-widest">
                LIMITED TIME
              </span>
              <h3 className="mt-3 text-2xl font-black text-[#4a0710]">
                Bundle &amp; Save
                <br />
                This Week
              </h3>
            </div>
          )}
        </section>
      </Reveal>

      <HomeSections />

      {/* CATEGORIES */}
      <Reveal>
        <section className="mx-auto max-w-[1300px] px-4 py-6 sm:px-6">
  <h2 className="mb-4 text-xl font-extrabold text-[#4a0710] sm:mb-6 sm:text-2xl">
    Shop by Category
  </h2>
  <div className="grid grid-cols-3 gap-2.5 sm:gap-4 md:grid-cols-5 lg:grid-cols-9">
            {categories.map((c, i) => (
              <Link
                key={c.slug}
                href={`/shop/category/${c.slug}`}
                className="shop-card flex min-w-0 flex-col items-center gap-2 px-1.5 py-3 text-center sm:gap-3 sm:p-4"
              >
                <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#f2b632] sm:h-16 sm:w-16">
                  <img
                    src={
                      c.image ||
                      (products.length
                        ? products[i % products.length]?.image
                        : undefined) ||
                      "/img/photos/product-puja.jpg"
                    }
                    alt={c.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </span>
                <span className="w-full break-words text-[11px] font-bold leading-tight sm:text-xs">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      </Reveal>

      {/* TRUST STRIP */}
      <section className="shop-hero-bg">
        <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-6 px-6 py-8 text-center text-white md:grid-cols-4">
          {[
            "100% Certified & Energised",
            "Free Shipping above ₹499",
            "7-Day Easy Returns",
            "Secure Payments",
          ].map((label) => (
            <Reveal key={label}>
              <div className="text-sm font-semibold">
                <span className="mb-1 block text-xl text-[#f2b632]">✦</span>
                {label}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MORE PRODUCTS */}
      <Reveal>
        <section className="mx-auto max-w-[1300px] px-6 pt-10">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-extrabold text-[#4a0710]">
              More Products
            </h2>
            <Link
              href="/shop/category/all"
              className="text-sm font-semibold text-[#e0622d]"
            >
              See all →
            </Link>
          </div>
        </section>
      </Reveal>
      <div className="mx-auto grid max-w-[1300px] grid-cols-2 gap-x-5 gap-y-8 px-6 md:grid-cols-4">
        {products.slice(0, 24).map((p) => (
          <Reveal key={p.slug}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </>
  );
}