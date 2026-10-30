"use client";
import axiosInstance from "@/service/axios.service";
import { imgUrl } from "./api";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type WishlistProduct = {
  id: string;
  slug?: string;
  name: string;
  brand?: string;
  price: number;
  category?: string;
  image: string;
  description?: string;
  unit?: string;
  isAvailable?: boolean;
};

const idOf = (value: any): string =>
  String(value?._id ?? value?.id ?? value ?? "");

function normalizeWishlist(payload: any): WishlistProduct[] {
  const wishlist =
    payload?.wishlist ?? payload?.data?.wishlist ?? payload?.data ?? payload;

  const toProduct = (item: any, storeName = ""): WishlistProduct => {
    const product =
      item?.productId && typeof item.productId === "object"
        ? item.productId
        : item?.product && typeof item.product === "object"
          ? item.product
          : null;

    const productId = idOf(
      product?._id ??
        product?.id ??
        item?.productId ??
        item?.product ??
        item?._id ??
        item?.id,
    );

    return {
      id: productId,
      slug: product?.slug ?? item?.slug ?? undefined,
      name:
        item?.name ?? product?.title ?? product?.name ?? "Product unavailable",
      brand: storeName || item?.brand || "",
      price: Number(
        item?.minOfferPrice ??
          item?.price ??
          product?.minOfferPrice ??
          product?.price ??
          0,
      ),
      category: item?.category ?? product?.category ?? "",
      image: imgUrl(
        item?.image ??
          product?.image ??
          product?.images?.[0] ??
          product?.thumbnail ??
          "",
      ),
      description: item?.description ?? product?.description ?? "",
      unit: item?.unit ?? product?.unit,
      isAvailable: item?.isAvailable ?? product?.isAvailable,
    };
  };

  if (Array.isArray(wishlist)) {
    return wishlist
      .map((item: any) => toProduct(item))
      .filter((item) => item.id);
  }

  if (Array.isArray(wishlist?.stores)) {
    return wishlist.stores
      .flatMap((group: any) =>
        (group?.items ?? []).map((item: any) =>
          toProduct(item, group?.store?.storeName ?? ""),
        ),
      )
      .filter((item: WishlistProduct) => item.id);
  }

  if (Array.isArray(wishlist?.items)) {
    return wishlist.items
      .map((item: any) => toProduct(item))
      .filter((item: WishlistProduct) => item.id);
  }

  return [];
}

export async function fetchWishlist(): Promise<WishlistProduct[]> {
  const response = await axiosInstance.get("/api/wishlist", noCreds);
  return normalizeWishlist(response.data);
}

export async function toggleWishlist(productId: string): Promise<void> {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  await axiosInstance.post("/api/wishlist/toggle", { productId }, noCreds);
}

export async function addToWishlist(productId: string): Promise<void> {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  await axiosInstance.post("/api/wishlist/toggle", { productId }, noCreds);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  if (!productId) {
    throw new Error("Product ID is required.");
  }

  await axiosInstance.post("/api/wishlist/toggle", { productId }, noCreds);
}

export async function isProductWishlisted(productId: string): Promise<boolean> {
  const items = await fetchWishlist();
  return items.some((item) => item.id === productId);
}