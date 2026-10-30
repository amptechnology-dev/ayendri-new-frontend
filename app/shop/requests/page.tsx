"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/service/axios.service";
import { useAuth } from "../auth";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

type OrderRequest = {
  _id?: string;
  id?: string;
  orderId?: string | { _id?: string; orderNumber?: string };
  productId?: string | { name?: string; title?: string };
  type?: string;
  requestType?: string;
  status?: string;
  reason?: string;
  description?: string;
  createdAt?: string;
};

function unwrapRequests(payload: any): OrderRequest[] {
  const value = payload?.data ?? payload;

  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.requests)) return value.requests;
  if (Array.isArray(value?.data?.requests)) return value.data.requests;

  return [];
}

function formatDate(value?: string) {
  if (!value) return "Date unavailable";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function label(value?: string) {
  return (value || "UNKNOWN")
    .replace(/[_-]/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function OrderRequestsPage() {
  const token = useAuth((state) => state.token);
  const ready = useAuth((state) => state.ready);

  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    if (!ready) return;

    if (!token) {
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.get("/api/order/my-requests", noCreds);
      setRequests(unwrapRequests(response.data));
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load your order requests.",
      );
    } finally {
      setLoading(false);
    }
  }, [ready, token]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  if (!ready || loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16">
        <p className="text-center text-sm text-neutral-500">
          Loading your requests...
        </p>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Your order requests</h1>
        <p className="mt-3 text-neutral-500">
          Sign in to view your return, replacement, and refund requests.
        </p>
        <Link
          href="/shop/login"
          className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
        >
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
            My account
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Order requests</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Track your return, replacement, and refund requests.
          </p>
        </div>

        <Link
          href="/shop/orders"
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          View orders
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button
            onClick={() => void loadRequests()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {!error && requests.length === 0 ? (
        <section className="rounded-2xl border border-neutral-200 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No requests yet</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Any return, replacement, or refund requests you submit will appear
            here.
          </p>
          <Link
            href="/shop/orders"
            className="mt-6 inline-flex rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white"
          >
            View my orders
          </Link>
        </section>
      ) : (
        <div className="space-y-4">
          {requests.map((request, index) => {
            const requestId = String(
              request._id ?? request.id ?? `request-${index}`,
            );

            const rawOrderId =
              typeof request.orderId === "object"
                ? request.orderId?._id
                : request.orderId;

            const productName =
              typeof request.productId === "object"
                ? (request.productId?.name ?? request.productId?.title)
                : undefined;

            const requestType = request.requestType ?? request.type;

            return (
              <article
                key={requestId}
                className="rounded-2xl border border-neutral-200 p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">
                      Requested on {formatDate(request.createdAt)}
                    </p>

                    <h2 className="mt-2 text-lg font-semibold">
                      {label(requestType)}
                    </h2>

                    {productName && (
                      <p className="mt-1 text-sm text-neutral-600">
                        {productName}
                      </p>
                    )}

                    {rawOrderId && (
                      <p className="mt-2 break-all text-xs text-neutral-500">
                        Order: {String(rawOrderId)}
                      </p>
                    )}
                  </div>

                  <span className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium">
                    {label(request.status)}
                  </span>
                </div>

                {request.reason && (
                  <div className="mt-5 border-t border-neutral-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                      Reason
                    </p>
                    <p className="mt-1 text-sm">{request.reason}</p>
                  </div>
                )}

                {request.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-600">
                    {request.description}
                  </p>
                )}

                {rawOrderId && (
                  <Link
                    href={`/shop/orders/${encodeURIComponent(String(rawOrderId))}`}
                    className="mt-5 inline-flex text-sm font-medium underline underline-offset-4"
                  >
                    View order
                  </Link>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}