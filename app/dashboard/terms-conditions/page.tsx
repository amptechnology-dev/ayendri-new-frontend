"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputSwitch } from "primereact/inputswitch";
import { formatDate } from "@/helper/DateTime";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import TermsForm from "@/components/terms/TermsForm";

// ─── Types ────────────────────────────────────────────────────────────────────

type TermsRow = {
  _id: string;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
    <div className="text-6xl mb-4">📜</div>
    <h2 className="text-xl font-semibold text-gray-700">
      No Terms & Conditions Found
    </h2>
    <p className="text-gray-500 mt-2 max-w-md">
      Click "Add Terms" to create your first section.
    </p>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
function Page() {
  const [termsData, setTermsData] = useState<TermsRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editTermsId, setEditTermsId] = useState<string | null>(null);
  const [previewTerms, setPreviewTerms] = useState<TermsRow | null>(null);
  const [togglingIds, setTogglingIds] = useState<string[]>([]);

  // ── Fetch (silent = true hole table spinner dekhabe na) ───────────────────
  const termsDataGet = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await axiosInstance.get("/api/terms-conditions/all", {
        params: { page: 1, limit: 50 },
      });
      setTermsData(res.data.terms || []);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "Something went wrong");
      } else {
        toast.error("Unexpected error occurred");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (rowData: TermsRow) => {
    confirmDialog({
      message: `Are you sure you want to delete "${rowData.title}"?`,
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const res = await axiosInstance.delete(
            `/api/terms-conditions/delete/${rowData._id}`,
          );
          toast.success(res.data.message || "Deleted successfully");
          termsDataGet();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Delete failed");
        }
      },
    });
  };

  // ── Quick active toggle ────────────────────────────────────────────────────
  const setRowActive = (id: string, value: boolean) =>
    setTermsData((prev) =>
      prev.map((t) => (t._id === id ? { ...t, isActive: value } : t)),
    );

  const handleToggle = async (id: string, next: boolean) => {
    if (togglingIds.includes(id)) return;

    setTogglingIds((prev) => [...prev, id]);
    setRowActive(id, next); // optimistic update

    try {
      await axiosInstance.post("/api/terms-conditions/upsert", {
        id,
        isActive: next,
      });

      toast.success(next ? "Activated" : "Deactivated");
      await termsDataGet(true); // DB theke shotti value sync
    } catch (err: any) {
      setRowActive(id, !next); // rollback
      toast.error(err?.response?.data?.message || "Status update failed");
    } finally {
      setTogglingIds((prev) => prev.filter((x) => x !== id));
    }
  };

  useEffect(() => {
    termsDataGet();
  }, []);

  // ── Column Templates ───────────────────────────────────────────────────────
  const statusTemplate = (rowData: TermsRow) => (
    <div className="flex items-center gap-2">
      <InputSwitch
        checked={rowData.isActive}
        disabled={togglingIds.includes(rowData._id)}
        onChange={(e) => handleToggle(rowData._id, !!e.value)}
        className="[&.p-inputswitch-checked_.p-inputswitch-slider]:!bg-blue-600 [&.p-inputswitch-checked:hover_.p-inputswitch-slider]:!bg-blue-700"
      />
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
          rowData.isActive
            ? "bg-green-100 text-green-800"
            : "bg-red-100 text-red-800"
        }`}
      >
        {rowData.isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );

  // ── Table Header ───────────────────────────────────────────────────────────
  const header = (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded-lg"
      style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
    >
      <div className="min-w-0">
        <h2 className="text-sm sm:text-base font-semibold text-white">
          Terms & Conditions
        </h2>
        <p className="text-xs text-blue-100">
          {termsData.length} section{termsData.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 items-stretch sm:items-center w-full sm:w-auto">
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          onClick={() => termsDataGet()}
          loading={loading}
          className="w-full sm:w-auto"
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid #93c5fd",
          }}
        />
        <Button
          label="Add Terms"
          icon="pi pi-plus"
          onClick={() => {
            setEditTermsId(null);
            setVisible(true);
          }}
          className="w-full sm:w-auto"
          style={{
            background: "#fff",
            color: "#1d4ed8",
            border: "1px solid #93c5fd",
          }}
        />
      </div>
    </div>
  );

  const closeForm = () => {
    setVisible(false);
    setEditTermsId(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full flex justify-start items-start pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4">
        {header}

        {termsData.length === 0 && !loading && <EmptyState />}

        {(termsData.length > 0 || loading) && (
          <div className="mt-3 overflow-hidden rounded-lg border border-blue-100">
            <DataTable
              value={termsData}
              loading={loading}
              stripedRows
              paginator
              rows={10}
              rowsPerPageOptions={[10, 20, 50]}
              scrollable
              scrollHeight="flex"
              className="p-datatable-sm"
              emptyMessage="No terms & conditions found"
              dataKey="_id"
              tableStyle={{ minWidth: "800px" }}
            >
              <Column
                header="#"
                body={(_, options) => options.rowIndex + 1}
                style={{ width: "55px" }}
              />
              <Column
                field="title"
                header="Title"
                body={(rowData: TermsRow) => (
                  <span className="text-sm font-semibold text-gray-800">
                    {rowData.title}
                  </span>
                )}
                style={{ minWidth: "220px" }}
              />
              <Column
                field="order"
                header="Order"
                sortable
                style={{ width: "90px" }}
              />
              <Column
                header="Status"
                body={statusTemplate}
                style={{ minWidth: "170px" }}
              />
              <Column
                field="createdAt"
                header="Created"
                sortable
                body={(rowData: TermsRow) => (
                  <span className="text-sm text-gray-500">
                    {formatDate(rowData.createdAt || "")}
                  </span>
                )}
                style={{ width: "150px" }}
              />
              <Column
                header="Actions"
                style={{ width: "260px" }}
                body={(rowData: TermsRow) => (
                  <div className="flex gap-2">
                    <Button
                      icon="pi pi-eye"
                      label="View"
                      onClick={() => setPreviewTerms(rowData)}
                      style={{
                        background: "#f0fdf4",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                        padding: "4px 10px",
                        fontSize: "12px",
                      }}
                    />
                    <Button
                      icon="pi pi-pencil"
                      label="Edit"
                      onClick={() => {
                        setEditTermsId(rowData._id);
                        setVisible(true);
                      }}
                      style={{
                        background: "#eff6ff",
                        color: "#1d4ed8",
                        border: "1px solid #bfdbfe",
                        padding: "4px 10px",
                        fontSize: "12px",
                      }}
                    />
                    <Button
                      icon="pi pi-trash"
                      label="Delete"
                      severity="danger"
                      style={{ padding: "4px 10px", fontSize: "12px" }}
                      onClick={() => handleDelete(rowData)}
                    />
                  </div>
                )}
              />
            </DataTable>
          </div>
        )}

        {/* ── Add / Edit Dialog ── */}
        <Dialog
          header={
            <div className="flex items-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 mb-2 p-3 rounded-t-lg">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <i className="pi pi-file-edit text-white text-xl" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editTermsId ? "Edit Terms" : "Add New Terms"}
                </h2>
                <p className="text-sm text-white/90">
                  {editTermsId
                    ? "Update title, description or status"
                    : "Add a title and formatted description"}
                </p>
              </div>
            </div>
          }
          visible={visible}
          style={{ width: "min(95vw, 720px)" }}
          contentStyle={{ maxHeight: "85vh", overflow: "auto" }}
          onHide={closeForm}
          closable={false}
          dismissableMask={false}
          draggable={false}
        >
          <TermsForm
            termsId={editTermsId}
            onClose={closeForm}
            onSuccess={() => {
              termsDataGet();
              closeForm();
            }}
          />
        </Dialog>

        {/* ── Preview Dialog ── */}
        <Dialog
          header={previewTerms?.title || "Preview"}
          visible={!!previewTerms}
          style={{ width: "min(95vw, 720px)" }}
          onHide={() => setPreviewTerms(null)}
          dismissableMask
          draggable={false}
        >
          {previewTerms && (
            <div
              className="terms-content"
              // backend e sanitize kora, tai safe
              dangerouslySetInnerHTML={{ __html: previewTerms.description }}
            />
          )}
        </Dialog>

        <ConfirmDialog />
        <ToastContainer position="top-right" />
      </div>

      {/* Tailwind preflight list style reset kore, tai bullet/number ferot anlam */}
      <style jsx global>{`
        .terms-content {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #374151;
          word-break: break-word;
        }
        .terms-content p {
          margin-bottom: 0.6rem;
        }
        .terms-content strong,
        .terms-content b {
          font-weight: 700;
          color: #111827;
        }
        .terms-content em,
        .terms-content i {
          font-style: italic;
        }
        .terms-content u {
          text-decoration: underline;
        }
        .terms-content h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0.9rem 0 0.4rem;
          color: #1d4ed8;
        }
        .terms-content h3 {
          font-size: 1rem;
          font-weight: 600;
          margin: 0.7rem 0 0.35rem;
          color: #1e40af;
        }
        .terms-content ul {
          list-style: disc;
          padding-left: 1.4rem;
          margin-bottom: 0.6rem;
        }
        .terms-content ol {
          list-style: decimal;
          padding-left: 1.4rem;
          margin-bottom: 0.6rem;
        }
        .terms-content li {
          margin-bottom: 0.25rem;
        }
        .terms-content a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}

export default Page;