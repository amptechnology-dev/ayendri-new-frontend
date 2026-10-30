import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuth } from "./auth";
import {
  fetchAllProducts,
  cartItemsFromResponse,
  cartIdFromResponse,
  cartProductId,
  cartLineId,
  type Product,
  type Item,
} from "./cart-api";

import { shopApi, errMsg } from "./auth";

const cartCall = async (run: () => Promise<unknown>) => {
  try {
    await run();
  } catch (e) {
    const x = e as any;
    console.log(
      "CART DEBUG 404",
      x?.config?.method,
      x?.config?.baseURL,
      x?.config?.url,
      x?.response?.data,
    );
    throw new Error(errMsg(e, "Could not update your cart"));
  }
};

type Line = {
  slug: string;
  qty: number;
};

type CartState = {
  // Existing cart state
  lines: Line[];
  promo: string;
  discount: number;
  remarks: string;
  payment: "ONLINE" | "COD";
  address: string;

  // State expected by page.tsx
  items: Item[];
  products: Product[];
  loading: boolean;

  // Existing operations
  add: (slug: string, qty?: number) => Promise<void>;
  setQty: (slug: string, qty: number) => Promise<void>;
  remove: (slug: string) => Promise<void>;
  applyPromo: (code: string) => boolean;
  set: (p: Partial<CartState>) => void;
  clear: () => void;

  // Operations expected by page.tsx and CartSync
  hydrate: () => Promise<void>;
  reset: () => void;
  addItem: (product: Product) => Promise<void>;
  changeQuantity: (item: Item, delta: number) => Promise<void>;
  removeItem: (item: Item) => Promise<void>;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      promo: "",
      discount: 0,
      remarks: "",
      payment: "ONLINE",
      address: "HOME · Dunlop, Kolkata, West Bengal 700108",

      items: [],
      products: [],
      loading: false,

      add: async (slug, qty = 1) => {
        if (!useAuth.getState().token) {
          window.location.href = "/shop/login?next=/shop/cart";
          return;
        }
        try {
          await cartCall(() =>
            shopApi.post("/api/cart/add", { productId: slug, quantity: qty }),
          );
          await get().hydrate();
        } catch (e: any) {
          alert(e.message);
        }
      },

      setQty: async (slug, qty) => {
        const item = get().items.find((i) => i.id === slug);
        if (item) await get().changeQuantity(item, qty - item.quantity);
      },

      remove: async (slug) => {
        const item = get().items.find((i) => i.id === slug);
        if (item) await get().removeItem(item);
      },

      applyPromo: (code) => {
        const valid = code.trim().toUpperCase() === "AYENDRI10";

        set({
          promo: valid ? code.trim().toUpperCase() : "",
          discount: valid ? 10 : 0,
        });

        return valid;
      },

      set: (partial) => set(partial),

      clear: () =>
        set({
          lines: [],
          items: [],
          promo: "",
          discount: 0,
          remarks: "",
        }),

      reset: () =>
        set({
          lines: [],
          items: [],
          products: [],
          loading: false,
        }),

      hydrate: async () => {
        const { token, user, ready } = useAuth.getState();
        console.log("CART AUTH DEBUG:", {
          authReady: ready,
          hasToken: Boolean(token),
          tokenLength: token?.length ?? 0,
          userId: user?.id ?? null,
          userEmail: user?.email ?? null,
        });
        if (!token) {
          set({ items: [], loading: false });
          return;
        }

        set({ loading: true });

        try {
          const [productResult, cartResponse] = await Promise.all([
            fetchAllProducts(),
            shopApi.get("/api/cart/"),
          ]);

          const products = productResult.products;
          const serverItems = cartItemsFromResponse(cartResponse.data);

          const items: Item[] = serverItems.flatMap((serverItem: any) => {
            const productId = cartProductId(serverItem);

            const product = products.find((p) => p._id === productId);

            if (!product) {
              console.warn(
                "Cart product was not found in the catalogue:",
                productId,
              );
              return [];
            }

            const quantity = Number(serverItem.quantity ?? serverItem.qty ?? 1);

            return [
              {
                id: product._id,
                lineId: cartLineId(
                  product._id,
                  serverItem.variantId,
                  serverItem.colorVariantId,
                  serverItem.size,
                  serverItem.weight,
                ),
                cartItemId:
                  serverItem._id ??
                  serverItem.id ??
                  serverItem.cartItemId ??
                  undefined,
                quantity: quantity > 0 ? quantity : 1,
                product,
                variantLabel:
                  serverItem.variantLabel ??
                  serverItem.variant?.name ??
                  undefined,
                isAvailable: serverItem.isAvailable ?? true,
              },
            ];
          });

          set({
            products,
            items,
            lines: items.map((item) => ({
              slug: item.id,
              qty: item.quantity,
            })),
            loading: false,
          });
        } catch (error) {
          console.error("Failed to load cart from backend:", error);
          set({ loading: false });
        }
      },

      addItem: async (product) => {
        if (!product._id) throw new Error("Product ID is missing.");
        await cartCall(() =>
          shopApi.post("/api/cart/add", {
            productId: product._id,
            quantity: 1,
          }),
        );
        await get().hydrate();
      },

      changeQuantity: async (item, delta) => {
        const quantity = item.quantity + delta;
        if (quantity <= 0) return get().removeItem(item);
        await cartCall(() =>
          shopApi.patch(
            `/api/cart/items/${encodeURIComponent(item.cartItemId ?? item.lineId)}`,
            { quantity },
          ),
        );
        await get().hydrate();
      },

      removeItem: async (item) => {
        await cartCall(() =>
          shopApi.delete(
            `/api/cart/items/${encodeURIComponent(item.cartItemId ?? item.lineId)}`,
          ),
        );
        await get().hydrate();
      },
    }),
    {
      name: "ayendri-shop-cart",
      partialize: (state) => ({
        lines: state.lines,
        promo: state.promo,
        discount: state.discount,
        remarks: state.remarks,
        payment: state.payment,
        address: state.address,
      }),
    },
  ),
);

export const bill = (
  rows: { price: number; mrp: number; qty: number }[],
  discount: number,
) => {
  const mrp = rows.reduce((total, row) => total + row.mrp * row.qty, 0);

  const sub = rows.reduce((total, row) => total + row.price * row.qty, 0);

  return {
    mrp,
    sub,
    save: mrp - sub + discount,
    total: Math.max(sub - discount, 0),
  };
};
