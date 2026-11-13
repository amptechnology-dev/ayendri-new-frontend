"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { formatDate } from "@/helper/DateTime";
import ProductForm from "@/components/product/ProductFrom";

type Row = {
  _id: string;
  name: string;
  productCode?: string;
  images?: string[];
  variants?: { images?: string[] }[];
  minOfferPrice?: number | null;
  maxOfferPrice?: number | null;
  createdAt?: string;
  store?: { storeName?: string };
  category?: { name?: string };
  productType?: "PRODUCT" | "SERVICE";
};

const ROWS_OPTIONS = [10, 25, 50, 100];
const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const money = (n?: number | null) =>
  n === null || n === undefined ? "-" : `₹${inr.format(n)}`;

const thumbOf = (p: Row) =>
  p.images?.[0] ||
  p.variants?.find((v) => v.images?.length)?.images?.[0] ||
  null;

function UnverifiedProductsPage() {
  const [products, setProducts] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pg, setPg] = useState({ first: 0, rows: 10 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row[]>([]);

  const [formVisible, setFormVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [targetIds, setTargetIds] = useState<string[]>([]);

  const reqRef = useRef(0);

  const fetchProducts = useCallback(async () => {
    const id = ++reqRef.current;
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/product/all-products", {
        params: {
          page: pg.first / pg.rows + 1,
          limit: pg.rows,
          verified: "false",
          ...(search ? { search } : {}),
        },
      });
      if (id !== reqRef.current) return;
      setProducts(res.data.products || []);
      setTotal(res.data.totalProducts || 0);
    } catch (error: any) {
      if (id !== reqRef.current) return;
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Something went wrong"
          : "Unexpected error occurred",
      );
    } finally {
      if (id === reqRef.current) setLoading(false);
    }
  }, [pg.first, pg.rows, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPg((p) => ({ ...p, first: 0 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ---------- OTP ----------
  const sendOtp = async () => {
    try {
      setOtpSending(true);
      const res = await axiosInstance.post("/api/product/send-otp");
      toast.success(res.data?.message || "OTP sent");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpSending(false);
    }
  };

  const openVerify = async (ids: string[]) => {
    if (!ids.length) {
      toast.error("Select at least one product");
      return;
    }
    setTargetIds(ids);
    setOtp("");
    setOtpOpen(true);
    await sendOtp();
  };

  const confirmVerify = async () => {
    if (!otp.trim()) {
      toast.error("Enter the OTP");
      return;
    }
    try {
      setVerifying(true);
      const res = await axiosInstance.post("/api/product/verify-products", {
        productIds: targetIds,
        otp: otp.trim(),
      });
      toast.success(res.data?.message || "Products verified");
      setOtpOpen(false);
      setSelected([]);
      window.dispatchEvent(new Event("storeProductsChanged"));
      // current page faka hoye gele ager page e jao
      if (products.length === targetIds.length && pg.first > 0) {
        setPg((p) => ({ ...p, first: Math.max(0, p.first - p.rows) }));
      } else {
        await fetchProducts();
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  // ---------- Edit ----------
  const closeForm = () => {
    setFormVisible(false);
    setEditId(null);
  };

  return (
    <div className="w-full pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4">
        {/* Header */}
        <div
          className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg"
          style={{ background: "linear-gradient(120deg,#f59e0b,#d97706)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Unverified Products
            </h2>
            <p className="text-xs text-amber-50">
              {total} waiting. Verify with OTP to show them to customers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              label="Refresh"
              icon="pi pi-refresh"
              loading={loading}
              onClick={fetchProducts}
              style={{
                background: "transparent",
                color: "#fff",
                border: "1px solid #fde68a",
              }}
            />
            <Button
              label={`Verify selected (${selected.length})`}
              icon="pi pi-check-circle"
              disabled={selected.length === 0}
              onClick={() => openVerify(selected.map((p) => p._id))}
              style={{
                background: "#fff",
                color: "#b45309",
                border: "1px solid #fde68a",
              }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 relative w-full sm:max-w-md">
          <i className="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-amber-600 text-sm pointer-events-none" />
          <InputText
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by product name or code..."
            className="w-full"
            style={{ paddingLeft: 36 }}
          />
        </div>

        {/* Table */}
        <DataTable
          value={products}
          lazy
          paginator
          first={pg.first}
          rows={pg.rows}
          totalRecords={total}
          rowsPerPageOptions={ROWS_OPTIONS}
          onPage={(e) => setPg({ first: e.first, rows: e.rows })}
          loading={loading}
          dataKey="_id"
          selectionMode="checkbox"
          selection={selected}
          onSelectionChange={(e) =>
            setSelected(Array.isArray(e.value) ? e.value : [])
          }
          responsiveLayout="scroll"
          emptyMessage={
            <div className="text-center py-10 text-gray-500">
              🎉 No unverified products. Everything is verified.
            </div>
          }
          className="mt-3"
        >
          <Column selectionMode="multiple" headerStyle={{ width: "3rem" }} />
          <Column
            header="Product"
            body={(row: Row) => {
              const t = thumbOf(row);
              return (
                <div className="flex items-center gap-3 min-w-[220px]">
                  {t ? (
                    /\.(mp4|webm|mov)(\?.*)?$/i.test(t) ? (
                      <video
                        src={`${t}#t=0.1`}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-12 w-16 rounded-lg object-cover border border-gray-200"
                      />
                    ) : (
                      <img
                        src={t}
                        alt={row.name}
                        className="h-12 w-16 rounded-lg object-cover border border-gray-200"
                      />
                    )
                  ) : (
                    <div className="h-12 w-16 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <i className="pi pi-image" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {row.name}
                    </p>
                    <p className="text-xs text-gray-500">{row.productCode}</p>
                  </div>
                </div>
              );
            }}
          />
          <Column
            header="Type"
            body={(row: Row) =>
              row.productType === "SERVICE" ? "Service" : "Product"
            }
          />
          <Column
            header="Category"
            body={(row: Row) => row.category?.name || "-"}
          />
          <Column
            header="Store"
            body={(row: Row) => row.store?.storeName || "-"}
          />
          <Column
            header="Price"
            body={(row: Row) =>
              row.minOfferPrice == null
                ? "-"
                : row.maxOfferPrice != null &&
                    row.maxOfferPrice !== row.minOfferPrice
                  ? `${money(row.minOfferPrice)} - ${money(row.maxOfferPrice)}`
                  : money(row.minOfferPrice)
            }
          />
          <Column
            header="Created"
            body={(row: Row) => formatDate(row.createdAt || "")}
          />
          <Column
            header="Actions"
            body={(row: Row) => (
              <div className="flex gap-1.5">
                <Button
                  icon="pi pi-check-circle"
                  tooltip="Verify"
                  tooltipOptions={{ position: "top" }}
                  onClick={() => openVerify([row._id])}
                  style={{
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                />
                <Button
                  icon="pi pi-pencil"
                  tooltip="Edit"
                  tooltipOptions={{ position: "top" }}
                  onClick={() => {
                    setEditId(row._id);
                    setFormVisible(true);
                  }}
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                />
              </div>
            )}
          />
        </DataTable>

        {/* OTP dialog */}
        <Dialog
          header={`Verify ${targetIds.length} product${targetIds.length > 1 ? "s" : ""}`}
          visible={otpOpen}
          onHide={() => !verifying && setOtpOpen(false)}
          style={{ width: "min(92vw, 420px)" }}
          modal
          draggable={false}
        >
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Enter the OTP sent to your registered mobile number.
            </p>
            <InputText
              className="w-full"
              value={otp}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              inputMode="numeric"
              placeholder="Enter OTP"
              autoFocus
            />
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                label="Resend OTP"
                icon="pi pi-refresh"
                size="small"
                outlined
                loading={otpSending}
                disabled={verifying}
                onClick={sendOtp}
              />
              <Button
                type="button"
                label="Verify"
                icon="pi pi-check"
                loading={verifying}
                disabled={!otp.trim()}
                onClick={confirmVerify}
              />
            </div>
          </div>
        </Dialog>

        {/* Edit dialog (ProductForm nijei update-er age OTP chay) */}
        {formVisible && (
          <Dialog
            header="Edit Product"
            visible={formVisible}
            style={{ width: "min(96vw, 1100px)" }}
            contentStyle={{ maxHeight: "88vh", overflow: "auto" }}
            onHide={closeForm}
            closable={false}
            dismissableMask={false}
            draggable={false}
          >
            <ProductForm
              productId={editId}
              onClose={closeForm}
              onSuccess={() => {
                closeForm();
                fetchProducts();
              }}
            />
          </Dialog>
        )}

        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}

export default UnverifiedProductsPage;