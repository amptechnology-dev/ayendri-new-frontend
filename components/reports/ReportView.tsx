"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import axiosInstance from "@/service/axios.service";
import {
  getReport,
  downloadReport,
  ReportColumn,
  ReportFormat,
  ReportSummaryItem,
} from "@/service/report.service";
import { formatDate } from "@/helper/DateTime";


type StoreOption = { _id: string; storeName: string };
type FilterKey = "status" | "top" | "level";

export type ViewProps = {
  type: string;
  title: string;
  subtitle?: string;
  monthFilter?: boolean;
  filters?: FilterKey[];
};

const NO_FILTERS: FilterKey[] = [];

const ORDER_STATUSES = ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const money = (n: any) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const cell = (col: ReportColumn, v: any) => {
  if (v === null || v === undefined || v === "") return "-";
  if (col.type === "money") return money(v);
  if (col.type === "number") return Number(v).toLocaleString("en-IN");
  if (col.type === "percent") return `${v}%`;
  if (col.type === "date") return formatDate(v);
  return String(v);
};

const summaryText = (s: ReportSummaryItem) =>
  s.type === "money"
    ? money(s.value)
    : s.type === "number"
      ? Number(s.value).toLocaleString("en-IN")
      : String(s.value);

const selectCls = "border rounded-md px-2 py-1.5 bg-white text-sm";

export default function ReportView({
  type,
  title,
  subtitle,
  monthFilter = true,
  filters = NO_FILTERS,
}: ViewProps) {
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeId, setStoreId] = useState("");
  const [month, setMonth] = useState(monthFilter ? currentMonth() : "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [top, setTop] = useState("20");
  const [level, setLevel] = useState("");

  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<ReportFormat | "">("");
  const [columns, setColumns] = useState<ReportColumn[]>([]);
  const [summary, setSummary] = useState<ReportSummaryItem[]>([]);
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [period, setPeriod] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, rows: 10, total: 0 });
  const reqRef = useRef(0);

  useEffect(() => {
    axiosInstance
      .get("/api/register/user-based-stores")
      .then((res) => setStores(res.data?.stores || []))
      .catch(() => {});
  }, []);

    const filterKey = filters.join(",");

  const buildParams = useCallback(() => {
    const active = filterKey ? filterKey.split(",") : [];
    const p: Record<string, string> = {};
    if (storeId) p.storeId = storeId;
    if (monthFilter) {
      if (month) p.month = month;
      else {
        if (from) p.from = from;
        if (to) p.to = to;
      }
    }
    if (active.includes("status") && status) p.status = status;
    if (active.includes("top")) p.top = top;
    if (active.includes("level") && level) p.level = level;
    return p;
  }, [storeId, month, from, to, status, top, level, monthFilter, filterKey]);

  const load = useCallback(async () => {
    const id = ++reqRef.current;
    try {
      setLoading(true);
      const res = await getReport(type, {
        ...buildParams(),
        page: pagination.page,
        limit: pagination.rows,
      });
      if (id !== reqRef.current) return;
      const d = res.data;
      setColumns(d.columns || []);
      setSummary(d.summary || []);
      setRows(d.rows || []);
      setPeriod(d.period || "");
      setTruncated(!!d.truncated);
      setPagination((p) => ({ ...p, total: d.total ?? 0 }));
    } catch (err: any) {
      if (id !== reqRef.current) return;
      toast.error(err?.response?.data?.message || "Failed to load report");
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [type, buildParams, pagination.page, pagination.rows]);

  useEffect(() => {
    load();
  }, [load]);

  const resetPage = () => setPagination((p) => ({ ...p, page: 1 }));

  const handleDownload = async (format: ReportFormat) => {
    try {
      setDownloading(format);
      const label = month || (from || to ? `${from || "start"}_to_${to || "today"}` : "all");
      await downloadReport(type, format, buildParams(), `${type}-${label}`);
    } catch (err: any) {
      toast.error(err?.message || "Download failed");
    } finally {
      setDownloading("");
    }
  };

  const dlBtn = (format: ReportFormat, label: string, icon: string) => (
    <button
      key={format}
      type="button"
      onClick={() => handleDownload(format)}
      disabled={!!downloading}
      className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-60"
    >
      <i className={`pi ${downloading === format ? "pi-spin pi-spinner" : icon}`} />
      {label}
    </button>
  );

  return (
    <div className="space-y-3">
      <div
        className="flex flex-col gap-2 xl:flex-row xl:justify-between xl:items-center p-2 sm:p-3 rounded-lg"
        style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
      >
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-white">{title}</h2>
          <p className="text-xs text-blue-100">
            {subtitle ? `${subtitle} • ` : ""}
            {period}
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
              className={selectCls}
            >
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeName}
                </option>
              ))}
            </select>
          )}

          {monthFilter && (
            <>
              <input
                type="month"
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  setFrom("");
                  setTo("");
                  resetPage();
                }}
                className={selectCls}
                title="Month"
              />
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setMonth("");
                  resetPage();
                }}
                className={selectCls}
                title="From"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setMonth("");
                  resetPage();
                }}
                className={selectCls}
                title="To"
              />
              {(month || from || to) && (
                <button
                  type="button"
                  onClick={() => {
                    setMonth("");
                    setFrom("");
                    setTo("");
                    resetPage();
                  }}
                  className="rounded-md bg-blue-800/40 px-2.5 py-1.5 text-sm text-white hover:bg-blue-800/60"
                >
                  All time
                </button>
              )}
            </>
          )}

          {filters.includes("status") && (
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                resetPage();
              }}
              className={selectCls}
            >
              <option value="">All status</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {filters.includes("top") && (
            <select
              value={top}
              onChange={(e) => {
                setTop(e.target.value);
                resetPage();
              }}
              className={selectCls}
            >
              <option value="10">Top 10</option>
              <option value="20">Top 20</option>
              <option value="50">Top 50</option>
              <option value="100">Top 100</option>
              <option value="5000">All</option>
            </select>
          )}

          {filters.includes("level") && (
            <select
              value={level}
              onChange={(e) => {
                setLevel(e.target.value);
                resetPage();
              }}
              className={selectCls}
            >
              <option value="">Low + out of stock</option>
              <option value="out">Out of stock only</option>
            </select>
          )}

          {dlBtn("xlsx", "Excel", "pi-file-excel")}
          {dlBtn("csv", "CSV", "pi-file")}
          {dlBtn("pdf", "PDF", "pi-file-pdf")}
        </div>
      </div>

      {summary.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {summary.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-gray-200 bg-white shadow-sm px-3.5 py-3"
            >
              <p className="text-[11px] font-medium text-gray-400">{s.label}</p>
              <p className="text-sm font-semibold text-gray-800 truncate">{summaryText(s)}</p>
            </div>
          ))}
        </div>
      )}

      {truncated && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Only the first 5000 rows are included. Narrow the filter to see everything.
        </p>
      )}

      <DataTable
        value={rows}
        lazy
        paginator
        first={(pagination.page - 1) * pagination.rows}
        rows={pagination.rows}
        totalRecords={pagination.total}
        loading={loading}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPage={(e) =>
          setPagination((p) => ({
            ...p,
            page: (e.page ?? 0) + 1,
            rows: e.rows ?? p.rows,
          }))
        }
        responsiveLayout="scroll"
        emptyMessage="No data found for this filter"
      >
        {columns.map((c) => (
          <Column
            key={c.key}
            header={c.header}
            align={["money", "number", "percent"].includes(c.type) ? "right" : "left"}
            body={(r: Record<string, any>) => cell(c, r[c.key])}
          />
        ))}
      </DataTable>

      <ToastContainer position="top-right" />
    </div>
  );
}

// ---------- tab wrapper (ekta page e ekadhik report) ----------
export function ReportTabs({
  tabs,
}: {
  tabs: { label: string; props: ViewProps }[];
}) {
  const [active, setActive] = useState(0);
  return (
    <div className="w-full flex justify-start items-start pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4 space-y-3">
        {tabs.length > 1 && (
          <div className="flex flex-wrap gap-1.5 border-b border-gray-200 pb-2">
            {tabs.map((t, i) => (
              <button
                key={t.props.type}
                type="button"
                onClick={() => setActive(i)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  i === active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <ReportView key={tabs[active].props.type} {...tabs[active].props} />
      </div>
    </div>
  );
}