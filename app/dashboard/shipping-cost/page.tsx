"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useRouter } from "next/navigation";
import axiosInstance from "@/service/axios.service";
import {
  getShippingCostReport,
  ShippingCostRow,
  ShippingCostSummary,
} from "@/service/delivery.service";
import { formatDate } from "@/helper/DateTime";

type StoreOption = { _id: string; storeName: string };

const money = (n?: number | null) => `₹${Number(n ?? 0).toFixed(2)}`;

const EMPTY: ShippingCostSummary = {
  orders: 0,
  courierCost: 0,
  customerPaid: 0,
  storeBears: 0,
  freeOrders: 0,
  booked: { orders: 0, courierCost: 0, storeBears: 0 },
  pending: { orders: 0, courierCost: 0, storeBears: 0 },
};

function Tile({
  icon,
  label,
  value,
  sub,
  tone = "blue",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  tone?: "blue" | "red" | "green" | "amber";
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    green: "bg-green-50 text-green-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white shadow-sm px-3.5 py-3">
      <span
        className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${tones[tone]}`}
      >
        <i className={`pi ${icon}`} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
        {sub && <p className="text-[11px] text-gray-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export default function ShippingCostPage() {
  const router = useRouter();

  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeId, setStoreId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [booked, setBooked] = useState<"" | "true" | "false">("");

  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ShippingCostSummary>(EMPTY);
  const [rows, setRows] = useState<ShippingCostRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, rows: 10, total: 0 });
  const reqRef = useRef(0);

  useEffect(() => {
    axiosInstance
      .get("/api/register/user-based-stores")
      .then((res) => setStores(res.data?.stores || []))
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    const id = ++reqRef.current;
    try {
      setLoading(true);
      const res = await getShippingCostReport({
        page: pagination.page,
        limit: pagination.rows,
        ...(storeId ? { storeId } : {}),
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(booked ? { booked } : {}),
      });
      if (id !== reqRef.current) return;
      setSummary(res.data.summary || EMPTY);
      setRows(res.data.rows || []);
      setPagination((p) => ({ ...p, total: res.data.totalOrders ?? 0 }));
    } catch (err: any) {
      if (id !== reqRef.current) return;
      toast.error(err?.response?.data?.message || "Failed to load report");
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [pagination.page, pagination.rows, storeId, from, to, booked]);

  useEffect(() => {
    load();
  }, [load]);

  const resetPage = () => setPagination((p) => ({ ...p, page: 1 }));

  return (
    <div className="w-full flex justify-start items-start pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4 space-y-3">
        <div
          className="flex flex-col gap-2 lg:flex-row lg:justify-between lg:items-center p-2 sm:p-3 rounded-lg"
          style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
        >
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-white">
              Shipping cost
            </h2>
            <p className="text-xs text-blue-100">
              Shiprocket charge vs what customers paid
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {stores.length > 1 && (
              <select
                value={storeId}
                onChange={(e) => {
                  setStoreId(e.target.value);
                  resetPage();
                }}
                className="border rounded-md px-2 py-1.5 bg-white text-sm"
              >
                <option value="">All stores</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.storeName}
                  </option>
                ))}
              </select>
            )}
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                resetPage();
              }}
              className="border rounded-md px-2 py-1.5 bg-white text-sm"
            />
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                resetPage();
              }}
              className="border rounded-md px-2 py-1.5 bg-white text-sm"
            />
            <select
              value={booked}
              onChange={(e) => {
                setBooked(e.target.value as "" | "true" | "false");
                resetPage();
              }}
              className="border rounded-md px-2 py-1.5 bg-white text-sm"
            >
              <option value="">All</option>
              <option value="true">Courier booked</option>
              <option value="false">Not booked yet</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Tile
            icon="pi-send"
            label="Shiprocket charge (total)"
            value={money(summary.courierCost)}
            sub={`${summary.orders} order(s)`}
          />
          <Tile
            icon="pi-wallet"
            label="Customers paid"
            value={money(summary.customerPaid)}
            sub={`${summary.freeOrders} free delivery order(s)`}
            tone="green"
          />
          <Tile
            icon="pi-exclamation-circle"
            label="You bear"
            value={money(summary.storeBears)}
            sub="Courier charge above customer shipping"
            tone="red"
          />
          <Tile
            icon="pi-clock"
            label="Not booked yet"
            value={money(summary.pending.courierCost)}
            sub={`${summary.pending.orders} order(s) • you bear ${money(summary.pending.storeBears)}`}
            tone="amber"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <p className="font-semibold text-gray-700 mb-1">Courier booked</p>
            <p className="text-gray-600">
              {summary.booked.orders} order(s) • Shiprocket{" "}
              <b>{money(summary.booked.courierCost)}</b> • you bear{" "}
              <b>{money(summary.booked.storeBears)}</b>
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <p className="font-semibold text-gray-700 mb-1">
              Not booked yet (estimate)
            </p>
            <p className="text-gray-600">
              {summary.pending.orders} order(s) • Shiprocket{" "}
              <b>{money(summary.pending.courierCost)}</b> • you bear{" "}
              <b>{money(summary.pending.storeBears)}</b>
            </p>
          </div>
        </div>

        <DataTable
          value={rows}
          lazy
          paginator
          first={(pagination.page - 1) * pagination.rows}
          rows={pagination.rows}
          totalRecords={pagination.total}
          loading={loading}
          rowsPerPageOptions={[10, 25, 50]}
          onPage={(e) =>
            setPagination((p) => ({
              ...p,
              page: (e.page ?? 0) + 1,
              rows: e.rows ?? p.rows,
            }))
          }
          responsiveLayout="scroll"
          onRowClick={(e) =>
            router.push(`/dashboard/orders/${(e.data as ShippingCostRow).orderId}`)
          }
          rowClassName={() => "cursor-pointer"}
          emptyMessage="No courier orders found"
        >
          <Column field="orderNumber" header="Order #" />
          <Column
            header="Placed On"
            body={(r: ShippingCostRow) => formatDate(r.createdAt)}
          />
          <Column
            header="Courier"
            body={(r: ShippingCostRow) => (
              <div>
                <p className="text-xs font-medium text-gray-800">
                  {r.courierName || "-"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {r.awb || "Not booked"}
                  {r.courierMode
                    ? ` • ${r.courierMode === "AIR" ? "Air" : "Surface"}`
                    : ""}
                </p>
              </div>
            )}
          />
          <Column
            header="Customer paid"
            body={(r: ShippingCostRow) =>
              r.customerPaid === 0 ? (
                <span className="text-green-700 font-medium">Free</span>
              ) : (
                money(r.customerPaid)
              )
            }
          />
          <Column
            header="Shiprocket charge"
            body={(r: ShippingCostRow) => money(r.courierCost)}
          />
          <Column
            header="You bear"
            body={(r: ShippingCostRow) => (
              <span
                className={
                  r.storeBears > 0
                    ? "text-red-600 font-semibold"
                    : "text-green-700 font-medium"
                }
              >
                {money(r.storeBears)}
              </span>
            )}
          />
          <Column
            header="Status"
            body={(r: ShippingCostRow) => (
              <div>
                <p className="text-xs text-gray-800">{r.status}</p>
                {r.shipmentStatus && (
                  <p className="text-[11px] text-indigo-700">{r.shipmentStatus}</p>
                )}
              </div>
            )}
          />
        </DataTable>

        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}