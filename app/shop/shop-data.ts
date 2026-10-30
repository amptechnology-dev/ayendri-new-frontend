"use client";
import { create } from "zustand";
import {
  categories as seedCategories,
  type Product,
  type Category,
} from "./data";
import * as A from "./api";
type ShopState = {
  products: Product[];
  categories: Category[];
  banners: A.Banner[];
  offerBanners: A.Banner[];
  storeMongoId: string;
  loading: boolean;
  loaded: boolean;
  load: () => Promise<void>;
};
const forStore = (mongoId: string) => (b: any) => {
  const raw = b.storeId ?? b.store;
  const id = typeof raw === "object" ? raw?._id : raw;
  return !mongoId || !id || String(id) === mongoId;
};
export const useShop = create<ShopState>((set, get) => ({
  products: [],
  categories: seedCategories,
  banners: [],
  offerBanners: [],
  storeMongoId: "",
  loading: false,
  loaded: false,
  load: async () => {
    if (get().loading || get().loaded) return;
    set({ loading: true });
    try {
      const pin =
        typeof window !== "undefined"
          ? (localStorage.getItem("ayendri-pincode") ?? "")
          : "";
      console.log("[shop] API:", A.API);
      console.log("[shop] Store ID:", A.STORE_ID);
      const [pr, ca, ba] = await Promise.allSettled([
        A.fetchProducts(pin),
        A.fetchCategories(),
        A.fetchBanners(),
      ]);
      if (pr.status === "fulfilled") {
        const response = pr.value;
        const rawProducts = response.products ?? [];
        const mapped: Product[] = rawProducts.map(A.mapProduct);
        console.log("[shop] Raw products:", rawProducts);
        console.log("[shop] Product count:", mapped.length);
        console.log("[shop] Mapped products:", mapped);
        set({
          products: mapped,
          storeMongoId: String(response.store?._id ?? response.store?.id ?? ""),
        });
      } else {
        console.error("[shop] Product request failed:", pr.reason);
        set({ products: [] });
      }
      if (ca.status === "fulfilled") {
        const mapped: Category[] = (ca.value.categories ?? []).map(
          A.mapCategory,
        );
        if (mapped.length) {
          set({ categories: mapped });
        }
      } else {
        console.error("[shop] Category request failed:", ca.reason);
      }
      if (ba.status === "fulfilled") {
        const mongoId = String(
          pr.status === "fulfilled"
            ? (pr.value.store?._id ?? pr.value.store?.id ?? "")
            : "",
        );
        set({
          banners: (ba.value.banners ?? [])
            .filter((b: any) => b.isActive)
            .filter((b: any) => !b.offerBanner)
            .filter(forStore(mongoId))
            .map(A.mapBanner),
        });
        if (mongoId) {
          try {
            const o = await A.fetchOfferBanners(mongoId);
            set({
              offerBanners: (o.banners ?? [])
                .filter((b: any) => b.isActive !== false)
                .filter(forStore(mongoId))
                .map(A.mapBanner),
            });
          } catch (error) {
            console.error("[shop] Offer banners failed:", error);
          }
        }
      } else {
        console.error("[shop] Banner request failed:", ba.reason);
      }
      set({ loaded: true });
    } catch (error) {
      console.error("[shop] Loading failed:", error);
    } finally {
      set({ loading: false });
    }
  },
}));
