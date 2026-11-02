"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { Paginator } from "primereact/paginator";
import { InputTextarea } from "primereact/inputtextarea";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { formatDate } from "@/helper/DateTime";

const LIST_ENDPOINT = "/api/product/my-store-reviews";

type Filter = "all" | "unreplied" | "replied";

type ReviewRow = {
  _id: string;
  productId: string;
  productName: string;
  productCode?: string;
  productImage?: string | null;
  rating: number;
  comment?: string;
  image?: string | null;
  createdAt: string;
  reply?: { text: string; repliedAt?: string } | null;
  user?: { _id?: string; name?: string; picture?: string } | null;
};

/* half star shoho display */
function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <span
      className="relative inline-block whitespace-nowrap leading-none"
      style={{ fontSize: size }}
      title={`${value} / 5`}
    >
      <span className="text-gray-300">★★★★★</span>
      <span
        className="absolute left-0 top-0 overflow-hidden whitespace-nowrap text-amber-400"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unreplied", label: "Needs reply" },
  { key: "replied", label: "Replied" },
];

export default function StoreReviewsPage() {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [unreplied, setUnreplied] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [pagination, setPagination] = useState({ page: 1, rows: 10 });
  const [loading, setLoading] = useState(false);

  const [target, setTarget] = useState<ReviewRow | null>(null);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  const reqIdRef = useRef(0);

  const fetchReviews = useCallback(async () => {
    const reqId = ++reqIdRef.current;
    try {
      setLoading(true);
      const res = await axiosInstance.get(LIST_ENDPOINT, {
        params: { filter, page: pagination.page, limit: pagination.rows },
      });
      if (reqId !== reqIdRef.current) return;
      setRows(res.data.reviews || []);
      setTotal(res.data.total || 0);
      setUnreplied(res.data.unreplied || 0);
    } catch (error: any) {
      if (reqId !== reqIdRef.current) return;
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Something went wrong"
          : "Unexpected error occurred",
      );
    } finally {
      if (reqId === reqIdRef.current) setLoading(false);
    }
  }, [filter, pagination.page, pagination.rows]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const openReply = (r: ReviewRow) => {
    setTarget(r);
    setText(r.reply?.text ?? "");
  };

  const closeReply = () => {
    setTarget(null);
    setText("");
  };

  const saveReply = async () => {
    if (!target) return;
    const value = text.trim();
    if (!value) return toast.error("Reply cannot be empty");
    try {
      setSaving(true);
      await axiosInstance.post(
        `/api/product/${target.productId}/reviews/${target._id}/reply`,
        { text: value },
      );
      toast.success(target.reply ? "Reply updated" : "Reply sent");
      closeReply();
      fetchReviews();
      window.dispatchEvent(new Event("storeReviewsChanged"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save reply");
    } finally {
      setSaving(false);
    }
  };

  const deleteReply = (r: ReviewRow) => {
    confirmDialog({
      message: "Delete your reply to this review?",
      header: "Delete Reply",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          await axiosInstance.delete(
            `/api/product/${r.productId}/reviews/${r._id}/reply`,
          );
          toast.success("Reply deleted");
          fetchReviews();
          window.dispatchEvent(new Event("storeReviewsChanged"));
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Delete failed");
        }
      },
    });
  };

  return (
    <div className="w-full pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4">
        {/* Header */}
        <div
          className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg"
          style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
        >
          <div>
            <h2 className="text-base font-semibold text-white">
              Product Reviews
            </h2>
            <p className="text-xs text-blue-100">
              {unreplied} review{unreplied === 1 ? "" : "s"} waiting for your
              reply
            </p>
          </div>
          <Button
            label="Refresh"
            icon="pi pi-refresh"
            onClick={fetchReviews}
            loading={loading}
            style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid #93c5fd",
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-3 px-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => changeFilter(f.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
                filter === f.key
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              {f.label}
              {f.key === "unreplied" && unreplied > 0 && (
                <span className="ml-1.5 rounded-full bg-red-500 px-1.5 text-[11px] text-white">
                  {unreplied}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className={`mt-3 space-y-3 p-1 ${loading ? "opacity-60" : ""}`}>
          {!loading && rows.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">⭐</div>
              <p className="text-gray-600 font-semibold">No reviews found</p>
              <p className="text-gray-400 text-sm">
                Customer reviews will appear here.
              </p>
            </div>
          )}

          {rows.map((r) => (
            <div
              key={r._id}
              className="rounded-xl border border-blue-100 p-3 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-blue-50 pb-2">
                {r.productImage ? (
                  <img
                    src={r.productImage}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                    <i className="pi pi-image" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {r.productName}
                  </p>
                  <p className="text-xs text-gray-500">{r.productCode}</p>
                </div>
                {!r.reply?.text && (
                  <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 whitespace-nowrap">
                    Needs reply
                  </span>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sm font-semibold text-gray-800">
                  {r.user?.name || "Customer"}
                </span>
                <Stars value={r.rating} />
                <b className="text-sm text-gray-700">{r.rating.toFixed(1)}</b>
                <span className="text-xs text-gray-500">
                  {formatDate(r.createdAt)}
                </span>
              </div>

              {r.comment && (
                <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">
                  {r.comment}
                </p>
              )}
              {r.image && (
                <a href={r.image} target="_blank" rel="noreferrer">
                  <img
                    src={r.image}
                    alt="Review"
                    className="mt-2 h-20 w-20 rounded-lg object-cover border border-gray-200"
                  />
                </a>
              )}

              {r.reply?.text && (
                <div className="mt-3 rounded-lg border-l-4 border-blue-500 bg-blue-50/60 p-2.5">
                  <p className="text-xs font-semibold text-blue-800">
                    Your reply
                    {r.reply.repliedAt && (
                      <span className="font-normal text-gray-500">
                        {" "}
                        · {formatDate(r.reply.repliedAt)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                    {r.reply.text}
                  </p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button
                  size="small"
                  icon={r.reply?.text ? "pi pi-pencil" : "pi pi-reply"}
                  label={r.reply?.text ? "Edit reply" : "Reply"}
                  onClick={() => openReply(r)}
                  style={{
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    border: "1px solid #bfdbfe",
                  }}
                />
                {r.reply?.text && (
                  <Button
                    size="small"
                    icon="pi pi-trash"
                    label="Delete reply"
                    severity="danger"
                    outlined
                    onClick={() => deleteReply(r)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {total > 0 && (
          <Paginator
            first={(pagination.page - 1) * pagination.rows}
            rows={pagination.rows}
            totalRecords={total}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(e) =>
              setPagination({ page: (e.page ?? 0) + 1, rows: e.rows })
            }
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            className="mt-3"
          />
        )}

        {/* Reply dialog */}
        <Dialog
          header={target?.reply?.text ? "Edit Reply" : "Reply to Review"}
          visible={!!target}
          style={{ width: "min(96vw, 560px)" }}
          onHide={closeReply}
          draggable={false}
        >
          {target && (
            <div className="space-y-3">
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-2.5">
                <div className="flex items-center gap-2">
                  <Stars value={target.rating} />
                  <span className="text-xs text-gray-500">
                    {target.user?.name || "Customer"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">
                  {target.comment || "(No written comment)"}
                </p>
              </div>

              <InputTextarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                maxLength={1000}
                autoFocus
                className="w-full"
                placeholder="Write a polite, helpful reply. Customers will see it publicly."
              />
              <p className="text-right text-[11px] text-gray-400">
                {text.length}/1000
              </p>

              <div className="flex gap-2 justify-end">
                <Button
                  label="Cancel"
                  outlined
                  onClick={closeReply}
                  disabled={saving}
                />
                <Button
                  label={target.reply?.text ? "Update reply" : "Send reply"}
                  icon="pi pi-send"
                  onClick={saveReply}
                  loading={saving}
                />
              </div>
            </div>
          )}
        </Dialog>

        <ConfirmDialog />
        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}