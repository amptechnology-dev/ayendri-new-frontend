import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OrderStatus = "Processing" | "Approved" | "Delivered" | "Rejected" | "Canceled";
export type Order = {
  id: string; placedAt: string; status: OrderStatus;
  items: { slug: string; qty: number }[];
  payment: "ONLINE" | "COD"; paid: boolean; total: number;
  address: string; remarks?: string; cancelReason?: string;
};
export type Notice = { id: string; title: string; body: string; at: string; read: boolean };

type S = {
  orders: Order[]; notices: Notice[]; seq: number;
  placeOrder: (o: Omit<Order, "id" | "placedAt" | "status" | "paid">) => string;
  cancelOrder: (id: string, reason: string) => void;
  markPaid: (id: string) => void;
  readAll: () => void;
};

export const useOrders = create<S>()(
  persist(
    (set, get) => ({
      orders: [], notices: [], seq: 12,
      placeOrder: (o) => {
        const id = "ORD" + String(get().seq).padStart(6, "0"); // TODO: POST /orders
        const now = new Date().toISOString();
        set((s) => ({
          seq: s.seq + 1,
          orders: [{ ...o, id, placedAt: now, status: "Processing", paid: false }, ...s.orders],
          notices: [{ id: crypto.randomUUID(), title: "Order Placed 🎉", body: `Your order #${id} has been placed successfully.`, at: now, read: false }, ...s.notices],
        }));
        return id;
      },
      cancelOrder: (id, reason) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status: "Canceled", cancelReason: reason } : o)),
          notices: [{ id: crypto.randomUUID(), title: "Order Cancelled", body: `You cancelled your order #${id}.`, at: new Date().toISOString(), read: false }, ...s.notices],
        })),
      markPaid: (id) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, paid: true, status: "Approved" } : o)) })),
      readAll: () => set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) })),
    }),
    { name: "ayendri-shop-orders" }
  )
);