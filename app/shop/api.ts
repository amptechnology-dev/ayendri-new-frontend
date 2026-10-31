import axios from "axios";
import axiosInstance from "@/service/axios.service";
import type { Product, Category } from "./data";
import { API } from "./config";

export { API };
export const STORE_ID = process.env.NEXT_PUBLIC_STORE_ID ?? "";
const REAL_API = API.replace(/\/api$/, "");
const sid = encodeURIComponent(STORE_ID);

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export const imgUrl = (u?: string | null) => {
  if (!u) return "";
  if (u.startsWith("http") || u.startsWith("data:")) {
    return u;
  }
  return `${REAL_API}/${u.replace(/\\/g, "/").replace(/^\/+/, "")}`;
};

async function get(path: string, params?: Record<string, string | undefined>) {
  try {
    const { data } = await axiosInstance.get(`/api${path}`, { params, ...noCreds });
    return data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? "network") : "error";
    throw new Error(`${path} → ${status}`);
  }
}

export const fetchProducts = (pin?: string) =>
  get(`/product/store/${sid}/products`, pin ? { pincode: pin } : undefined);

export const fetchCategories = () => get(`/product/store/${sid}/categories`);

export const fetchAvailability = (productId: string) =>
  get(`/product/store/${sid}/products/${encodeURIComponent(productId)}/availability`);

export const fetchBanners = () => get("/banner/banners");

export async function deliveryCheck(body: {
  pincode: string;
  productId: string;
  variantId?: string;
  quantity: number;
  itemsTotal: number;
}) {
  try {
    // TODO: copy the exact path + method from the app's api.deliveryCheck
    const { data } = await axiosInstance.post(
      "/api/delivery/check", // TODO
      { storeUniqueId: STORE_ID, ...body },
      noCreds,
    );
    return data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? (err.response?.status ?? "network") : "error";
    throw new Error(`deliveryCheck → ${status}`);
  }
}

export const fetchOfferBanners = (mongoId: string) =>
  get("/banner/public/offer-banners", { storeId: mongoId });

export type Banner = {
  id: string;
  name: string;
  image: string;
  categoryId: string | null;
  productId: string | null;
};

const idOf = (v: any) => (v ? String(typeof v === "object" ? v._id : v) : null);

export const mapBanner = (b: any): Banner => ({
  id: String(b._id),
  name: b.name ?? "",
  image: imgUrl(b.image),
  categoryId: idOf(b.categoryId),
  productId: idOf(b.productId),
});

export const mapCategory = (c: any): Category => ({
  slug: String(c._id),
  name: c.name,
  sub: [],
  image: imgUrl(c.image) || undefined,
});

export const mapProduct = (p: any): Product => {
  const v = p.variants?.[0];
  const sv = v?.sizeVariants?.[0];
  const price =
    Number(
      p.minOfferPrice ??
        sv?.offerPrice ??
        v?.offerPrice ??
        p.offerPrice ??
        p.price ??
        p.mrp,
    ) || 0;
  const rawMrp = Number(sv?.mrp ?? v?.mrp ?? p.mrp ?? price);
  const variantImg = (p.variants ?? []).find((x: any) => x.images?.length)
    ?.images?.[0];
  return {
    slug: String(p._id),
    name: p.name ?? p.title ?? "Product",
    category: String(p.category?._id ?? p.category ?? ""),
    categoryName: p.category?.name ?? "",
    price,
    mrp: rawMrp >= price ? rawMrp : price,
    image:
      imgUrl(p.images?.[0] ?? variantImg) || "/img/photos/product-puja.jpg",
    rating: Number(p.averageRating ?? p.rating) || 0,
    reviews: Number(p.totalReviews ?? p.reviewCount) || 0,
    description: p.description ?? "",
    createdAt: p.createdAt,
    delivery: p.delivery ?? undefined,
    deliveryTime: p.deliveryTime ?? undefined,
    isMadeForProduct: Boolean(p.isMadeForProduct),
    variantId: v?._id ? String(v._id) : undefined,
    raw: p,
  };
};

// Authenticated order APIs (token interceptor theke automatic jabe)

export async function fetchMyOrders() {
  const response = await axiosInstance.get("/api/order/my-orders", noCreds);
  const payload = response.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.orders)) return payload.orders;
  if (Array.isArray(payload?.data?.orders)) return payload.data.orders;

  return [];
}

export async function fetchMyOrder(orderId: string) {
  const response = await axiosInstance.get(
    `/api/order/my-orders/${encodeURIComponent(orderId)}`,
    noCreds,
  );
  return response.data?.data ?? response.data;
}

export async function fetchMyOrderRequests(orderId?: string) {
  const response = await axiosInstance.get("/api/order/my-requests", {
    params: orderId ? { orderId } : undefined,
    ...noCreds,
  });

  const payload = response.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.data?.requests)) return payload.data.requests;

  return [];
}