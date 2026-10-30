"use client";
/* eslint-disable @next/next/no-img-element */
import { use, useState } from "react";
import Link from "next/link";
import {
  Star,
  Undo2,
  Repeat,
  Banknote,
  Truck,
  Zap,
  MapPin,
  Tag,
  Store,
  MessageCircle,
  Hammer,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ArrowRight,
  ChevronDown,
  Hash,
  Package,
  Sparkles,
} from "lucide-react";
import { inr, off } from "../../data";
import { useShop } from "../../shop-data";
import { useCart } from "../../cart";
import AddToCart from "./AddToCart";
import ProductCard from "../../components/ProductCard";
import FastestBadge from "../../components/FastestBadge";
import { deliveryEtaText, isFastestDelivery } from "../../delivery-text";
import {
  formatBookingDate,
  getMinBookingDate,
  isValidBookingDate,
  parseApiDate,
  toApiDate,
} from "../../booking-date";

const PROMO = { code: "AYENDRI10", text: "₹10 off on your order" };

const TABS = [
  { id: "description", label: "Description" },
  { id: "specification", label: "Specification" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ---------- Spec illustrations (inline SVG, brand red) ---------- */
const RED = "#9b0f1a";

function PinArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
      <path
        d="M24 3C15.7 3 9 9.6 9 17.8c0 10.6 13.2 25.7 14 26.6.5.6 1.5.6 2 0C25.8 43.5 39 28.4 39 17.8 39 9.6 32.3 3 24 3Z"
        fill={RED}
      />
      <circle cx="24" cy="17.5" r="6" fill="#fff" />
    </svg>
  );
}

function BeadRingArt() {
  const n = 14;
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
      {Array.from({ length: n }).map((_, i) => {
        const a = (i / n) * Math.PI * 2 - Math.PI / 2;
        return (
          <g key={i}>
            <circle
              cx={24 + Math.cos(a) * 18}
              cy={24 + Math.sin(a) * 18}
              r="3.6"
              fill={RED}
            />
            <circle
              cx={24 + Math.cos(a) * 18 - 1}
              cy={24 + Math.sin(a) * 18 - 1}
              r="1"
              fill="#fff"
              opacity=".45"
            />
          </g>
        );
      })}
    </svg>
  );
}

function RulerArt() {
  return (
    <svg viewBox="0 0 48 48" className="h-11 w-11" aria-hidden>
      <rect
        x="3"
        y="15"
        width="42"
        height="18"
        rx="3"
        fill="#fde7e7"
        stroke={RED}
        strokeWidth="2"
      />
      {Array.from({ length: 11 }).map((_, i) => (
        <line
          key={i}
          x1={8 + i * 3.2}
          x2={8 + i * 3.2}
          y1="15"
          y2={i % 5 === 0 ? 26 : 21}
          stroke={RED}
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function SpecIcon({ label }: { label: string }) {
  const l = label.toLowerCase();
  if (/origin|region|place|made in|state/.test(l)) return <PinArt />;
  if (/size|length|height|width|dimension|diameter/.test(l))
    return <RulerArt />;
  if (/bead|mala|count|finish|material|wood|metal|stone|type/.test(l))
    return <BeadRingArt />;
  if (/code|sku|id/.test(l))
    return <Hash size={36} color={RED} strokeWidth={2} />;
  if (/category/.test(l)) return <Tag size={36} color={RED} strokeWidth={2} />;
  if (/unit|weight|pack/.test(l))
    return <Package size={36} color={RED} strokeWidth={2} />;
  if (/sold|seller|brand/.test(l))
    return <Store size={36} color={RED} strokeWidth={2} />;
  return <Sparkles size={36} color={RED} strokeWidth={2} />;
}

export default function PDP({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const products = useShop((s) => s.products);
  const addToCart = useCart((s) => s.add);
  const p = products.find((x) => x.slug === slug);

  // hooks must stay above the early returns
  const [bookingDate, setBookingDate] = useState(""); // "YYYY-MM-DD"
  const [imgIdx, setImgIdx] = useState(0);
  const [revIdx, setRevIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabId>("description");
  const [expanded, setExpanded] = useState(false);

  if (!products.length) {
    return (
      <p className="py-24 text-center text-sm text-[#9a7a7a]">
        Loading product…
      </p>
    );
  }
  if (!p) {
    return (
      <p className="py-24 text-center text-sm text-[#9a7a7a]">
        Product not found.
      </p>
    );
  }

  const raw = (p as any).raw;
  const isService = String(raw?.productType ?? "").toUpperCase() === "SERVICE";
  const isFastest = raw ? Boolean(isFastestDelivery(raw.delivery, raw)) : false;
  // fastest -> earliest date, otherwise -> latest date
  const eta = deliveryEtaText(raw?.delivery, isFastest);

  const parsedDate = parseApiDate(bookingDate);
  const dateValid = isValidBookingDate(parsedDate);
  const minDate = toApiDate(getMinBookingDate());

  const images: string[] = (p as any).images?.length
    ? (p as any).images
    : [p.image];
  const mainImg = images[Math.min(imgIdx, images.length - 1)];

  const reviews: any[] = Array.isArray(raw?.reviews) ? raw.reviews : [];
  const rv = reviews.length ? reviews[revIdx % reviews.length] : null;

  const days = (n?: number | null) => (n ? `${n} days` : "Eligible");
  const benefits = [
    raw?.isReturnable && { I: Undo2, t: "Return", s: days(raw.returnDays) },
    raw?.isReplaceable && {
      I: Repeat,
      t: "Replacement",
      s: days(raw.replaceDays),
    },
    raw?.isRefundable && { I: Banknote, t: "Refund", s: days(raw.refundDays) },
    { I: Truck, t: "Free delivery", s: "Within 20 km" },
  ].filter(Boolean) as { I: any; t: string; s: string }[];

  const delivery = [
    {
      I: MapPin,
      t: (
        <>
          <b>HOME</b> Dunlop, Kolkata
        </>
      ),
      fast: false,
    },
    ...(eta
      ? [
          {
            I: isFastest ? Zap : Truck,
            t: (
              <>
                Delivery by <b className="text-green-700">{eta}</b>
              </>
            ),
            fast: isFastest,
          },
        ]
      : []),
    { I: Tag, t: <>Free delivery · Within 20 km</>, fast: false },
    {
      I: Store,
      t: (
        <>
          Sold by <b className="text-green-700">Ayendri</b>
        </>
      ),
      fast: false,
    },
  ];

  // ---- Description section data ----
  const details: [string, string][] = (
    [
      ["Category", String(p.category ?? "")],
      ["Unit", String(raw?.unit ?? "")],
      ["Product code", String(raw?.productCode ?? "")],
      ["Sold by", "Ayendri"],
    ] as [string, string][]
  ).filter(([, v]) => v);

  // Specs: prefer raw.specifications (array of {label,value} or an object), else fall back to details
  const rawSpecs = raw?.specifications ?? raw?.specs ?? raw?.specification;
  let specs: { label: string; value: string }[] = [];
  if (Array.isArray(rawSpecs)) {
    specs = rawSpecs.map((s: any) => ({
      label: String(s?.label ?? s?.key ?? s?.name ?? s?.title ?? ""),
      value: String(s?.value ?? s?.val ?? ""),
    }));
  } else if (rawSpecs && typeof rawSpecs === "object") {
    specs = Object.entries(rawSpecs).map(([k, v]) => ({
      label: k,
      value: String(v ?? ""),
    }));
  }
  specs = specs.filter((s) => s.label && s.value);
  if (!specs.length)
    specs = details.map(([label, value]) => ({ label, value }));

  const isHtml = /<\/?[a-z][\s\S]*>/i.test(String(p.description ?? ""));

  // styles for rich (HTML) content: red subheadings, bullets, paragraphs
  const richCls =
    "text-[15px] leading-8 text-[#3a2a2a] " +
    "[&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-extrabold [&_h2]:text-[#8b1a2b] " +
    "[&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-extrabold [&_h3]:text-[#8b1a2b] " +
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:leading-8 " +
    "[&_p]:mt-3";

  const collapsible = tab === "description";
  const sectionTitle =
    tab === "description" ? p.name : TABS.find((t) => t.id === tab)!.label;

  // ---- Pair it with: other categories first, then the rest ----
  const pairWith = [
    ...products.filter((x) => x.slug !== p.slug && x.category !== p.category),
    ...products.filter((x) => x.slug !== p.slug && x.category === p.category),
  ].slice(0, 4);

  // ---- Explore related collections: one card per category ----
  const collections = Object.values(
    products.reduce(
      (acc, x) => {
        const name = String(x.category ?? "");
        if (!name) return acc;
        (acc[name] ??= { name, count: 0, image: x.image }).count++;
        return acc;
      },
      {} as Record<string, { name: string; count: number; image: string }>,
    ),
  ).sort((a, b) =>
    a.name === p.category ? -1 : b.name === p.category ? 1 : 0,
  );

  const similar = [
    ...products.filter((x) => x.slug !== p.slug && x.category === p.category),
    ...products.filter((x) => x.slug !== p.slug && x.category !== p.category),
  ].slice(0, 4);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(PROMO.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-28 pt-8 sm:px-6">
      <div className="grid gap-8 md:grid-cols-2 md:gap-10">
        {/* ---------- Gallery ---------- */}
        <div className="self-start md:sticky md:top-24">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#fff1da] shadow-xl">
            <img
              src={mainImg}
              alt={p.name}
              loading="eager"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setImgIdx(i)}
                  aria-label={`Image ${i + 1}`}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-[#fff1da] ${
                    i === imgIdx ? "border-[#a3161c]" : "border-transparent"
                  }`}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Details ---------- */}
        <div>
          <h1 className="text-2xl font-black leading-tight text-[#4a0710] sm:text-3xl">
            {p.name}
          </h1>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="flex">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={15}
                  className={
                    n <= Math.round(Number(p.rating) || 0)
                      ? "fill-[#f2b632] text-[#f2b632]"
                      : "text-[#e4cfae]"
                  }
                />
              ))}
            </span>
            <b>{p.rating}</b>
            <span className="text-[#6b4a4a] underline">
              {p.reviews} ratings
            </span>
          </div>

          {isFastest && (
            <div className="mt-3">
              <FastestBadge />
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-4xl font-black text-[#7a1118]">
              {inr(p.price)}
            </span>
            {p.mrp > p.price && (
              <>
                <span className="text-[#9a8080]">
                  MRP <s>{inr(p.mrp)}</s>
                </span>
                <span className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-white">
                  {off(p)}% OFF
                </span>
              </>
            )}
          </div>
          {raw?.gstInclusive && (
            <p className="mt-1 text-xs text-[#9a7a7a]">
              (Inclusive of all taxes)
            </p>
          )}

          {benefits.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-y-4 rounded-2xl border border-[#f0dcc0] bg-white p-4 text-center text-xs font-semibold sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[#f0dcc0]">
              {benefits.map(({ I, t, s }) => (
                <div key={t} className="px-2">
                  <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-[#fdecec] text-[#a3161c]">
                    <I size={20} />
                  </span>
                  {t}
                  <div className="mt-0.5 text-[11px] font-normal text-[#9a7a7a]">
                    {s}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isService && (
            <div className="mt-5 rounded-2xl border border-[#f0dcc0] bg-[#fff4dc] p-4">
              <div className="flex items-start gap-2 text-xs font-medium leading-relaxed text-[#4a0710]">
                <Hammer size={16} className="mt-0.5 shrink-0 text-[#b26a00]" />
                <span>Pick a booking date to continue with Buy Now.</span>
              </div>
              <label className="mt-3 block text-sm font-bold text-[#4a0710]">
                Booking date <span className="text-red-600">*</span>
                <input
                  type="date"
                  value={bookingDate}
                  min={minDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  suppressHydrationWarning
                  className={`mt-1 block w-full rounded-xl border bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#a3161c] ${
                    bookingDate ? "border-[#e4cfae]" : "border-[#b26a00]"
                  }`}
                />
              </label>
              {bookingDate && dateValid && (
                <p className="mt-2 text-xs text-[#6b4a4a]">
                  Booking for {formatBookingDate(parsedDate)}
                </p>
              )}
              {bookingDate && !dateValid && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  Same-day booking isn&apos;t available. Please pick a later
                  date.
                </p>
              )}
            </div>
          )}

          <AddToCart
            slug={p.slug}
            madeFor={isService}
            bookingDate={dateValid ? bookingDate : ""}
          />

          {rv && (
            <div className="mt-6 rounded-2xl border border-[#f0dcc0] bg-gradient-to-b from-[#fff4dc] to-white p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#7a1118] font-bold text-white">
                  {String(rv.user?.name ?? rv.name ?? "C")
                    .charAt(0)
                    .toUpperCase()}
                </span>
                <div>
                  <div className="text-sm font-bold">
                    {rv.user?.name ?? rv.name ?? "Customer"}
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={12}
                        className={
                          n <= Number(rv.rating)
                            ? "fill-[#f2b632] text-[#f2b632]"
                            : "text-[#e4cfae]"
                        }
                      />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-[#5a3a3a]">
                {rv.comment ?? rv.review ?? ""}
              </p>
              {reviews.length > 1 && (
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    aria-label="Previous review"
                    onClick={() =>
                      setRevIdx((revIdx - 1 + reviews.length) % reviews.length)
                    }
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    aria-label="Next review"
                    onClick={() => setRevIdx((revIdx + 1) % reviews.length)}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>
          )}

          <h2 className="mt-6 font-extrabold text-[#4a0710]">
            Offers for you:
          </h2>
          <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl border border-[#f0dcc0] bg-white p-3 text-sm">
            <span>{PROMO.text}</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 rounded-lg border border-[#e4cfae] bg-[#fff4dc] px-3 py-1.5 text-xs font-bold text-[#7a1118]"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}{" "}
              {copied ? "Copied" : `Copy ${PROMO.code}`}
            </button>
          </div>

          <div className="shop-card mt-5 divide-y divide-[#f0dcc0] p-2 text-sm">
            {delivery.map(({ I, t, fast }, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <I size={16} className={fast ? "text-[#E8634A]" : undefined} />
                {t}
              </div>
            ))}
          </div>

          <a
            href="https://wa.me/91XXXXXXXXXX"
            target="_blank"
            rel="noreferrer"
            className="shop-card mt-5 flex items-center gap-3 p-4"
          >
            <MessageCircle className="text-green-600" />
            <div>
              <b>Have a question?</b>
              <div className="text-xs text-[#6b4a4a]">
                Chat with us on WhatsApp
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* ---------- Description ---------- */}
      <section className="mt-12 rounded-3xl border border-[#f0dcc0] bg-white px-4 pb-4 pt-5 shadow-sm sm:px-6">
        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setExpanded(false);
              }}
              className={`rounded-full border px-6 py-2.5 text-base font-semibold transition ${
                tab === t.id
                  ? "border-[#8b1a2b] bg-[#8b1a2b] text-white shadow-md"
                  : "border-[#e4cfae] bg-white text-[#5a1a22] hover:bg-[#fff4dc]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Title */}
        <h2 className="mt-6 text-3xl font-black text-[#1a1a1a]">
          {sectionTitle}
        </h2>

        {/* Content (collapsible) */}
        <div className="relative mt-6">
          <div
            className={`overflow-hidden transition-[max-height] duration-300 ${
              collapsible ? (expanded ? "max-h-[4000px]" : "max-h-[430px]") : ""
            }`}
          >
            {tab === "description" &&
              (isHtml ? (
                <div
                  className={richCls}
                  dangerouslySetInnerHTML={{ __html: String(p.description) }}
                />
              ) : (
                <p className="whitespace-pre-line text-[15px] leading-8 text-[#3a2a2a]">
                  {p.description}
                </p>
              ))}

            {tab === "specification" &&
              (specs.length ? (
                <div className="relative overflow-hidden rounded-2xl bg-[#f3e6d3]">
                  <img
                    src={mainImg}
                    alt=""
                    aria-hidden
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover opacity-25 blur-[2px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-[#f7ead8]/80 via-[#f3e3cc]/60 to-[#efdcc2]/70" />

                  <div className="relative grid grid-cols-2 gap-4 p-4 md:grid-cols-4">
                    {specs.map((s) => (
                      <div
                        key={s.label}
                        className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-white/70 bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="grid h-12 w-12 place-items-center">
                          <SpecIcon label={s.label} />
                        </div>
                        <div className="mt-3 text-base font-extrabold text-[#8b1a2b]">
                          {s.label}
                        </div>
                        <div className="mt-1 text-[15px] text-[#4a3a3a]">
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#9a7a7a]">
                  No specifications available.
                </p>
              ))}
          </div>

          {/* fade-out when collapsed */}
          {collapsible && !expanded && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {/* Show more / less */}
        {collapsible && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 py-2 text-base font-bold text-[#8b1a2b]"
            >
              {expanded ? "Show less" : "Show more"}
              <ChevronDown
                size={18}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        )}
      </section>

      {/* ---------- Pair it with ---------- */}
      {pairWith.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-black text-[#4a0710]">Pair it with</h2>
          <p className="mt-1 text-sm text-[#9a7a7a]">
            Items that go well with {p.name}
          </p>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
            {pairWith.map((x) => (
              <div
                key={x.slug}
                className="w-[190px] shrink-0 rounded-2xl border border-[#f0dcc0] bg-white p-3"
              >
                <Link href={`/shop/product/${x.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-[#fff1da]">
                    <img
                      src={x.image}
                      alt={x.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm font-semibold text-[#4a0710]">
                    {x.name}
                  </div>
                </Link>
                <div className="mt-1 flex items-center justify-between">
                  <span className="font-extrabold text-[#7a1118]">
                    {inr(x.price)}
                  </span>
                  <button
                    onClick={() => addToCart(x.slug, 1)}
                    className="rounded-full border border-[#a3161c] px-4 py-1 text-xs font-extrabold text-[#a3161c]"
                  >
                    ADD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Explore related collections ---------- */}
      {collections.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-black text-[#4a0710]">
            Explore related collections
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {collections.slice(0, 8).map((c) => (
              <Link
                key={c.name}
                href={`/shop?category=${encodeURIComponent(c.name)}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl bg-[#fff1da]"
              >
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3 text-white">
                  <div>
                    <div className="text-sm font-bold">{c.name}</div>
                    <div className="text-[11px] opacity-80">
                      {c.count} {c.count === 1 ? "product" : "products"}
                    </div>
                  </div>
                  <ArrowRight size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <>
          <h2 className="mt-12 text-xl font-black text-[#4a0710]">
            Similar Products
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-4">
            {similar.map((x) => (
              <ProductCard key={x.slug} p={x} />
            ))}
          </div>
        </>
      )}

      {/* ---------- Sticky bottom bar ---------- */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#f0dcc0] bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#4a0710]">
              {inr(p.price)}
            </span>
            {p.mrp > p.price && (
              <s className="text-sm text-[#9a8080]">{inr(p.mrp)}</s>
            )}
          </div>
          <AddToCart
            compact
            slug={p.slug}
            madeFor={isService}
            bookingDate={dateValid ? bookingDate : ""}
          />
        </div>
      </div>
    </div>
  );
}