"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import axiosInstance from "@/service/axios.service";
import { toast, ToastContainer } from "react-toastify";
import { DataTable, DataTableExpandedRows } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { formatDate } from "@/helper/DateTime";
import { money, cleanParams } from "@/types/paymentReport";

const BASE = "/api/order/store-requests";
const META_URL = "/api/payment/report/meta";

type Role = "ADMIN" | "STORE";
type RequestType = "RETURN" | "REPLACE" | "REFUND";
type RequestStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

type RequestRow = {
  _id: string;
  requestNumber: string;
  orderId: string;
  orderNumber?: string;
  storeId?: string;
  storeName?: string | null;
  storeUniqueId?: string | null;
  itemName?: string;
  itemImage?: string | null;
  quantity: number;
  type: RequestType;
  source: "CUSTOMER" | "ORDER_CANCEL";
  status: RequestStatus;
  reason: string;
  refundAmount: number;
  bankDetails?: {
    accountHolder?: string;
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
    upiId?: string;
  } | null;
  storeNote?: string | null;
  referenceNo?: string | null;
  completeNote?: string | null;
  decidedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
};

const TYPE_LABEL: Record<RequestType, string> = {
  RETURN: "Return",
  REPLACE: "Replacement",
  REFUND: "Refund",
};

const STATUS_STYLES: Record<RequestStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-800",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  REQUESTED: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  COMPLETED: "Completed",
};

const STATUS_TABS: { label: string; value: "" | RequestStatus }[] = [
  { label: "Pending", value: "REQUESTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "All", value: "" },
];

const selectCls =
  "p-inputtext-sm border rounded-md px-2 py-1.5 bg-white text-sm";

const safeDate = (d?: string | null) => (d ? formatDate(d) : "-");

const showError = (error: any) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    toast.error(
      data?.errors?.[0]?.message || data?.message || "Something went wrong",
    );
  } else {
    toast.error("Unexpected error occurred");
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied");
  } catch {
    toast.error("Copy failed");
  }
};

const notifySidebar = () =>
  window.dispatchEvent(new Event("storeRequestsChanged"));

const EmptyState = ({ text }: { text: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-12">
    <div className="text-6xl mb-4">📦</div>
    <h2 className="text-xl font-semibold text-gray-700">No Requests</h2>
    <p className="text-gray-500 mt-2 max-w-md">{text}</p>
  </div>
);

function DetailRow({
  label,
  value,
  copy = false,
}: {
  label: string;
  value?: string | null;
  copy?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-800 text-right break-all flex items-center gap-1.5">
        {value}
        {copy && (
          <button
            type="button"
            title="Copy"
            onClick={() => copyText(value)}
            className="h-5 w-5 shrink-0 rounded hover:bg-gray-200 text-gray-500 flex items-center justify-center"
          >
            <i className="pi pi-copy text-[10px]" />
          </button>
        )}
      </span>
    </div>
  );
}

function RequestsPage() {
  const [role, setRole] = useState<Role | null>(null);
  const isAdmin = role === "ADMIN";

  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, rows: 10, total: 0 });
  const [status, setStatus] = useState<"" | RequestStatus>("REQUESTED");
  const [type, setType] = useState<"" | RequestType>("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<DataTableExpandedRows>({});
  const requestIdRef = useRef(0);

  // ---- reject / complete dialog (sudhu STORE) ----
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    mode: "REJECT" | "COMPLETE";
    row: RequestRow | null;
  }>({ visible: false, mode: "REJECT", row: null });
  const [note, setNote] = useState("");
  const [refNo, setRefNo] = useState("");
  const [error, setError] = useState("");

  // role load
  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get(META_URL);
        setRole(res.data.role);
      } catch (err) {
        showError(err);
      }
    })();
  }, []);

  // search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev !== next) setPagination((p) => ({ ...p, page: 1 }));
        return next;
      });
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      setLoading(true);
      const res = await axiosInstance.get(BASE, {
        params: cleanParams({
          page: pagination.page,
          limit: pagination.rows,
          status,
          type,
          search,
        }),
      });
      if (requestId !== requestIdRef.current) return;
      setRows(res.data.requests || []);
      setPagination((p) => ({ ...p, total: res.data.total ?? 0 }));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      showError(err);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [pagination.page, pagination.rows, status, type, search]);

  useEffect(() => {
    if (role) fetchData();
  }, [role, fetchData]);

  const changeStatus = (v: "" | RequestStatus) => {
    setStatus(v);
    setExpandedRows({});
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const changeType = (v: "" | RequestType) => {
    setType(v);
    setExpandedRows({});
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const act = async (id: string, path: "decision" | "complete", body: any) => {
    try {
      setBusyId(id);
      const res = await axiosInstance.patch(`${BASE}/${id}/${path}`, body);
      toast.success(res.data.message || "Updated");
      await fetchData();
      notifySidebar();
      return true;
    } catch (err) {
      showError(err);
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const openDialog = (mode: "REJECT" | "COMPLETE", row: RequestRow) => {
    setNote("");
    setRefNo("");
    setError("");
    setDialog({ visible: true, mode, row });
  };
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const submitDialog = async () => {
    const row = dialog.row;
    if (!row) return;
    const text = note.trim();

    if (dialog.mode === "REJECT" && text.length < 3) {
      setError("Reason is required (at least 3 characters)");
      return;
    }
    if (dialog.mode === "COMPLETE" && row.type === "REFUND" && !refNo.trim()) {
      setError("Payment reference (UTR / transaction ID) is required");
      return;
    }

    const ok =
      dialog.mode === "REJECT"
        ? await act(row._id, "decision", { action: "REJECT", note: text })
        : await act(row._id, "complete", {
            referenceNo: refNo.trim() || undefined,
            note: text || undefined,
          });
    if (ok) closeDialog();
  };

  const rowExpansion = (r: RequestRow) => (
    <div className="grid gap-3 sm:grid-cols-2 p-3 bg-gray-50/60">
      <div className="space-y-2">
        <p className="text-xs bg-white border border-gray-100 rounded-md p-2 text-gray-700">
          <span className="font-semibold">Customer reason:</span> {r.reason}
        </p>
        {r.storeNote && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Store note:</span> {r.storeNote}
          </p>
        )}
        {r.status === "COMPLETED" && (
          <p className="text-xs text-green-700">
            {r.referenceNo ? `Ref: ${r.referenceNo} • ` : ""}
            {r.completeNote || "Completed"}
            {r.completedAt ? ` • ${safeDate(r.completedAt)}` : ""}
          </p>
        )}
      </div>

      {r.type === "REFUND" && (
        <div className="space-y-1.5 bg-white border border-gray-100 rounded-md p-2">
          <p className="text-xs font-semibold text-gray-700">
            Refund to customer • {money(r.refundAmount)}
          </p>
          <DetailRow label="UPI ID" value={r.bankDetails?.upiId} copy={!isAdmin} />
          <DetailRow
            label="Account holder"
            value={r.bankDetails?.accountHolder}
          />
          <DetailRow
            label="Account number"
            value={r.bankDetails?.accountNumber}
            copy={!isAdmin}
          />
          <DetailRow label="IFSC" value={r.bankDetails?.ifsc} copy={!isAdmin} />
          <DetailRow label="Bank" value={r.bankDetails?.bankName} />
        </div>
      )}
    </div>
  );

  const dRow = dialog.row;

  return (
    <div className="w-full flex justify-start items-start pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4 space-y-3">
        {!role ? (
          <div className="flex justify-center items-center py-16">
            <i className="pi pi-spin pi-spinner text-3xl text-gray-400" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div
              className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded-lg"
              style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
            >
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-semibold text-white">
                  Returns & Refunds
                </h2>
                <p className="text-xs text-blue-100">
                  {isAdmin
                    ? "Return, replacement and refund requests across all stores (view only)"
                    : "Return, replacement and refund requests from your customers"}
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 border border-blue-100 rounded-lg p-2.5">
              <div className="flex flex-wrap gap-1.5">
                {STATUS_TABS.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => changeStatus(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      status === t.value
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <select
                value={type}
                onChange={(e) => changeType(e.target.value as "" | RequestType)}
                className={selectCls}
              >
                <option value="">All types</option>
                <option value="RETURN">Return</option>
                <option value="REPLACE">Replacement</option>
                <option value="REFUND">Refund</option>
              </select>

              <IconField iconPosition="left" className="w-full sm:w-64">
                <InputIcon className="pi pi-search" />
                <InputText
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Request #, order # or item"
                  className="p-inputtext-sm w-full"
                />
              </IconField>
            </div>

            {/* Table */}
            <DataTable
              value={rows}
              dataKey="_id"
              lazy
              paginator
              first={(pagination.page - 1) * pagination.rows}
              rows={pagination.rows}
              totalRecords={pagination.total}
              loading={loading}
              rowsPerPageOptions={[10, 25, 50]}
              onPage={(e) =>
                setPagination((prev) => ({
                  ...prev,
                  page: (e.page ?? 0) + 1,
                  rows: e.rows ?? prev.rows,
                }))
              }
              responsiveLayout="scroll"
              expandedRows={expandedRows}
              onRowToggle={(e) =>
                setExpandedRows(e.data as DataTableExpandedRows)
              }
              rowExpansionTemplate={rowExpansion}
              emptyMessage={
                <EmptyState text="No requests found for this filter." />
              }
            >
              <Column expander style={{ width: "3rem" }} />
              <Column
                header="Request"
                body={(r: RequestRow) => (
                  <div>
                    <p className="font-medium text-gray-800">
                      {r.requestNumber}
                    </p>
                    <p className="text-xs text-gray-500">
                      {safeDate(r.createdAt)}
                    </p>
                  </div>
                )}
              />
              {isAdmin && (
                <Column
                  header="Store"
                  body={(r: RequestRow) => (
                    <div>
                      <p className="font-medium text-gray-800">
                        {r.storeName || "-"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {r.storeUniqueId || ""}
                      </p>
                    </div>
                  )}
                />
              )}
              <Column
                header="Order"
                body={(r: RequestRow) =>
                  isAdmin ? (
                    <span className="font-medium text-gray-800">
                      #{r.orderNumber || "-"}
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/orders/${r.orderId}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      #{r.orderNumber || "-"}
                    </Link>
                  )
                }
              />
              <Column
                header="Item"
                body={(r: RequestRow) => (
                  <div className="min-w-[140px]">
                    <p className="text-sm text-gray-800 line-clamp-1">
                      {r.itemName || "-"}
                    </p>
                    {r.source === "ORDER_CANCEL" ? (
                      <p className="text-[11px] text-red-600">
                        Order cancelled
                      </p>
                    ) : (
                      <p className="text-[11px] text-gray-500">
                        Qty {r.quantity}
                      </p>
                    )}
                  </div>
                )}
              />
              <Column
                header="Type"
                body={(r: RequestRow) => TYPE_LABEL[r.type]}
              />
              <Column
                header="Refund amount"
                body={(r: RequestRow) =>
                  r.type === "REFUND" ? (
                    <span className="font-semibold text-gray-800">
                      {money(r.refundAmount)}
                    </span>
                  ) : (
                    "-"
                  )
                }
              />
              <Column
                header="Status"
                body={(r: RequestRow) => (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_STYLES[r.status]}`}
                  >
                    {STATUS_LABEL[r.status]}
                  </span>
                )}
              />
              {!isAdmin && (
                <Column
                  header="Actions"
                  headerStyle={{ width: "230px" }}
                  body={(r: RequestRow) => {
                    if (r.status === "REQUESTED") {
                      return (
                        <div className="flex gap-1.5">
                          <Button
                            label="Approve"
                            icon="pi pi-check"
                            size="small"
                            className="text-xs"
                            loading={busyId === r._id}
                            onClick={() =>
                              act(r._id, "decision", { action: "APPROVE" })
                            }
                          />
                          <Button
                            label="Reject"
                            icon="pi pi-times"
                            size="small"
                            severity="danger"
                            outlined
                            className="text-xs"
                            disabled={busyId === r._id}
                            onClick={() => openDialog("REJECT", r)}
                          />
                        </div>
                      );
                    }
                    if (r.status === "APPROVED") {
                      return (
                        <Button
                          label={
                            r.type === "REFUND"
                              ? "Mark refund as paid"
                              : "Mark as completed"
                          }
                          icon="pi pi-check-circle"
                          size="small"
                          className="text-xs"
                          loading={busyId === r._id}
                          onClick={() => openDialog("COMPLETE", r)}
                        />
                      );
                    }
                    return <span className="text-gray-400">-</span>;
                  }}
                />
              )}
            </DataTable>

            {/* Reject / complete dialog (STORE) */}
            <Dialog
              header={
                dialog.mode === "REJECT"
                  ? "Reject Request"
                  : dRow?.type === "REFUND"
                    ? "Confirm Refund Payment"
                    : "Complete Request"
              }
              visible={dialog.visible}
              style={{ width: "28rem", maxWidth: "95vw" }}
              onHide={closeDialog}
              draggable={false}
            >
              {dialog.mode === "COMPLETE" && dRow?.type === "REFUND" && (
                <div className="mb-3 space-y-2">
                  <p className="text-sm text-gray-600">
                    Pay <b>{money(dRow.refundAmount)}</b> to the customer, then
                    enter the payment reference.
                  </p>
                  <InputText
                    value={refNo}
                    onChange={(e) => {
                      setRefNo(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="UTR / transaction ID *"
                    className="w-full"
                  />
                </div>
              )}

              <InputTextarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (error) setError("");
                }}
                rows={3}
                maxLength={300}
                className={`w-full ${error && dialog.mode === "REJECT" ? "p-invalid" : ""}`}
                placeholder={
                  dialog.mode === "REJECT"
                    ? "Reason for rejecting (required, customer will see this)"
                    : "Note (optional)"
                }
              />
              {error && (
                <small className="text-red-500 flex items-center gap-1 mt-1">
                  <i className="pi pi-exclamation-circle"></i>
                  {error}
                </small>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <Button label="Back" text onClick={closeDialog} />
                <Button
                  label={dialog.mode === "REJECT" ? "Reject" : "Confirm"}
                  severity={dialog.mode === "REJECT" ? "danger" : undefined}
                  loading={busyId === dRow?._id}
                  onClick={submitDialog}
                />
              </div>
            </Dialog>
          </>
        )}

        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}

export default RequestsPage;