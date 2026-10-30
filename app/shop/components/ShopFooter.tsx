"use client";
import Link from "next/link";
import Image from "next/image";
import { useShop } from "../shop-data";
import { useTerms } from "../terms-api";

const linkCls = "block py-1 text-sm text-white/75 transition hover:translate-x-0.5 hover:text-[#f2b632]";
const headCls = "mb-3 text-sm font-extrabold uppercase tracking-[.16em] text-[#f2b632]";

export default function ShopFooter() {
  const categories = useShop((s) => s.categories);
  const { terms, loading, error, reload } = useTerms();

  const shown = terms.slice(0, 6);

  return (
    <footer className="shop-hero-bg px-6 pb-28 pt-12 text-white/85">
      <div className="mx-auto grid max-w-[1300px] gap-10 md:grid-cols-[1.4fr_1fr_1.2fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Link href="/shop" className="inline-flex items-center gap-3">
            <Image src="/img/photos/ayendri-logo.png" alt="AYENDRI" width={52} height={52} />
            <div className="leading-tight">
              <div className="text-2xl font-extrabold tracking-[.18em] text-white">AYENDRI</div>
              <div className="text-[10px] text-white/70">Sacred · Vedic · Lifestyle</div>
            </div>
          </Link>
          <p className="mt-3 max-w-[280px] text-sm leading-relaxed text-white/70">
            Sacred for a Higher You. Authentic, energised spiritual products delivered with care.
          </p>
          {/* <Link
            href="/store"
            className="mt-4 inline-block rounded-full border border-[#f2b632]/60 px-4 py-1.5 text-xs font-bold text-[#f2b632] transition hover:bg-[#f2b632] hover:text-[#4a0710]"
          >
            Find a Store →
          </Link> */}
        </div>

        {/* Shop (from backend categories) */}
        <div>
          <h4 className={headCls}>Shop</h4>
          {categories.length === 0 ? (
            <div className="space-y-2" aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="h-3.5 w-24 animate-pulse rounded bg-white/15" />
              ))}
            </div>
          ) : (
            <>
              {categories.slice(0, 6).map((c) => (
                <Link key={c.slug} href={`/shop/category/${c.slug}`} className={linkCls}>
                  {c.name}
                </Link>
              ))}
              <Link href="/shop/category/all" className={`${linkCls} font-semibold text-[#f2b632]`}>
                View all →
              </Link>
            </>
          )}
        </div>

        {/* Terms and Conditions (from backend) */}
        <div>
          <h4 className={headCls}>Terms &amp; Conditions</h4>
          {loading && (
            <div className="space-y-2" aria-hidden>
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-3.5 w-32 animate-pulse rounded bg-white/15" />
              ))}
            </div>
          )}
          {!loading && !!error && (
            <p className="text-sm text-white/70">
              Couldn't load terms.{" "}
              <button onClick={() => void reload()} className="font-bold text-[#f2b632] underline">
                Try again
              </button>
            </p>
          )}
          {!loading && !error && shown.length === 0 && (
            <p className="text-sm text-white/60">Nothing to show yet.</p>
          )}
          {shown.map((t) => (
            <Link key={t._id} href={`/shop/terms/${encodeURIComponent(t._id)}`} className={linkCls}>
              {t.title}
            </Link>
          ))}
          {!loading && !error && terms.length > 0 && (
            <Link href="/shop/terms" className={`${linkCls} font-semibold text-[#f2b632]`}>
              {terms.length > shown.length ? "View all terms →" : "All terms →"}
            </Link>
          )}
        </div>

        {/* Help */}
        <div>
          <h4 className={headCls}>Help</h4>
          {[
            ["Track Order", "/shop/orders"],
            ["Shipping", "/shop"],
            ["Returns", "/shop"],
            ["Contact", "/shop"],
          ].map(([t, href]) => (
            <Link key={t} href={href} className={linkCls}>
              {t}
            </Link>
          ))}
        </div>

        {/* Company */}
        <div>
          <h4 className={headCls}>Company</h4>
          <Link href="/" className={linkCls}>Ayendri Home</Link>
          {/* <Link href="/store" className={linkCls}>Find a Store</Link> */}
          <Link href="/shop/profile" className={linkCls}>My Account</Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-10 flex max-w-[1300px] flex-col items-center justify-between gap-3 border-t border-white/15 pt-5 text-xs text-white/55 sm:flex-row">
        <p>© {new Date().getFullYear()} AYENDRI. All rights reserved.</p>
        {shown.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {shown.slice(0, 3).map((t) => (
              <Link
                key={t._id}
                href={`/shop/terms/${encodeURIComponent(t._id)}`}
                className="transition hover:text-[#f2b632]"
              >
                {t.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </footer>
  );
}