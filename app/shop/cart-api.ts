"use client";
import axiosInstance from "@/service/axios.service";

const BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const API_ROOT = /(\/api|\/backend)$/.test(BASE) ? BASE : `${BASE}/api`;
export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID || "";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type Gst = { cgst?: number | null; sgst?: number | null; igst?: number | null };
export type Product = Record<string, any> & { _id: string; title: string; price: number };
export type Item = {
  id: string; lineId: string; cartItemId?: string; storeId?: string; storeName?: string;
  isAvailable?: boolean; quantity: number; product: Product; variantLabel?: string;
};

export const imageUrl = (img?: string) =>
  !img ? undefined : img.startsWith("http") ? img : `${API_ROOT}/${img.replaceAll("\\", "/")}`;

/* ---------- product normalising (same price rules as the app) ---------- */
export const normalizeProduct = (p?: any): Product | undefined => {
  if (!p) return undefined;
  const image = p.image ?? p.images?.[0];
  const fv = Array.isArray(p.variants) && p.variants.length ? p.variants[0] : undefined;
  const fs = fv?.sizeVariants?.[0];
  const offer = Number(p.minOfferPrice ?? fs?.offerPrice ?? fv?.offerPrice ?? p.offerPrice ?? p.sellingPrice ?? p.salePrice ?? p.price ?? 0);
  const orig = Number(fs?.mrp ?? fv?.mrp ?? p.mrp ?? p.price ?? offer ?? 0);
  return {
    ...p,
    _id: p._id ?? p.id ?? "",
    title: p.title ?? p.name ?? "Product",
    price: Number.isFinite(offer) ? offer : 0,
    originalPrice: Number.isFinite(orig) ? orig : undefined,
    image,
    images: p.images ?? (image ? [image] : []),
    size: fv?.size || p.size,
    weight: fv?.weight || p.weight,
    variantId: p.variantId ?? p.variant_id ?? fv?._id,
    delivery: p.delivery ?? undefined,
    gst: p.gst ?? undefined,
  };
};

export const firstVariantId = (p: any): string | undefined => {
  const fv = Array.isArray(p.variants) ? p.variants[0] : undefined;
  return p.variantId || fv?.sizeVariants?.[0]?._id || fv?.sizeVariants?.[0]?.id || fv?._id || fv?.id || undefined;
};

/* ---------- store catalogue (delivery info, suggestions, policy flags) ---------- */
const listPage = async (n: number, pincode?: string) => {
  const params: Record<string, string> = {};
  if (n > 1) params.page = String(n);
  if (pincode) params.pincode = pincode;
  const res = await axiosInstance.get(
    `/api/product/store/${encodeURIComponent(STORE_ID)}/products`,
    { params, ...noCreds },
  );
  return res.data;
};

export async function fetchAllProducts(pincode?: string) {
  const first = await listPage(1, pincode);
  const size = Math.max((first.products ?? []).length, 1);
  const total = first.pagination?.totalData ?? first.totalProducts ?? size;
  const rest = await Promise.all(
    Array.from({ length: Math.max(Math.ceil(total / size) - 1, 0) }, (_, i) => listPage(i + 2, pincode)),
  );
  const products = [first, ...rest]
    .flatMap((r) => r.products ?? [])
    .map(normalizeProduct)
    .filter(Boolean) as Product[];
  return { products, storeMongoId: first.store?._id as string | undefined };
}

export async function fetchProduct(id: string, pincode?: string) {
  const r = (
    await axiosInstance.get(
      `/api/product/store/${encodeURIComponent(STORE_ID)}/products/${encodeURIComponent(id)}`,
      { params: pincode ? { pincode } : undefined, ...noCreds },
    )
  ).data;
  const list = r.products ?? r.store?.products ?? [];
  return normalizeProduct(r.product ?? r.data) ?? (list.map(normalizeProduct).find((p: any) => p?._id === id) as Product | undefined);
}

export async function fetchPincode(): Promise<string | undefined> {
  try {
    const r = await axiosInstance.get("/api/delivery/my-pincode", noCreds);
    return r.data?.pincode ?? r.data?.data?.pincode ?? undefined;
  } catch {
    return undefined;
  }
}

/* ---------- cart response parsing ---------- */
export function cartItemsFromResponse(res: any): any[] {
  const v = res.cart ?? res.data;
  if (Array.isArray(v)) return v;
  if (v?.stores?.length) {
    return v.stores.flatMap((s: any) =>
      (s.items ?? []).map((it: any) => ({ ...it, storeId: s.store?._id, storeName: s.store?.storeName })),
    );
  }
  return v?.items ?? res.cartItems ?? [];
}
export const cartIdFromResponse = (res: any): string | null => res.cartId ?? res._id ?? (res.cart ?? res.data)?._id ?? null;
export const cartProductId = (it: any): string | undefined => {
  const v = it.product?._id ?? it.productId;
  return typeof v === "string" ? v : (v?._id ?? v?.id);
};

export const cartLineId = (pid: string, variantId?: string, colorVariantId?: string, size?: string, weight?: string | number) =>
  `${pid}:${variantId ?? colorVariantId ?? ([size, weight].filter(Boolean).join(":") || "default")}`;

export const variantLabel = (p: any) =>
  [p.color && `Color: ${String(p.color).trim()}`, p.size && `Size: ${p.size}`, p.weight && `Weight: ${p.weight}`]
    .filter(Boolean).join(" · ");

const pickGst = (...g: (Gst | undefined | null)[]) =>
  g.find((x) => x && (x.cgst != null || x.sgst != null || x.igst != null)) ?? undefined;

/* ---------- match a cart line to the right colour/size variant (ported from the app) ---------- */
export function applyCartVariant(product: Product, item: any): Product {
  const vid = item.variantId;
  let group: any, size: any;
  for (const g of product.variants ?? []) {
    const sv = g.sizeVariants?.find((v: any) => vid && (v._id === vid || v.id === vid));
    if (sv) { group = g; size = sv; break; }
    if (vid && (g._id === vid || g.id === vid)) { group = g; break; }
  }
  if (!group && (item.size || item.weight || item.color || item.colorVariantId)) {
    group = product.variants?.find(
      (g: any) =>
        (item.colorVariantId ? g._id === item.colorVariantId || g.id === item.colorVariantId : !item.color || g.color === item.color) &&
        (!item.size && !item.weight
          ? true
          : g.sizeVariants?.some((v: any) => (!item.size || v.size === item.size) && (!item.weight || v.weight === item.weight))),
    );
    size = group?.sizeVariants?.find((v: any) => (!item.size || v.size === item.size) && (!item.weight || v.weight === item.weight));
  }
  const offer = Number(item.offerPrice ?? size?.offerPrice ?? group?.offerPrice ?? product.price);
  const mrp = Number(item.mrp ?? size?.mrp ?? group?.mrp ?? product.originalPrice ?? offer);
  const image = group?.images?.[0] ?? product.image;
  return {
    ...product,
    image,
    images: image ? [image] : product.images,
    price: Number.isFinite(offer) ? offer : product.price,
    originalPrice: Number.isFinite(mrp) ? mrp : product.originalPrice,
    size: item.size ?? size?.size ?? (group ? undefined : product.size),
    weight: item.weight ?? size?.weight ?? (group ? undefined : product.weight),
    variantId: vid ?? size?._id ?? size?.id ?? group?._id ?? group?.id ?? item.product?.variantId ?? product.variantId,
    gst: pickGst(size?.effectiveGst, group?.effectiveGst, product.gst) ?? product.gst,
    color: item.color ?? group?.color,
    colorVariantId: item.colorVariantId ?? group?._id,
  };
}

/* ---------- pricing (my rewrite of lib/pricing) ---------- */
export const hasTiers = (p: any) => Boolean(p?.hasTierPricing && p?.priceTiers?.length);
export const tierPriceFor = (p: any, qty: number): number | undefined =>
  hasTiers(p)
    ? p.priceTiers.find((t: any) => qty >= t.minQty && (t.maxQty == null || qty <= t.maxQty))?.price
    : undefined;

/* ---------- GST bill (my rewrite of lib/gst buildBill) ---------- */
export function buildBill(lines: { unitPrice: number; quantity: number; gst?: Gst | null; gstInclusive?: boolean }[]) {
  let subtotal = 0, cgst = 0, sgst = 0, igst = 0, total = 0;
  for (const l of lines) {
    const amount = l.unitPrice * l.quantity;
    const [c, s, i] = [l.gst?.cgst ?? 0, l.gst?.sgst ?? 0, l.gst?.igst ?? 0];
    const rate = c + s + i;
    const base = l.gstInclusive ? amount / (1 + rate / 100) : amount;
    subtotal += base;
    cgst += (base * c) / 100; sgst += (base * s) / 100; igst += (base * i) / 100;
    total += l.gstInclusive ? amount : base + (base * rate) / 100;
  }
  return { subtotal, cgst, sgst, igst, totalGst: cgst + sgst + igst, total };
}

/* ---------- delivery + policy text (my rewrite of lib/delivery-text, PolicyNotes) ---------- */
export const isFastestDelivery = (d: any, p: any) => Boolean(d?.fastest ?? p?.fastestDelivery);
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "");
export const deliveryDateText = (d: any, fallback?: string) => {
  const a = fmt(d?.estimatedMinDate), b = fmt(d?.estimatedMaxDate);
  if (a && b) return a === b ? a : `${a} – ${b}`;
  if (a || b) return a || b;
  if (d?.minDays != null && d?.maxDays != null) return d.minDays === d.maxDays ? `${d.minDays} days` : `${d.minDays}–${d.maxDays} days`;
  return d?.label || fallback || "soon";
};
export const policyNotes = (p: any): string[] =>
  [
    p.isReturnable && `${p.returnDays ? p.returnDays + "-day " : ""}return`,
    p.isReplaceable && `${p.replaceDays ? p.replaceDays + "-day " : ""}replacement`,
    p.isRefundable && `${p.refundDays ? p.refundDays + "-day " : ""}refund`,
  ].filter(Boolean) as string[];