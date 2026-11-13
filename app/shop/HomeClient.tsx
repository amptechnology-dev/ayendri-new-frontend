"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Download } from "lucide-react";

import { useShop } from "./shop-data";
import ProductCard from "./components/ProductCard";

import HeroCarousel from "./components/HeroCarousel";
import Carousel from "./components/Carousel";
import HomeSections from "./components/HomeSections";
import HeroArt from "./components/HeroArt";
import ServicesSection, { isService } from "./components/ServicesSection";

function Reveal({ children }: { children: ReactNode; delay?: number }) {
  return <>{children}</>;
}

export default function ShopHome() {
  const offers = useShop((s) => s.offerBanners);
  const products = useShop((s) => s.products);
  const categories = useShop((s) => s.categories);

  const physical = products.filter((p) => !isService(p));
  const serviceCats = categories.filter((c) => c.type === "SERVICE");

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
          {/* <Link
            href="/shop/category/idols"
            className="shop-gold-btn relative z-10 mx-auto -mt-5 flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2 text-[13px] transition hover:-translate-y-0.5 sm:-mt-6 sm:gap-2 sm:px-8 sm:py-3.5 sm:text-base"
          >
            Explore Diwali offers <ArrowRight size={16} />
          </Link> */}
        </div>
        <div className="shop-scallop mt-6" />
      </section>

      

      {/* APP OFFER */}
      <Reveal>
        <section className="w-full border-y border-[#f2b632] bg-[#4a0710]">
          <div className="mx-auto flex max-w-[1500px] flex-col items-center gap-4 px-4 py-4 sm:px-6 md:flex-row md:justify-between">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-3xl font-black leading-none text-[#ffd66b] sm:text-4xl">20%</div>
                <div className="mt-1 text-[10px] font-bold tracking-[.2em] text-white/80">OFF PRODUCTS</div>
              </div>
              <div className="h-10 w-px bg-[#f2b632]/40" />
              <div className="text-center">
                <div className="text-3xl font-black leading-none text-[#ffd66b] sm:text-4xl">10%</div>
                <div className="mt-1 text-[10px] font-bold tracking-[.2em] text-white/80">OFF SERVICES</div>
              </div>
            </div>

            <div className="text-center md:flex-1 md:text-left">
              <div className="text-base font-extrabold text-white sm:text-lg">Download the app and save more</div>
              <div className="mt-0.5 text-xs text-[#fff1c2] sm:text-sm">Only available in the app, not on the website.</div>
            </div>

            <a
              href="https://play.google.com/store/apps/details?id=com.ampdevs.eshop"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 bg-[#f2b632] px-6 py-3 text-sm font-extrabold text-[#4a0710] transition hover:bg-[#ffd66b] md:w-auto"
            >
              <Download size={18} />
              Get the app
            </a>
          </div>
        </section>
      </Reveal>

      {/* SERVICE CATEGORIES */}
      {serviceCats.length > 0 && (
        <>
          <Reveal>
            <section className="mx-auto flex max-w-[1500px] flex-col items-start gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-8">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.3em] text-[#d99a1e]">
                  ✦ Sacred Services
                </p>
                <h2 className="flex items-center gap-2 text-2xl font-black text-[#a3161c] sm:gap-3 sm:text-3xl">
                  <span className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-[#e0262d]" />
                  Book a Blessing, Begin with Faith
                </h2>
                <p className="mt-1 text-sm font-medium text-[#7a1118]">
                  Pujas, rituals and guidance by trusted pandits, booked in a
                  few taps
                </p>
                <Link
                  href="/shop/category/all"
                  className="mt-2 inline-flex items-center gap-1 font-semibold text-[#7a1118]"
                >
                  Explore all <ArrowRight size={15} />
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Verified pandits", "Easy booking", "Pan-India"].map((b) => (
                  <span
                    key={b}
                    className="rounded-full border border-[#f1dfb6] bg-[#fff8e6] px-3 py-1 text-xs font-bold text-[#8a1024]"
                  >
                    ✦ {b}
                  </span>
                ))}
              </div>
            </section>
          </Reveal>
          <Reveal>
            <div className="mx-auto max-w-[1500px] px-3">
              <div className="-mx-3 flex snap-x gap-2 overflow-x-auto px-3 pb-4 pt-2 sm:mx-0 sm:gap-6 sm:px-0 [&>*:first-child]:ml-auto [&>*:last-child]:mr-auto [scrollbar-width:thin] [scrollbar-color:#d99a1e_#f6e7c8] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#f6e7c8] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#d99a1e]">
                {serviceCats.map((c, i) => {
                  const count = products.filter(
                    (p) => p.category === c.slug,
                  ).length;
                  return (
                    <Link
                      key={c.slug}
                      href={`/shop/category/${c.slug}`}
                      className="group relative block w-[calc((100vw-2.5rem)/3)] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#f1dfb6] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:w-[300px] sm:max-w-[300px]"
                    >
                      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#fff4dc] to-[#f6d9a8]">
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
                          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <span className="absolute left-1 top-1 rounded-full bg-[#7a1118] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#f6c453] sm:left-2 sm:top-2 sm:px-2.5 sm:text-[10px] sm:tracking-wider">
                          Service
                        </span>
                      </div>
                      <div className="p-2 text-center sm:p-3">
                        <h3 className="line-clamp-1 text-xs font-extrabold text-[#1a1013] sm:text-lg">
                          {c.name}
                        </h3>
                        <p className="mt-0.5 text-[10px] text-[#8a7f7f] sm:mt-1 sm:text-sm">
                          {count
                            ? `${count} ${count === 1 ? "service" : "services"}`
                            : "Coming soon"}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#f6c453] bg-[#fff8e6] px-2.5 py-1 text-[11px] font-bold text-[#8a1024] transition group-hover:bg-[#f6c453] group-hover:text-[#5a0612] sm:mt-3 sm:gap-1.5 sm:px-5 sm:py-1.5 sm:text-sm">
                          Book now <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </Reveal>
          <div className="mx-auto mb-10 mt-6 flex max-w-[1500px] items-center gap-4 px-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#e9c46a]" />
            <span className="text-lg text-[#d99a1e]">🪔</span>
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#8a1024]">
              Our Featured Services
            </span>
            <span className="text-lg text-[#d99a1e]">🪔</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#e9c46a]" />
          </div>
        </>
      )}

      {/* SERVICES */}
      <Reveal>
        <ServicesSection />
      </Reveal>

      {/* Bundle & Save */}
      <Reveal>
        <section className="mx-auto max-w-[1500px] px-3 py-8">
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

      {/* TRUST STRIP */}
      <section className="shop-hero-bg">
        <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-6 px-3 py-8 text-center text-white md:grid-cols-4">
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
        <section className="mx-auto max-w-[1500px] px-3 pt-10">
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
      <div className="mx-auto grid max-w-[1500px] grid-cols-2 gap-x-3 gap-y-5 px-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {useShop.getState().products.map((p) => (
          <Reveal key={p.slug}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </>
  );
}
