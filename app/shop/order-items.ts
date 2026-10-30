import { imgUrl } from "./api";

const obj = (v: any) => (v && typeof v === "object" ? v : null);

/** Items of an order, whatever shape the backend uses (flat, or grouped by store). */
export function rawOrderItems(order: any): any[] {
  const direct = order?.items ?? order?.orderItems ?? order?.products;
  if (Array.isArray(direct) && direct.length) return direct;
  const groups = [order?.stores, order?.subOrders, order?.suborders].find(Array.isArray);
  if (groups) {
    return groups.flatMap((s: any) => s?.items ?? s?.orderItems ?? s?.products ?? []);
  }
  return Array.isArray(direct) ? direct : [];
}

/** The populated product object, or {} when the item only holds an ID string. */
export const itemProduct = (item: any): any =>
  obj(item?.product) ?? obj(item?.productId) ?? {};

export function itemProductId(item: any): string {
  const pid = item?.productId;
  const prod = item?.product;
  const v =
    (typeof pid === "object" ? (pid?._id ?? pid?.id) : pid) ??
    (typeof prod === "object" ? (prod?._id ?? prod?.id) : prod);
  return String(v ?? "");
}

export function itemName(item: any, fallback?: { name?: string }): string {
  const p = itemProduct(item);
  return String(
    item?.name ?? item?.title ?? item?.productName ?? p.name ?? p.title ?? fallback?.name ?? "Product",
  );
}

export function itemImage(item: any, fallback?: string): string {
  const p = itemProduct(item);
  const raw =
    item?.image ??
    item?.images?.[0] ??
    p.image ??
    p.images?.[0] ??
    p.variants?.find?.((v: any) => v?.images?.length)?.images?.[0] ??
    fallback ??
    "";
  return imgUrl(raw);
}

export const itemQty = (item: any): number => Number(item?.quantity ?? item?.qty ?? 1) || 1;

export function itemPrice(item: any, fallback?: { price?: number }): number {
  const p = itemProduct(item);
  return Number(
    item?.offerPrice ?? item?.price ?? item?.unitPrice ?? p.offerPrice ?? p.price ?? fallback?.price ?? 0,
  );
}