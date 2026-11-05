"use client";
import Link from "next/link";
import Image from "next/image";

import { Mail, MapPin, Phone } from "lucide-react";
import { useShop } from "../shop-data";
import { useTerms } from "../terms-api";

const Facebook = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3z" />
  </svg>
);
const Instagram = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="0.6" fill="currentColor" />
  </svg>
);
const Youtube = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" />
  </svg>
);

const SOCIALS = [
  { label: "Facebook", href: "https://www.facebook.com/", Icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/", Icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/", Icon: Youtube },
];

const artProps = {
  viewBox: "0 0 100 100",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};
type ArtP = { className?: string; style?: React.CSSProperties };

const ArtLotus = ({ className, style }: ArtP) => (
  <svg {...artProps} className={className} style={style} stroke="#7a1118">
    <path d="M50 52 C30 56 16 52 8 42 C22 38 40 42 50 52Z" fill="#f2b632" />
    <path d="M50 52 C70 56 84 52 92 42 C78 38 60 42 50 52Z" fill="#f2b632" />
    <path d="M50 52 C36 48 24 40 20 28 C32 28 44 36 50 52Z" fill="#e8762c" />
    <path d="M50 52 C64 48 76 40 80 28 C68 28 56 36 50 52Z" fill="#e8762c" />
    <path d="M50 18 C44 30 44 42 50 52 C56 42 56 30 50 18Z" fill="#d6281f" />
    <path d="M30 70 Q50 82 70 70" fill="none" />
  </svg>
);
const ArtDiya = ({ className, style }: ArtP) => (
  <svg {...artProps} className={className} style={style} stroke="#5e0d13">
    <path d="M14 54 Q50 96 86 54Z" fill="#a3161c" />
    <path d="M50 50 C42 40 44 26 50 16 C56 26 58 40 50 50Z" fill="#f08a24" />
    <path d="M50 48 C46 42 47 35 50 30 C53 35 54 42 50 48Z" fill="#ffe27a" stroke="none" />
    <path d="M36 74 H64" fill="none" stroke="#f2b632" />
  </svg>
);
const ArtTemple = ({ className, style }: ArtP) => (
  <svg {...artProps} className={className} style={style} stroke="#5e0d13">
    <path d="M50 6 V16" fill="none" />
    <path d="M36 30 Q50 12 64 30Z" fill="#f2b632" />
    <path d="M28 44 Q50 24 72 44Z" fill="#e8a02c" />
    <path d="M20 60 Q50 36 80 60Z" fill="#f2b632" />
    <rect x="28" y="60" width="44" height="32" fill="#a3161c" />
    <path d="M42 92 V76 Q50 66 58 76 V92Z" fill="#ffe9b8" />
  </svg>
);
const ArtSpark = ({ className, style }: ArtP) => (
  <svg {...artProps} className={className} style={style} stroke="#a3161c">
    <path d="M50 10 Q54 46 90 50 Q54 54 50 90 Q46 54 10 50 Q46 46 50 10Z" fill="#f2b632" />
  </svg>
);

const FOOTER_ART = [
  { Art: ArtLotus, size: "h-14 w-14", rot: -12, hide: false },
  { Art: ArtSpark, size: "h-8 w-8", rot: 20, hide: true },
  { Art: ArtDiya, size: "h-10 w-10", rot: 14, hide: false },
  { Art: ArtTemple, size: "h-16 w-16", rot: -8, hide: true },
  { Art: ArtLotus, size: "h-9 w-9", rot: 28, hide: false },
  { Art: ArtSpark, size: "h-12 w-12", rot: -22, hide: false },
  { Art: ArtDiya, size: "h-14 w-14", rot: -16, hide: true },
  { Art: ArtTemple, size: "h-10 w-10", rot: 10, hide: false },
  { Art: ArtLotus, size: "h-16 w-16", rot: 18, hide: true },
  { Art: ArtSpark, size: "h-9 w-9", rot: -30, hide: false },
  { Art: ArtDiya, size: "h-12 w-12", rot: 8, hide: true },
  { Art: ArtLotus, size: "h-11 w-11", rot: -18, hide: false },
];

const linkCls =
  "block py-1 text-sm font-semibold !text-[#2a0508] transition hover:translate-x-0.5 hover:!text-[#a3161c]";
const headCls =
  "mb-3 text-sm font-extrabold uppercase tracking-[.16em] !text-[#7a1118]";

export default function ShopFooter() {
  const categories = useShop((s) => s.categories);
  const { terms, loading, error, reload } = useTerms();

  const shown = terms.slice(0, 6);

  return (
        <footer
      className="relative isolate overflow-hidden px-6 pb-28 pt-12 font-medium text-[#2a0508]"
      style={{
        backgroundColor: "#f6e8cc",
        borderTop: "4px solid #d99a1e",
      }}
    >
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[#f6e8cc]" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        aria-hidden
      >
        <svg
          className="absolute -left-6 bottom-6 h-44 w-44 text-[#c9953a]"
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M50 18 C44 30 44 42 50 52 C56 42 56 30 50 18Z" />
          <path d="M50 52 C36 48 24 40 20 28 C32 28 44 36 50 52Z" />
          <path d="M50 52 C64 48 76 40 80 28 C68 28 56 36 50 52Z" />
          <path d="M50 52 C30 56 16 52 8 42 C22 38 40 42 50 52Z" />
          <path d="M50 52 C70 56 84 52 92 42 C78 38 60 42 50 52Z" />
          <path d="M30 70 Q50 82 70 70" />
        </svg>
        <svg
          className="absolute -right-4 top-10 h-52 w-40 text-[#c9953a]"
          viewBox="0 0 80 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M40 8 L40 18" />
          <path d="M26 30 Q40 12 54 30Z" />
          <path d="M20 44 Q40 24 60 44Z" />
          <path d="M14 60 Q40 36 66 60Z" />
          <rect x="22" y="60" width="36" height="30" />
          <path d="M34 90 V74 Q40 66 46 74 V90" />
        </svg>
        <svg
          className="absolute bottom-10 left-1/2 hidden h-24 w-24 -translate-x-1/2 text-[#c9953a] md:block"
          viewBox="0 0 100 60"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        >
          <path d="M10 34 Q50 70 90 34Z" />
          <path d="M50 30 C44 22 46 12 50 6 C54 12 56 22 50 30Z" />
        </svg>
      </div>
      <div className="mx-auto grid max-w-[1300px] gap-10 md:grid-cols-[1.4fr_1fr_1.2fr_1fr_1fr]">
        {/* Brand */}
        <div>
          <Link href="/shop" className="inline-flex" aria-label="AYENDRI home">
            <Image
              src="/img/photos/ayendri.png"
              alt="AYENDRI"
              width={400}
              height={160}
              className="h-24 w-auto object-contain sm:h-28"
            />
          </Link>
                    <div className="mt-4 max-w-[310px]">
            <p className="text-sm font-semibold leading-relaxed !text-[#2a0508] [text-shadow:0_1px_6px_rgba(255,240,205,.9)]">
              Sacred for a Higher You. Authentic, energised spiritual products
              delivered with care.
            </p>

            <h2 className="mb-2 mt-4 text-xs font-extrabold uppercase tracking-[.16em] !text-[#7a1118]">
              Contact Us
            </h2>
            <ul className="space-y-2.5 text-[13px] font-semibold !text-[#2a0508] [text-shadow:0_1px_6px_rgba(255,240,205,.9)]">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#a3161c]" />
                <span>
                  Green Park, 33/A, Belghoria, Kolkata, West Bengal 700056
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="mt-0.5 shrink-0 text-[#a3161c]" />
                <a
                  href="mailto:amptechnologyoffice@gmail.com"
                  className="break-all !text-[#2a0508] hover:!text-[#a3161c]"
                >
                  amptechnologyoffice@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={16} className="mt-0.5 shrink-0 text-[#a3161c]" />
                <a
                  href="tel:+918697972001"
                  className="!text-[#2a0508] hover:!text-[#a3161c]"
                >
                  +91 86979 72001
                </a>
              </li>
            </ul>
          </div>

          <div className="mt-4 flex items-center gap-3">
            {SOCIALS.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                title={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#f2b632] bg-[#7a1118] !text-[#ffd66b] shadow-md transition hover:-translate-y-0.5 hover:bg-[#a3161c] active:scale-95"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
          {/* <Link
            href="/store"
            className="mt-4 inline-block rounded-full border border-[#f2b632]/60 px-4 py-1.5 text-xs font-bold text-[#f2b632] transition hover:bg-[#f2b632] hover:text-[#4a0710]"
          >
            Find a Store →
          </Link> */}
        </div>

        {/* Shop (from backend categories) */}
        <div>
          <h2 className={headCls}>Shop</h2>
          {categories.length === 0 ? (
            <div className="space-y-2" aria-hidden>
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-3.5 w-24 animate-pulse rounded bg-white/15"
                />
              ))}
            </div>
          ) : (
            <>
              {categories.slice(0, 6).map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop/category/${c.slug}`}
                  className={linkCls}
                >
                  {c.name}
                </Link>
              ))}
              <Link
                href="/shop/category/all"
                className={`${linkCls} !text-[#7a1118] underline underline-offset-4`}
              >
                View all →
              </Link>
            </>
          )}
        </div>

        {/* Terms and Conditions (from backend) */}
        <div>
          <h2 className={headCls}>Terms &amp; Conditions</h2>
          {loading && (
            <div className="space-y-2" aria-hidden>
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-3.5 w-32 animate-pulse rounded bg-white/15"
                />
              ))}
            </div>
          )}
          {!loading && !!error && (
            <p className="text-sm text-white/70">
              Couldn't load terms.{" "}
              <button
                onClick={() => void reload()}
                className="font-bold text-[#f2b632] underline"
              >
                Try again
              </button>
            </p>
          )}
          {!loading && !error && shown.length === 0 && (
            <p className="text-sm text-white/60">Nothing to show yet.</p>
          )}
          {shown.map((t) => (
            <Link
              key={t._id}
              href={`/shop/terms/${encodeURIComponent(t._id)}`}
              className={linkCls}
            >
              {t.title}
            </Link>
          ))}
          {!loading && !error && terms.length > 0 && (
            <Link
              href="/shop/terms"
              className={`${linkCls} font-semibold text-[#f2b632]`}
            >
              {terms.length > shown.length ? "View all terms →" : "All terms →"}
            </Link>
          )}
        </div>

        {/* Help */}
        <div>
          <h2 className={headCls}>Help</h2>
          {[
            ["Track Order", "/shop/orders"],
            [
              "Shipping & Returns",
              "/shop/shipping-returns",
              "/shop/editorial-policy",
            ],
            ["Contact Us", "/shop/contact"],
            ["About Us", "/shop/about"],
            ["Privacy Policy", "/shop/privacy-policy"],
            ["Terms of Service", "/shop/terms"],
            ["Editorial Policy", "/shop/editorial-policy"],
          ].map(([t, href]) => (
            <Link key={t} href={href} className={linkCls}>
              {t}
            </Link>
          ))}
        </div>

        {/* Company */}
        <div>
          <h2 className={headCls}>Company</h2>
          <Link href="/" className={linkCls}>
            Ayendri Home
          </Link>
          {/* <Link href="/store" className={linkCls}>Find a Store</Link> */}
          <Link href="/shop/profile" className={linkCls}>
            My Account
          </Link>
        </div>
      </div>

      {/* Art row */}
      <div
        className="pointer-events-none mx-auto mt-10 flex max-w-[1300px] items-center justify-between drop-shadow-[0_2px_3px_rgba(90,13,19,.25)]"
        aria-hidden
      >
        {FOOTER_ART.map(({ Art, size, rot, hide }, i) => (
          <Art
            key={i}
            className={`${size} shrink-0 ${hide ? "hidden sm:block" : ""}`}
            style={{ transform: `rotate(${rot}deg)` }}
          />
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mx-auto mt-24 flex max-w-[1300px] flex-col items-center justify-between gap-3 border-t border-[#7a1118]/25 pt-5 text-xs font-semibold !text-[#2a0508] sm:flex-row">
        <p>© {new Date().getFullYear()} AYENDRI. All rights reserved.</p>
        {shown.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {shown.slice(0, 3).map((t) => (
              <Link
                key={t._id}
                href={`/shop/terms/${encodeURIComponent(t._id)}`}
                className="transition !text-[#2a0508] hover:!text-[#a3161c]"
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
