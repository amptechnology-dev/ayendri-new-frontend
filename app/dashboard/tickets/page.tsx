"use client";

import React, { useEffect, useState } from "react";
import axiosInstance from "@/service/axios.service";
import { ToastContainer, toast } from "react-toastify";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { Button } from "primereact/button";
import OrderSummary, { OrderLite } from "@/components/chatbot/OrderSummary";

type Status = "open" | "in_progress" | "resolved" | "closed";
type Ticket = {
  _id: string;
  ticketNo: string;
  customerName: string;
  phoneNumber: string;
  subject: string;
  description: string;
  status: Status;
  resolution: string;
  createdAt: string;
  resolvedAt?: string | null;
  orderNumber?: string;
  orderId?: string | null;
};
type Msg = {
  _id: string;
  role: "user" | "assistant" | "store";
  content: string;
  createdAt: string;
};

const BASE = "/api/ticket/store";

const STATUS_OPTIONS = [
  { label: "Open", value: "open" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];
const FILTER_OPTIONS = [{ label: "All", value: "" }, ...STATUS_OPTIONS];

const statusStyle: Record<Status, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-200 text-gray-700",
};
const statusLabel = (s: Status) =>
  STATUS_OPTIONS.find((o) => o.value === s)?.label || s;

export default function TicketsPage() {
  const [rows, setRows] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, rows: 10, total: 0 });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    ticket: Ticket;
    messages: Msg[];
    order: OrderLite | null;
  } | null>(null);
  const [form, setForm] = useState<{ status: Status; resolution: string }>({
    status: "open",
    resolution: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, page: 1 }));
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(BASE, {
        params: {
          page: pagination.page,
          limit: pagination.rows,
          ...(search ? { search } : {}),
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      });
      setRows(res.data.tickets || []);
      setPagination((p) => ({ ...p, total: res.data.total || 0 }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.rows, search, statusFilter]);

  const openTicket = async (id: string) => {
    try {
      const res = await axiosInstance.get(`${BASE}/${id}`);
      setDetail({
        ticket: res.data.ticket,
        messages: res.data.messages || [],
        order: res.data.order || null,
      });
      setForm({
        status: res.data.ticket.status,
        resolution: res.data.ticket.resolution || "",
      });
      setOpenId(id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load ticket");
    }
  };

  const save = async () => {
    if (!openId || saving) return;
    setSaving(true);
    try {
      await axiosInstance.patch(`${BASE}/${openId}`, {
        status: form.status,
        resolution: form.resolution,
      });
      toast.success("Ticket updated");
      await openTicket(openId);
      fetchList();
      window.dispatchEvent(new Event("storeTicketsChanged")); // sidebar dot update
    } catch (err: any) {
      toast.error(
        err?.response?.data?.errors?.[0]?.message ||
          err?.response?.data?.message ||
          "Update failed",
      );
    } finally {
      setSaving(false);
    }
  };

  const close = () => {
    setOpenId(null);
    setDetail(null);
  };

  const t = detail?.ticket;

  return (
    <div className="w-full pt-2">
      <div className="w-full rounded-lg bg-white p-2 shadow sm:p-4">
        <div
          className="flex flex-col gap-2 rounded-lg p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3"
          style={{ background: "linear-gradient(120deg,#3b82f6,#1d4ed8)" }}
        >
          <div>
            <h2 className="text-sm font-semibold text-white sm:text-base">
              Support Tickets
            </h2>
            <p className="text-xs text-blue-100">
              Customer complaints raised from chat
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Dropdown
              value={statusFilter}
              options={FILTER_OPTIONS}
              onChange={(e) => {
                setStatusFilter(e.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="p-inputtext-sm"
            />
            <InputText
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search ticket / order / name / phone"
              className="p-inputtext-sm"
            />
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
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPage={(e) =>
            setPagination((p) => ({
              ...p,
              page: (e.page ?? 0) + 1,
              rows: e.rows ?? p.rows,
            }))
          }
          onRowClick={(e) => openTicket((e.data as Ticket)._id)}
          rowClassName={() => "cursor-pointer"}
          emptyMessage="No tickets yet"
          responsiveLayout="scroll"
          className="mt-3"
        >
          <Column header="Ticket" body={(r: Ticket) => <b>#{r.ticketNo}</b>} />
          <Column
            field="subject"
            header="Subject"
            style={{ minWidth: "14rem" }}
          />
          <Column
            header="Order"
            body={(r: Ticket) =>
              r.orderNumber ? (
                <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                  🛒 #{r.orderNumber}
                </span>
              ) : (
                <span className="text-xs text-gray-400">General</span>
              )
            }
          />
          <Column
            header="Customer"
            body={(r: Ticket) => (
              <div>
                <div className="text-sm">{r.customerName || "Customer"}</div>
                <div className="text-xs text-gray-500">{r.phoneNumber}</div>
              </div>
            )}
          />
          <Column
            header="Status"
            body={(r: Ticket) => (
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[r.status]}`}
              >
                {statusLabel(r.status)}
              </span>
            )}
          />
          <Column
            header="Raised"
            body={(r: Ticket) => new Date(r.createdAt).toLocaleString()}
          />
        </DataTable>

        <Dialog
          header={t ? `Ticket #${t.ticketNo}` : "Ticket"}
          visible={!!openId && !!t}
          style={{ width: "50vw" }}
          breakpoints={{ "960px": "75vw", "641px": "95vw" }}
          contentStyle={{ maxHeight: "80vh", overflow: "auto" }}
          onHide={close}
        >
          {t && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-gray-50 p-3">
                <p className="text-sm font-semibold text-gray-800">
                  {t.subject}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                  {t.description}
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  {t.customerName || "Customer"} · {t.phoneNumber}
                </p>
              </div>

              {detail?.order ? (
                <OrderSummary order={detail.order} />
              ) : (
                <p className="rounded-lg bg-gray-50 p-2 text-xs text-gray-500">
                  General ticket (no order linked)
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-[200px_1fr]">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <Dropdown
                    value={form.status}
                    options={STATUS_OPTIONS}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.value }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">
                    Solution (customer dekhbe)
                  </label>
                  <InputTextarea
                    className="w-full"
                    rows={3}
                    autoResize
                    maxLength={2000}
                    value={form.resolution}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, resolution: e.target.value }))
                    }
                    placeholder="Ki solution dile seta likho"
                  />
                </div>
              </div>

              <Button
                label={saving ? "Saving..." : "Save & notify customer"}
                icon={saving ? "pi pi-spin pi-spinner" : "pi pi-check"}
                onClick={save}
                disabled={saving}
                className="w-full"
              />

              <div>
                <p className="mb-2 text-sm font-semibold text-gray-700">
                  Chat history
                </p>
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border bg-gray-50 p-3">
                  {detail!.messages.map((m) => (
                    <div
                      key={m._id}
                      className={`flex ${m.role === "store" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-xl px-3 py-2 text-sm ${
                          m.role === "store"
                            ? "bg-blue-600 text-white"
                            : m.role === "assistant"
                              ? "border border-dashed border-gray-300 bg-gray-100 text-gray-600"
                              : "border bg-white text-gray-800"
                        }`}
                      >
                        <span className="mb-0.5 block text-[10px] font-semibold uppercase opacity-70">
                          {m.role === "store"
                            ? "Support"
                            : m.role === "assistant"
                              ? "Bot"
                              : "Customer"}
                        </span>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Dialog>

        <ToastContainer position="top-right" />
      </div>
    </div>
  );
}