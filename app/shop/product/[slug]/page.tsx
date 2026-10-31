"use client";
/* eslint-disable @next/next/no-img-element */
import { use, useEffect, useState } from "react";
import { imgUrl, fetchAvailability } from "../../api";
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
import { inr } from "../../data";
import { useShop } from "../../shop-data";
import { useCart, setCartSelection } from "../../cart";
import AddToCart from "./AddToCart";
import ProductCard from "../../components/ProductCard";
import FastestBadge from "../../components/FastestBadge";

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
  const store = useShop((s) => s.store);
  const addToCart = useCart((s) => s.add);
  const p = products.find((x) => x.slug === slug);

  // hooks must stay above the early returns
  const [bookingDate, setBookingDate] = useState(""); // "YYYY-MM-DD"
  const [imgIdx, setImgIdx] = useState(0);
  const [revIdx, setRevIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<TabId>("description");
  const [expanded, setExpanded] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);
  const [sizeIdx, setSizeIdx] = useState(0);
  const [avail, setAvail] = useState<any>(null);

  const serviceId: string | null =
    String((p as any)?.raw?.productType ?? "").toUpperCase() === "SERVICE"
      ? ((p as any)?.raw?._id ?? null)
      : null;

  useEffect(() => {
    if (!serviceId) {
      setAvail(null);
      return;
    }
    let active = true;
    fetchAvailability(serviceId)
      .then((r: any) => {
        if (active && r?.success) setAvail(r);
      })
      .catch(() => {
        if (active) setAvail(null);
      });
    return () => {
      active = false;
    };
  }, [serviceId]);

  // tell the cart which size/color/booking date is selected (cart.add reads this)
  useEffect(() => {
    const r = (p as any)?.raw;
    if (!p || !r) return;
    const cv = Array.isArray(r.variants)
      ? (r.variants[colorIdx] ?? r.variants[0])
      : undefined;
    const sv = cv?.sizeVariants?.[sizeIdx] ?? cv?.sizeVariants?.[0];
    const sel: Record<string, unknown> = {
      variantId: sv?._id ?? cv?._id,
      colorVariantId: cv?._id,
      color: cv?.color,
      size: sv?.size,
      weight: sv?.weight,
      bookingDate: bookingDate || undefined,
    };
    Object.keys(sel).forEach((k) => {
      if (sel[k] === undefined) delete sel[k];
    });
    setCartSelection(p.slug, sel);
  }, [p, colorIdx, sizeIdx, bookingDate]);
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
  const needsBooking = isService || Boolean(raw?.isMadeForProduct);

  // ---- daily booking limit (SERVICE only, from the availability API) ----
  const bookingLimit = avail?.limited ? Number(avail.dailyBookingLimit) || 0 : 0;
  const availDays: any[] = Array.isArray(avail?.days) ? avail.days : [];
  const dateFull = Boolean(availDays.find((d) => d.date === bookingDate)?.full);

  // ---- variants: color -> size ----
  const colorVariants: any[] = Array.isArray(raw?.variants) ? raw.variants : [];
  const color: any = colorVariants[colorIdx] ?? colorVariants[0];
  const sizeVariants: any[] = color?.sizeVariants ?? [];
  const size: any = sizeVariants[sizeIdx] ?? sizeVariants[0];
  const vsrc: any = size ?? color ?? null; // size > color > product
  const sizeLabel = (s: any) =>
    [s.size, s.weight ? `(${s.weight})` : ""].filter(Boolean).join(" ") ||
    s.height ||
    "One size";

  // ---- price + tiers ----
  const priceOnRequest = Boolean(raw?.priceOnRequest);
  const price = Number(vsrc?.offerPrice ?? p.price) || 0;
  const mrp = Number(vsrc?.mrp ?? p.mrp) || price;
  const pct = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const tiers: any[] =
    [vsrc?.priceTiers, color?.priceTiers, raw?.priceTiers].find(
      (t: any) => Array.isArray(t) && t.length,
    ) ?? [];
  const showTiers = Boolean(raw?.hasTierPricing) && tiers.length > 0;

  // ---- stock ----
  const stock: number | undefined =
    raw?.hasStockManagement && typeof vsrc?.currentStock === "number"
      ? vsrc.currentStock
      : undefined;
  const outOfStock = stock !== undefined && stock <= 0;
  const lowStock =
    stock !== undefined &&
    stock > 0 &&
    stock <= (Number(vsrc?.lowStockThreshold) || 5);

  // ---- GST + packaging ----
  const gstSrc: any = [size?.effectiveGst, color?.effectiveGst, raw?.gst].find(
    (g: any) => g && (g.cgst != null || g.sgst != null || g.igst != null),
  );
  const gstParts = [
    gstSrc?.cgst != null && `CGST ${gstSrc.cgst}%`,
    gstSrc?.sgst != null && `SGST ${gstSrc.sgst}%`,
    gstSrc?.igst != null && `IGST ${gstSrc.igst}%`,
  ]
    .filter(Boolean)
    .join(" + ");
  const pack: any = size?.packagingDetails ?? color?.packagingDetails ?? null;

  // ---- delivery ----
  const dlv: any = raw?.delivery;
  const isFastest = Boolean(dlv?.fastest ?? raw?.fastestDelivery);
  const notDeliverable = dlv?.deliverable === false;
  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        })
      : "";
  // fastest -> earliest date, otherwise -> latest date
  const eta =
    dlv && !notDeliverable
      ? fmtDate(
          isFastest
            ? (dlv.estimatedMinDate ?? dlv.estimatedMaxDate)
            : (dlv.estimatedMaxDate ?? dlv.estimatedMinDate),
        )
      : "";
  const shipCharge = Number(dlv?.shippingCharge ?? 0);
  const shipFree = Boolean(dlv?.isFree) || shipCharge === 0;
  const freeAbove =
    dlv?.freeDeliveryRules?.[String(raw?.productType ?? "PRODUCT").toUpperCase()] ??
    dlv?.freeDeliveryAbove;
  const parsedDate = parseApiDate(bookingDate);
  const dateValid = isValidBookingDate(parsedDate) && !dateFull;
  const minDate = toApiDate(getMinBookingDate());

  const rawImgs: string[] =
    (color?.images?.length ? color.images : raw?.images) ?? [];
  const images: string[] = rawImgs.length
    ? rawImgs.map((u: string) => imgUrl(u))
    : [p.image];
  const mainImg = images[Math.min(imgIdx, images.length - 1)];

  const reviews: any[] = Array.isArray(raw?.reviews) ? raw.reviews : [];
  const rv = reviews.length ? reviews[revIdx % reviews.length] : null;

  const days = (n?: number | null) => (n ? `${n} days` : "Eligible");
  const benefits = [
    {
      I: Undo2,
      t: "Return",
      s: raw?.isReturnable ? days(raw.returnDays) : "Not available",
    },
    {
      I: Repeat,
      t: "Replacement",
      s: raw?.isReplaceable ? days(raw.replaceDays) : "Not available",
    },
    {
      I: Banknote,
      t: "Refund",
      s: raw?.isRefundable ? days(raw.refundDays) : "Not available",
    },
    ...(dlv
      ? [
          {
            I: Truck,
            t: shipFree ? "Free delivery" : "Shipping",
            s: shipFree ? String(dlv.label ?? "") : `₹${shipCharge}`,
          },
        ]
      : []),
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
    ...(notDeliverable
      ? [
          {
            I: MapPin,
            t: <b className="text-red-600">Not deliverable to your pincode</b>,
            fast: false,
          },
        ]
      : []),
    ...(eta
      ? [
          {
            I: isFastest ? Zap : Truck,
            t: (
              <>
                Delivery by <b className="text-green-700">{eta}</b>
                {dlv?.label ? (
                  <span className="text-[#9a7a7a]"> · {String(dlv.label)}</span>
                ) : null}
              </>
            ),
            fast: isFastest,
          },
        ]
      : []),
    ...(dlv && !notDeliverable
      ? [
          {
            I: Tag,
            t: shipFree ? (
              <b className="text-green-700">Free delivery</b>
            ) : (
              <>
                Shipping <b>{inr(shipCharge)}</b>
                {freeAbove ? <> · Free above {inr(freeAbove)}</> : null}
              </>
            ),
            fast: false,
          },
        ]
      : []),
    ...(dlv?.shippingNote
      ? [{ I: Truck, t: <>{String(dlv.shippingNote)}</>, fast: false }]
      : []),
    {
      I: Store,
      t: (
        <>
          Sold by <b className="text-green-700">{store?.storeName ?? "Ayendri"}</b>
        </>
      ),
      fast: false,
    },
  ];

  // ---- Description section data ----
  const details: [string, string][] = (
    [
      [
        "Category",
        String(raw?.category?.name ?? (p as any).categoryName ?? ""),
      ],
      ["Unit", String(raw?.unit ?? "")],
      ["Product code", String(raw?.productCode ?? "")],
      ["Type", raw?.productType === "SERVICE" ? "Service" : "Product"],
      ["Color", String(color?.color ?? "")],
      ["Size", String(size?.size ?? "")],
      ["Weight", String(size?.weight ?? "")],
      ["Height", String(size?.height ?? "")],
      [
        "GST",
        gstParts
          ? `${gstParts}${raw?.gstInclusive ? " (incl.)" : " (extra)"}`
          : "",
      ],
      ["Stock", stock !== undefined ? String(stock) : ""],
      [
        "Package (L×B×H cm)",
        pack?.length ? `${pack.length}×${pack.breadth}×${pack.height}` : "",
      ],
      ["Package weight", pack?.weight ? String(pack.weight) : ""],
      [
        "Expected delivery days",
        pack?.expectedDeliveryDays ? `${pack.expectedDeliveryDays} days` : "",
      ],
      ["Courier", String(dlv?.courierName ?? "")],
      ["Sold by", String(store?.storeName ?? "Ayendri")],
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
        <div className="min-w-0">
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
            {priceOnRequest || price <= 0 ? (
              <span className="text-2xl font-black text-[#7a1118]">
                Order to know Price
              </span>
            ) : (
              <>
                <span className="text-4xl font-black text-[#7a1118]">
                  {inr(price)}
                </span>
                {raw?.unit && (
                  <span className="text-sm text-[#9a7a7a]">
                    / {String(raw.unit)}
                  </span>
                )}
                {mrp > price && (
                  <>
                    <span className="text-[#9a8080]">
                      MRP <s>{inr(mrp)}</s>
                    </span>
                    <span className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-xs font-bold text-white">
                      {pct}% OFF
                    </span>
                  </>
                )}
              </>
            )}
          </div>
          {raw?.gstInclusive ? (
            <p className="mt-1 text-xs text-[#9a7a7a]">
              (Inclusive of all taxes{gstParts ? ` · ${gstParts}` : ""})
            </p>
          ) : gstParts ? (
            <p className="mt-1 text-xs text-[#9a7a7a]">+ {gstParts} extra</p>
          ) : null}

          {showTiers && (
            <div className="mt-4">
              <div className="text-sm font-bold text-[#4a0710]">
                Buy more, pay less
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {tiers.map((t: any, i: number) => (
                  <span
                    key={i}
                    className="rounded-xl border border-[#e4cfae] bg-white px-3 py-1.5 text-xs"
                  >
                    {t.minQty}
                    {t.maxQty ? `-${t.maxQty}` : "+"} {String(raw?.unit ?? "pcs")}:{" "}
                    <b>{inr(t.price)}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {colorVariants.length > 0 && (
            <div className="mt-5 space-y-4">
              {colorVariants.some((v: any) => v.color) && (
                <div>
                  <div className="text-sm font-bold text-[#4a0710]">
                    Color: <span className="font-normal">{color?.color}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colorVariants.map((v: any, i: number) => (
                      <button
                        key={v._id ?? i}
                        onClick={() => {
                          setColorIdx(i);
                          setSizeIdx(0);
                          setImgIdx(0);
                        }}
                        title={v.color}
                        className={`h-16 w-16 overflow-hidden rounded-xl border-2 bg-[#fff1da] text-xs ${
                          i === colorIdx
                            ? "border-[#a3161c]"
                            : "border-transparent"
                        }`}
                      >
                        {v.images?.[0] ? (
                          <img
                            src={imgUrl(v.images[0])}
                            alt={v.color ?? ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          v.color
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {sizeVariants.length > 0 && (
                <div>
                  <div className="text-sm font-bold text-[#4a0710]">Size</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sizeVariants.map((s: any, i: number) => {
                      const out =
                        raw?.hasStockManagement &&
                        typeof s.currentStock === "number" &&
                        s.currentStock <= 0;
                      return (
                        <button
                          key={s._id ?? i}
                          disabled={out}
                          onClick={() => setSizeIdx(i)}
                          className={`rounded-xl border-2 px-4 py-2 text-sm font-semibold ${
                            i === sizeIdx
                              ? "border-[#a3161c] bg-[#fdecec] text-[#a3161c]"
                              : "border-[#e4cfae] bg-white text-[#4a0710]"
                          } ${out ? "opacity-40" : ""}`}
                        >
                          {sizeLabel(s)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {outOfStock && (
            <p className="mt-3 text-sm font-bold text-red-600">Out of stock</p>
          )}
          {lowStock && (
            <p className="mt-3 text-sm font-bold text-[#b26a00]">
              Only {stock} left. Order soon!
            </p>
          )}

          {benefits.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-y-4 rounded-2xl border border-[#f0dcc0] bg-white p-4 text-center text-xs font-semibold sm:grid-cols-4 sm:gap-y-0 sm:divide-x sm:divide-[#f0dcc0]">
              {benefits.map(({ I, t, s }) => (
                <div
                  key={t}
                  className={`px-2 ${s === "Not available" ? "opacity-50" : ""}`}
                >
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

          {needsBooking && (
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
              {isService && bookingLimit > 0 && availDays.length > 0 && (
                <div className="mt-3 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4a0710]">
                      Choose a date
                    </span>
                    <span className="text-[#9a7a7a]">
                      {bookingLimit} bookings / day · swipe →
                    </span>
                  </div>
                  <div className="-mx-1 mt-2 flex snap-x gap-2 overflow-x-auto px-1 pb-2">
                    {availDays
                      .filter((d) => d.date >= minDate)
                      .map((d) => {
                        const dt = new Date(`${d.date}T00:00:00Z`);
                        const sel = bookingDate === d.date;
                        const low =
                          !d.full &&
                          d.remaining <=
                            Math.max(2, Math.ceil(bookingLimit * 0.2));
                        const part = (o: Intl.DateTimeFormatOptions) =>
                          dt.toLocaleDateString("en-IN", {
                            ...o,
                            timeZone: "UTC",
                          });
                        return (
                          <button
                            key={d.date}
                            type="button"
                            disabled={d.full}
                            onClick={() => setBookingDate(d.date)}
                            className={`flex w-[68px] shrink-0 snap-start flex-col items-center rounded-2xl border-2 px-2 py-2 transition ${
                              sel
                                ? "border-[#a3161c] bg-[#a3161c] text-white shadow-md"
                                : d.full
                                  ? "border-[#eee] bg-[#f5f5f5] text-[#b5b5b5]"
                                  : "border-[#e4cfae] bg-white text-[#4a0710] hover:border-[#a3161c]"
                            }`}
                          >
                            <span className="text-[10px] font-semibold uppercase opacity-80">
                              {part({ weekday: "short" })}
                            </span>
                            <span className="text-xl font-black leading-tight">
                              {part({ day: "numeric" })}
                            </span>
                            <span className="text-[10px] font-semibold uppercase opacity-80">
                              {part({ month: "short" })}
                            </span>
                            <span
                              className={`mt-1 text-[10px] font-bold ${
                                sel
                                  ? "text-white"
                                  : d.full
                                    ? "text-red-400"
                                    : low
                                      ? "text-[#b26a00]"
                                      : "text-green-700"
                              }`}
                            >
                              {d.full ? "Full" : `${d.remaining} left`}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {dateFull && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  This date is fully booked. Please choose another date.
                </p>
              )}
              {bookingDate && dateValid && (
                <p className="mt-2 text-xs text-[#6b4a4a]">
                  Booking for {formatBookingDate(parsedDate)}
                </p>
              )}
              {bookingDate && !dateValid && !dateFull && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  Same-day booking isn&apos;t available. Please pick a later
                  date.
                </p>
              )}
            </div>
          )}

          <AddToCart
            slug={p.slug}
            madeFor={needsBooking}
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
              {priceOnRequest || price <= 0 ? "Order to know Price" : inr(price)}
            </span>
            {!priceOnRequest && mrp > price && (
              <s className="text-sm text-[#9a8080]">{inr(mrp)}</s>
            )}
          </div>
          <AddToCart
            compact
            slug={p.slug}
            madeFor={needsBooking}
            bookingDate={dateValid ? bookingDate : ""}
          />
        </div>
      </div>
    </div>
  );
}