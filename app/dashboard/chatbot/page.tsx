"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import ChatbotFaqForm from "@/components/chatbot/ChatbotFaqForm";

export type FaqRow = {
  _id: string;
  question: string;
  answer: string;
  keywords: string[];
  isActive: boolean;
  storeId?: { _id?: string; storeName?: string } | string;
};

const ENDPOINT = "/api/chatbot";

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center text-center py-12">
    <div className="text-6xl mb-4">💬</div>
    <h2 className="text-xl font-semibold text-gray-700">No FAQ Added</h2>
    <p className="text-gray-500 mt-2 max-w-md">
      Add questions and keywords. When a customer message contains a keyword,
      the chatbot replies with your answer instantly.
    </p>
  </div>
);

function ChatbotPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FaqRow[]>([]);
  const [visible, setVisible] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, rows: 10, total: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [debouncedSearch]);

  useEffect(() => {
    fetchFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.rows, debouncedSearch]);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ENDPOINT, {
        params: {
          page: pagination.page,
          limit: pagination.rows,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
      });
      setRows(res.data.faqs || []);
      setPagination((p) => ({ ...p, total: res.data.total || 0 }));
    } catch (error: any) {
      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "Something went wrong"
          : "Unexpected error occurred",
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (row: FaqRow) => {
    confirmDialog({
      message: "Are you sure you want to delete this FAQ?",
      header: "Delete Confirmation",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const res = await axiosInstance.delete(`${ENDPOINT}/${row._id}`);
          toast.success(res.data.message || "FAQ deleted");
          fetchFaqs();
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Delete failed");
        }
      },
    });
  };

  const toggleActive = async (row: FaqRow) => {
    try {
      await axiosInstance.put(`${ENDPOINT}/${row._id}`, { isActive: !row.isActive });
      fetchFaqs();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Update failed");
    }
  };

  const keywordsBody = (row: FaqRow) => (
    <div className="flex flex-wrap gap-1">
      {row.keywords.map((k) => (
        <span key={k} className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100">
          {k}
        </span>
      ))}
    </div>
  );

  const statusBody = (row: FaqRow) => (
    <button
      type="button"
      onClick={() => toggleActive(row)}
      title="Click to toggle"
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        row.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}
    >
      {row.isActive ? "Active" : "Inactive"}
    </button>
  );

  const actionBody = (row: FaqRow) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-pencil"
        label="Edit"
        onClick={() => {
          setEditId(row._id);
          setVisible(true);
        }}
        style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
      />
      <Button icon="pi pi-trash" label="Delete" severity="danger" onClick={() => confirmDelete(row)} />
    </div>
  );

  const header = (
    <div
      className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center p-2 sm:p-3 rounded-lg"
      style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
    >
      <div>
        <h2 className="text-sm sm:text-base font-semibold text-white">Chatbot FAQs</h2>
        <p className="text-xs text-blue-100">Auto-replies for your store&apos;s customers</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <IconField iconPosition="left">
          <InputIcon className="pi pi-search" />
          <InputText
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search FAQ"
            className="p-inputtext-sm w-full"
          />
        </IconField>
        <Button
          label="Add FAQ"
          icon="pi pi-plus"
          onClick={() => {
            setEditId(null);
            setVisible(true);
          }}
          style={{ background: "#fff", color: "#1d4ed8", border: "1px solid #93c5fd" }}
        />
      </div>
    </div>
  );

  const closeDialog = () => {
    setVisible(false);
    setEditId(null);
  };

  return (
    <div className="w-full flex justify-start items-start pt-2">
      <div className="w-full bg-white rounded-lg shadow p-2 sm:p-4">
        {header}

        {rows.length === 0 && !loading ? (
          <EmptyState />
        ) : (
          <DataTable
            value={rows}
            lazy
            paginator
            first={(pagination.page - 1) * pagination.rows}
            rows={pagination.rows}
            totalRecords={pagination.total}
            loading={loading}
            rowsPerPageOptions={[5, 10, 25, 50]}
            onPage={(e) =>
              setPagination((p) => ({
                ...p,
                page: (e.page ?? 0) + 1,
                rows: e.rows ?? p.rows,
              }))
            }
            responsiveLayout="scroll"
          >
            <Column field="question" header="Question" style={{ minWidth: "14rem" }} />
            <Column header="Keywords" body={keywordsBody} style={{ minWidth: "12rem" }} />
            <Column
              header="Store"
              body={(r: FaqRow) =>
                typeof r.storeId === "object" ? r.storeId?.storeName || "-" : "-"
              }
            />
            <Column header="Status" body={statusBody} />
            <Column header="Actions" body={actionBody} />
          </DataTable>
        )}

        {visible && (
          <Dialog
            header={editId ? "Edit FAQ" : "Add FAQ"}
            visible={visible}
            style={{ width: "40vw" }}
            breakpoints={{ "960px": "75vw", "641px": "95vw" }}
            contentStyle={{ maxHeight: "85vh", overflow: "auto" }}
            onHide={closeDialog}
          >
            <ChatbotFaqForm
              faqId={editId}
              onClose={closeDialog}
              onSuccess={() => {
                fetchFaqs();
                closeDialog();
              }}
            />
          </Dialog>
        )}

        <ConfirmDialog />
        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}

export default ChatbotPage;