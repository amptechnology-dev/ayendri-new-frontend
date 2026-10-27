"use client";

import React, { useState } from "react";
import axiosInstance from "@/service/axios.service";
import { toast } from "react-toastify";
import { Button } from "primereact/button";

type Option = {
  courierId: number;
  name: string;
  mode: "AIR" | "SURFACE" | null;
  etaDays: number;
  etd: string | null;
  rate: number;
  rating: number | null;
  isQuoted: boolean;
};

const DAY_CHOICES = [
  { label: "Same day", value: 0 },
  { label: "1 day", value: 1 },
  { label: "2 days", value: 2 },
  { label: "3 days", value: 3 },
  { label: "5 days", value: 5 },
  { label: "7 days", value: 7 },
  { label: "10 days", value: 10 },
  { label: "15 days", value: 15 },
];

const MODE_CHOICES = [
  { label: "Any (Air / Surface)", value: "ANY" },
  { label: "Air only", value: "AIR" },
  { label: "Surface only", value: "SURFACE" },
];

const money = (n?: number | null) => `₹${Number(n ?? 0).toFixed(2)}`;

const modeText = (m?: string | null) =>
  m === "AIR" ? "✈ Air" : m === "SURFACE" ? "🚚 Surface" : "";

export default function DeliverySpeedCard({
  order,
  onUpdated,
}: {
  order: any;
  onUpdated: (o: any) => void;
}) {
  const d = order.deliveryInfo;
  const isIntl = d?.mode === "INTERNATIONAL";

  const [maxDays, setMaxDays] = useState<number>(
    d?.requestedMaxDays ?? (isIntl ? 10 : 3),
  );
  const [mode, setMode] = useState<string>(d?.requestedMode ?? "ANY");
  const [options, setOptions] = useState<Option[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [canSelect, setCanSelect] = useState(true);
  const [customerCharge, setCustomerCharge] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [fetched, setFetched] = useState(false);

  // LOCAL (nijosho delivery) order e card dekhanor dorkar nei
  if (!["NATIONAL", "INTERNATIONAL"].includes(d?.mode)) return null;

  const locked =
    !["PENDING", "CONFIRMED"].includes(order.status) || !!order.shipment?.awb;

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/api/order/store-orders/${order._id}/shipping-options`,
        { params: { maxDays, mode } },
      );
      setOptions(res.data.options || []);
      setMessage(res.data.message || null);
      setCanSelect(res.data.canSelect !== false);
      setCustomerCharge(res.data.customerShippingCharge || 0);
      setFetched(true);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to load courier options",
      );
    } finally {
      setLoading(false);
    }
  };

  const choose = async (o: Option) => {
    try {
      setSavingId(o.courierId);
      const res = await axiosInstance.patch(
        `/api/order/store-orders/${order._id}/delivery-option`,
        { maxDays, mode, courierId: o.courierId },
      );
      toast.success(res.data.message || "Courier selected");
      onUpdated(res.data.order);
      setFetched(false);
      setOptions([]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to select courier");
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <header className="px-4 py-2.5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <i className="pi pi-bolt text-xs" />
          Delivery speed &amp; courier
        </h3>
      </header>

      <div className="p-4 space-y-3">
        {d?.courierName && (
          <div className="text-xs rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-gray-700">
            Current: <b>{d.courierName}</b>
            {d.courierMode ? ` • ${d.courierMode === "AIR" ? "Air" : "Surface"}` : ""}
            {d.courierEtaDays != null ? ` • ~${d.courierEtaDays} day(s)` : ""}
            {d.courierRate != null ? ` • ${money(d.courierRate)}` : ""}
            {d.courierSelectedBy === "STORE" ? " • chosen by you" : " • auto"}
          </div>
        )}

        {locked ? (
          <p className="text-xs text-gray-500">
            Courier can no longer be changed because the shipment is already
            created.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] font-medium text-gray-500">
                  Deliver within
                </label>
                <select
                  value={maxDays}
                  onChange={(e) => setMaxDays(Number(e.target.value))}
                  className="w-full border rounded-md px-2 py-1.5 bg-white text-sm"
                >
                  {DAY_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-gray-500">
                  Transport
                </label>
                <select
                  value={mode}
                  disabled={isIntl}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full border rounded-md px-2 py-1.5 bg-white text-sm disabled:bg-gray-100"
                >
                  {MODE_CHOICES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  label="Show couriers"
                  icon="pi pi-search"
                  className="w-full"
                  loading={loading}
                  onClick={load}
                />
              </div>
            </div>

            {fetched && message && (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                {message}
              </p>
            )}

            {fetched && !canSelect && options.length > 0 && (
              <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                International shipments are created from the Shiprocket panel,
                so these options are for reference only.
              </p>
            )}

            {options.length > 0 && (
              <>
                <p className="text-[11px] text-gray-500">
                  Customer paid {money(customerCharge)} for shipping. If the
                  courier rate is higher, the difference is borne by the store.
                </p>
                <div className="space-y-2">
                  {options.map((o) => {
                    const diff = o.rate - customerCharge;
                    return (
                      <div
                        key={o.courierId}
                        className="flex flex-wrap items-center justify-between gap-2 border border-gray-100 rounded-lg p-2.5"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {o.name}
                            {o.isQuoted && (
                              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                                quoted
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {!isIntl && modeText(o.mode)
                              ? `${modeText(o.mode)} • `
                              : ""}
                            ~{o.etaDays} day(s)
                            {o.rating ? ` • ★ ${o.rating}` : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-700">
                            {money(o.rate)}
                          </p>
                          <p
                            className={`text-[11px] ${diff > 0 ? "text-red-600" : "text-green-700"}`}
                          >
                            {diff > 0
                              ? `${money(diff)} above customer charge`
                              : `${money(Math.abs(diff))} within customer charge`}
                          </p>
                        </div>
                        {canSelect && (
                          <Button
                            label="Select"
                            size="small"
                            loading={savingId === o.courierId}
                            disabled={savingId !== null}
                            onClick={() => choose(o)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}