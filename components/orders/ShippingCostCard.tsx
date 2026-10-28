"use client";

import React from "react";

const money = (n?: number | null) => `₹${Number(n ?? 0).toFixed(2)}`;

export default function ShippingCostCard({ order }: { order: any }) {
  const d = order?.deliveryInfo;
  // shudhu Shiprocket courier order e (own delivery te courier cost nei)
  if (d?.source !== "SHIPROCKET") return null;

  const courierCost = Number(d.courierRate || 0);
  const customerPaid = Number(order.shippingCharge || 0);
  const storeBears = Math.max(0, courierCost - customerPaid);
  const booked = !!order.shipment?.awb;
  const free = customerPaid === 0 && courierCost > 0;

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <span className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <i className="pi pi-send text-xs" />
          </span>
          Shipping cost (Shiprocket)
        </h3>
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
            booked ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {booked ? "Booked" : "Estimate"}
        </span>
      </header>

      <div className="p-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Customer paid for shipping</span>
          <span className="font-medium text-gray-800">
            {customerPaid === 0 ? "Free" : money(customerPaid)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">
            Shiprocket charge{d.courierName ? ` (${d.courierName})` : ""}
          </span>
          <span className="font-medium text-gray-800">{money(courierCost)}</span>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg px-3 py-2.5 border ${
            storeBears > 0
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <span className="text-sm font-semibold">You bear</span>
          <span className="text-base font-bold">{money(storeBears)}</span>
        </div>

        {free && (
          <p className="text-[11px] text-gray-500">
            Customer got free delivery as per your delivery rule, so the full
            courier charge is on you.
          </p>
        )}
        {storeBears > 0 && order.paymentMethod === "ONLINE" && (
          <p className="text-[11px] text-gray-500">
            This amount is adjusted from your settlement for this order.
          </p>
        )}
        {!booked && (
          <p className="text-[11px] text-amber-700">
            Courier is not booked yet. The final charge can differ if Shiprocket
            assigns another courier.
          </p>
        )}
      </div>
    </section>
  );
}