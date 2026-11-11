"use client";

import React from "react";
import Link from "next/link";

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const statusCls: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-700",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export type OrderLite = {
  _id: string;
  orderNumber?: string;
  status?: string;
  totalAmount?: number;
  totalItems?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  createdAt?: string;
  quote?: { total?: number };
  deliveryAddress?: any;
  items?: any[];
};

export default function OrderSummary({
  order,
  compact = false,
}: {
  order: OrderLite;
  compact?: boolean;
}) {
  const a = order.deliveryAddress;
  const addr = a
    ? [
        a.fullName,
        a.phone,
        [a.addressLine, a.area].filter(Boolean).join(", "),
        [a.city, a.state].filter(Boolean).join(", ") + (a.pincode ? ` - ${a.pincode}` : ""),
      ]
        .filter(Boolean)
        .join(" · ")
    : "";
  const total = Number(order.totalAmount) > 0 ? Number(order.totalAmount) : Number(order.quote?.total || 0);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <i className="pi pi-shopping-cart text-amber-700" />
          <span className="text-sm font-semibold text-gray-800">Order #{order.orderNumber}</span>
          {order.status && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCls[order.status] || "bg-gray-100 text-gray-700"}`}
            >
              {order.status}
            </span>
          )}
        </div>
        <Link
          href={`/dashboard/orders?search=${encodeURIComponent(String(order.orderNumber || ""))}`}
          className="text-xs font-medium text-blue-700 hover:underline"
        >
          Open in Orders →
        </Link>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
        <div>
          Total: <b className="text-gray-800">{total > 0 ? inr(total) : "Price pending"}</b>
        </div>
        <div>
          Payment:{" "}
          <b className="text-gray-800">
            {[order.paymentMethod, order.paymentStatus].filter(Boolean).join(" · ") || "-"}
          </b>
        </div>
        {order.createdAt && (
          <div>
            Placed: <b className="text-gray-800">{new Date(order.createdAt).toLocaleDateString("en-IN")}</b>
          </div>
        )}
        {addr && !compact && <div className="col-span-2">Address: {addr}</div>}
      </div>

      {!!order.items?.length && (
        <div className="mt-2 space-y-1.5">
          {order.items.map((it: any, i: number) => {
            const variant = [it.color, it.size, it.weight, it.height].filter(Boolean).join(" · ");
            return (
              <div key={it._id || i} className="flex items-center gap-2 rounded-md bg-white p-1.5">
                {it.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.image} alt={it.name} className="h-10 w-10 shrink-0 rounded border object-cover" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded bg-gray-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-gray-800">{it.name}</p>
                  <p className="truncate text-[11px] text-gray-500">
                    {variant ? `${variant} · ` : ""}Qty {it.quantity}
                    {it.offerPrice != null ? ` × ${inr(it.offerPrice)}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}