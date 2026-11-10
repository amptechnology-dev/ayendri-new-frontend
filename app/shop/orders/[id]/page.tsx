"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText } from "lucide-react";
import { fetchMyOrder, fetchMyOrderRequests } from "../../api";
import { inr } from "../../data";
import {
  rawOrderItems,
  itemProductId,
  itemName,
  itemImage,
  itemQty,
} from "../../order-items";
import {
  ACTION_LABEL,
  REASON_CODE,
  cancelMyOrder,
  createItemRequest,
  type ActionKind,
} from "../../order-actions";
import type { BankDetails } from "../../order-requests";
import ReasonSheet from "../../components/ReasonSheet";

const HOUR = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR;

const unwrap = (v: any) => v?.data?.order ?? v?.order ?? v?.data ?? v;

const fmtDateTime = (v: unknown) => {
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      });
};
const fmtDate = (v: unknown) => {
  if (!v) return "";
  const d = new Date(String(v));
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const fmtDeadline = (v: unknown) => {
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  const t = d
    .toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    })
    .toUpperCase();
  const day = d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return `${t}, ${day}`; // "4:00 PM, 14 Nov"
};

const statusStyle = (status: string, cancelledBy?: string) => {
  switch (status) {
    case "CANCELLED":
      return {
        label:
          cancelledBy === "USER" ? "Cancelled by you" : "Rejected by store",
        cls: "bg-red-100 text-red-700",
      };
    case "DELIVERED":
      return { label: "Delivered", cls: "bg-green-100 text-green-700" };
    case "SHIPPED":
      return { label: "Shipped", cls: "bg-blue-100 text-blue-700" };
    case "CONFIRMED":
      return { label: "Approved", cls: "bg-green-100 text-green-700" };
    default:
      return { label: "Processing", cls: "bg-orange-100 text-orange-700" };
  }
};

export default function OrderDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [order, setOrder] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState<{ kind: ActionKind; item: any } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [orderResult, requestResult] = await Promise.all([
        fetchMyOrder(id),
        fetchMyOrderRequests(id).catch(() => []),
      ]);
      setOrder(unwrap(orderResult));
      setRequests(Array.isArray(requestResult) ? requestResult : []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
          "Unable to load this order. Please sign in and try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !order)
    return <p className="py-20 text-center">Loading order details...</p>;

  if (error && !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => void load()}
          className="mt-4 rounded-full border px-5 py-2 font-bold"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!order) return <p className="py-20 text-center">Order not found.</p>;

  const orderMongoId = String(order._id ?? id);
  const orderNo = String(order.orderNumber ?? order.orderId ?? order._id ?? id);
  const status = String(
    order.status ?? order.orderStatus ?? "PENDING",
  ).toUpperCase();
  const quoted = status === "PENDING" && order.priceStatus === "QUOTED";
  const st = quoted
    ? { label: "Price received", cls: "bg-blue-100 text-blue-700" }
    : statusStyle(status, order.cancelledBy);

  const items = rawOrderItems(order);
  const history: any[] = Array.isArray(order.statusHistory)
    ? order.statusHistory
    : [];
  const paid = String(order.paymentStatus ?? "").toUpperCase() === "PAID";

  const invoiceUrl =
    typeof order.invoiceUrl === "string" && order.invoiceUrl
      ? order.invoiceUrl
      : "";
  const invoiceNo =
    typeof order.invoiceNumber === "string" ? order.invoiceNumber : "";

  const shownTotal =
    Number(order.totalAmount) > 0
      ? Number(order.totalAmount)
      : Number(order.quote?.total ?? 0);
  const shownMrp =
    Number(order.totalMrp) > 0 ? Number(order.totalMrp) : shownTotal;

  const delivered = [...history]
    .reverse()
    .find((h) => h.status === "DELIVERED");
  const deliveredMs = new Date(delivered?.at ?? order.updatedAt).getTime();

  const bookingYmd = String(order.bookingDate ?? "").slice(0, 10);
  const bookingLabel = /^\d{4}-\d{2}-\d{2}$/.test(bookingYmd)
    ? fmtDate(new Date(`${bookingYmd}T00:00:00`))
    : "";

  // cancel rules now come from the backend
  const cancelInfo = order.cancelInfo as
    | {
        canCancel: boolean;
        message?: string | null;
        deadline?: string | null;
        requiresBankDetails?: boolean;
      }
    | undefined;
  // PRODUCT orders: once a courier shipment exists (AWB / status), no cancel
  const shipment = order.shipment as
    | { awb?: string | null; status?: string | null }
    | null
    | undefined;
  const shipmentStarted =
    !order.hasService &&
    (Boolean(shipment?.awb || shipment?.status) ||
      ["SHIPPED", "DELIVERED"].includes(status));
  const canCancel = cancelInfo?.canCancel === true && !shipmentStarted;
  const cancelNote = canCancel
    ? null
    : cancelInfo?.canCancel === false
      ? (cancelInfo.message ?? null)
      : shipmentStarted
        ? "Shipment has started for this order, so it can no longer be cancelled."
        : null;

  const canDo = (it: any, t: "RETURN" | "REPLACE" | "REFUND") => {
    const flag = {
      RETURN: "isReturnable",
      REPLACE: "isReplaceable",
      REFUND: "isRefundable",
    }[t];
    const days = {
      RETURN: "returnDays",
      REPLACE: "replaceDays",
      REFUND: "refundDays",
    }[t];
    if (status !== "DELIVERED" || it.productType === "SERVICE") return false;
    if (it[flag] !== true) return false;
    if (t === "REFUND" && !paid) return false;
    return (
      it[days] == null || Date.now() - deliveredMs <= Number(it[days]) * DAY_MS
    );
  };

    const submitAction = async (reason: string, bank?: BankDetails) => {
    if (!action) return;
    const { kind, item } = action;

    if (kind === "CANCEL") {
      try {
        const res = await cancelMyOrder(orderMongoId, reason, bank);
        setAction(null);
        await load();
        setNotice(res?.message ?? "Order cancelled.");
      } catch (e: any) {
        const status = e?.response?.status;
        const d = e?.response?.data;
        // blocked by rule (400 CANCEL_NOT_ALLOWED) or state changed / courier fail (409)
        if (d?.code === "CANCEL_NOT_ALLOWED" || status === 409) {
          setAction(null);
          await load(); // load() clears error, so set it after
          setError(d?.message ?? "Unable to cancel this order. Please try again.");
          return;
        }
        // reason / bankDetails validation: let the sheet show it
        throw new Error(
          d?.errors?.[0]?.message ?? d?.message ?? "Could not cancel. Please try again.",
        );
      }
      return;
    }

    const productId = item ? itemProductId(item) : undefined;
    const reasonCode = REASON_CODE[reason] ?? "OTHER";
    await createItemRequest(orderMongoId, {
      type: kind,
      reasonCode,
      reason: reasonCode === "OTHER" ? reason : "",
      itemId: item._id,
      productId,
      ...(bank ? { bankDetails: bank } : {}),
    });
    setAction(null);
    setNotice("Request sent. The store will review it and get back to you.");
    await load();
  };

  const addr = order.deliveryAddress ?? order.shippingAddress ?? order.address;
  const eta = fmtDate(order.expectedDeliveryDate);

  return (
    <div className="mx-auto max-w-[1240px] space-y-3 px-3 py-5 sm:space-y-4 sm:px-6 sm:py-8 lg:px-8">
      {/* header: full width */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="break-all text-xl font-black sm:text-2xl lg:text-3xl">
            #{orderNo}
          </h1>
          <p className="text-[11px] text-[#9a7a7a] sm:text-xs lg:text-sm">
            Placed {fmtDateTime(order.createdAt)}
            {order.storeName ? ` · ${order.storeName}` : ""}
          </p>
          {!!eta && status !== "CANCELLED" && status !== "DELIVERED" && (
            <p className="mt-2 inline-block rounded-full bg-[#fff1da] px-3 py-1 text-[11px] font-bold text-[#9b4326] sm:text-xs">
              Delivery by {eta}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold sm:px-3 sm:text-xs lg:text-sm ${st.cls}`}
        >
          {st.label}
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-green-50 p-3 text-sm text-green-800">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* two columns on desktop, stacked on tablet and mobile */}
      <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-6">
        {/* ---------- main column ---------- */}
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {!!bookingLabel && (
            <section className="shop-card flex items-center justify-between gap-3 p-3 text-sm sm:p-4">
              <span className="text-[#9a7a7a]">Booking date</span>
              <b>{bookingLabel}</b>
            </section>
          )}

          <section className="shop-card p-3.5 sm:p-5 lg:p-6">
            <h2 className="font-extrabold lg:text-lg">
              Items ({order.totalItems ?? items.length})
            </h2>

            {items.map((it, i) => {
              const productId = itemProductId(it);
              const image = itemImage(it);
              const name = itemName(it);
              const qty = itemQty(it);
              const variant = [it.color, it.size, it.weight, it.height]
                .filter(Boolean)
                .join(" · ");

              const myReqs = requests.filter((r: any) => {
                const rOrder = String(r.orderId?._id ?? r.orderId ?? "");
                const sameOrder = !rOrder || rOrder === orderMongoId;
                return (
                  sameOrder &&
                  (!r.itemId ||
                    r.itemId === it._id ||
                    String(r.productId) === productId)
                );
              });

              const itemCancelled = ["CANCELLED", "CANCELED"].includes(
                String(it.status ?? it.itemStatus ?? "").toUpperCase(),
              );
              const canAsk =
                myReqs.length === 0 && !itemCancelled && status !== "CANCELLED";

              const unit = it.offerPrice != null ? Number(it.offerPrice) : null;
              const line =
                it.lineTotal != null
                  ? Number(it.lineTotal)
                  : unit != null
                    ? unit * qty
                    : items.length === 1 && shownTotal > 0
                      ? shownTotal
                      : null;

              return (
                <div
                  key={it._id ?? `${productId}-${i}`}
                  className={
                    i > 0
                      ? "mt-3 border-t border-[#f3eae0] pt-3 sm:mt-4 sm:pt-4"
                      : "mt-3 sm:mt-4"
                  }
                >
                  <div className="flex items-start gap-2.5 sm:gap-3 lg:gap-4">
                    {(() => {
                      const box =
                        "relative block h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#fff7ec] sm:h-16 sm:w-16 lg:h-24 lg:w-24";
                      const pic = image ? (
                        <Image
                          src={image}
                          alt={name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : null;
                      return productId ? (
                        <Link
                          href={`/shop/product/${encodeURIComponent(productId)}`}
                          className={box}
                          aria-label={name}
                        >
                          {pic}
                        </Link>
                      ) : (
                        <div className={box}>{pic}</div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      {productId ? (
                        <Link
                          href={`/shop/product/${encodeURIComponent(productId)}`}
                          className="break-words text-sm font-bold hover:underline sm:text-base lg:text-lg"
                        >
                          {name}
                        </Link>
                      ) : (
                        <b className="break-words text-sm sm:text-base lg:text-lg">
                          {name}
                        </b>
                      )}
                      {!!variant && (
                        <p className="break-words text-[11px] text-[#9a7a7a] sm:text-xs lg:text-sm">
                          {variant}
                        </p>
                      )}
                      <p className="text-[11px] text-[#9a7a7a] sm:text-xs lg:text-sm">
                        {unit != null
                          ? `Qty ${qty} × ${inr(unit)}`
                          : `Qty ${qty} · Price pending`}
                      </p>
                    </div>
                    <b className="shrink-0 text-sm lg:text-base">
                      {line != null ? inr(line) : "—"}
                    </b>
                  </div>

                  {myReqs.map((r: any, k: number) => (
                    <p
                      key={k}
                      className="mt-2 text-xs font-semibold text-[#9a7a7a]"
                    >
                      {String(r.type ?? "Request")[0] +
                        String(r.type ?? "request")
                          .slice(1)
                          .toLowerCase()}{" "}
                      request · {String(r.status ?? "PENDING").toLowerCase()}
                    </p>
                  ))}

                  {/* ALL ACTIONS (return / replace / refund) DISABLED FOR NOW */}
                  {canAsk && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(["RETURN", "REPLACE", "REFUND"] as const)
                        // Refund only shows when it is actually available (paid + refundable)
                        .filter((t) => t !== "REFUND" || canDo(it, "REFUND"))
                        .map((t) => {
                          const ok = canDo(it, t);
                          const label = ACTION_LABEL[t].toLowerCase();
                          return (
                            <button
                              key={t}
                              onClick={() =>
                                ok
                                  ? setAction({ kind: t, item: it })
                                  : setNotice(
                                      status === "DELIVERED"
                                        ? `The ${label} window for this item has closed, or it is not eligible for a ${label}.`
                                        : `You can request a ${label} once the item is delivered.`,
                                    )
                              }
                              className={`rounded-full border border-[#e8cfa8] bg-[#fff4eb] px-3.5 py-1.5 text-xs font-bold text-[#9b4326] sm:px-4 ${
                                ok ? "" : "opacity-45"
                              }`}
                            >
                              {ACTION_LABEL[t]}
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
          </section>

                    {canCancel && (
            <div>
              <button
                onClick={() => setAction({ kind: "CANCEL", item: null })}
                className="w-full rounded-full border border-red-300 bg-red-50 py-3 text-sm font-bold text-red-600"
              >
                Cancel order
              </button>
              {!!cancelInfo?.deadline && (
                <p className="mt-1.5 text-center text-xs text-[#9a7a7a]">
                  Cancel by {fmtDeadline(cancelInfo.deadline)}
                </p>
              )}
            </div>
          )}
          {!canCancel &&
            ["PENDING", "CONFIRMED"].includes(status) &&
            !!cancelNote && (
              <p className="text-center text-xs font-semibold text-[#9a7a7a]">
                {cancelNote}
              </p>
            )}
        </div>

        {/* ---------- side column ---------- */}
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {addr && (
            <section className="shop-card p-3.5 text-sm sm:p-5">
              <h2 className="font-extrabold">Delivery address</h2>
              {typeof addr === "string" ? (
                <p className="mt-2 break-words">{addr}</p>
              ) : (
                <>
                  <p className="mt-2 break-words font-bold">
                    {[addr.fullName, addr.phone].filter(Boolean).join(" · ")}
                  </p>
                  <p className="break-words text-[#6b4a4a]">
                    {[addr.addressLine, addr.area].filter(Boolean).join(", ")}
                  </p>
                  <p className="text-[#6b4a4a]">
                    {[addr.city, addr.state].filter(Boolean).join(", ")}
                    {addr.pincode ? ` - ${addr.pincode}` : ""}
                  </p>
                </>
              )}
              {!!order.note && (
                <p className="mt-2 break-words text-xs text-[#9a7a7a]">
                  Note: {order.note}
                </p>
              )}
            </section>
          )}

          <section className="shop-card space-y-2 p-3.5 text-sm sm:p-5">
            <h2 className="font-extrabold">Payment</h2>
            <div className="flex justify-between gap-3">
              <span className="text-[#9a7a7a]">Total MRP</span>
              <span>{shownMrp > 0 ? inr(shownMrp) : "Price pending"}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between gap-3 text-green-700">
                <span>Discount</span>
                <span>-{inr(Number(order.discount))}</span>
              </div>
            )}
            <div className="flex justify-between gap-3 border-t border-[#f3eae0] pt-2 font-black">
              <span>Total</span>
              <span>{shownTotal > 0 ? inr(shownTotal) : "Price pending"}</span>
            </div>
            <p className="text-xs text-[#9a7a7a]">
              {order.paymentMethod === "COD"
                ? "Cash on Delivery"
                : order.paymentMethod}
              {order.paymentStatus
                ? ` · ${String(order.paymentStatus).toLowerCase()}`
                : ""}
            </p>

            {!!invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-full border border-[#a3161c] bg-white px-5 py-2.5 text-sm font-bold text-[#a3161c] transition hover:bg-[#a3161c] hover:text-white active:scale-95"
              >
                <FileText size={16} />
                Download invoice{invoiceNo ? ` · ${invoiceNo}` : ""}
              </a>
            )}
          </section>

          {history.length > 0 && (
            <section className="shop-card p-3.5 sm:p-5">
              <h2 className="font-extrabold">Order timeline</h2>
              <div className="mt-4">
                {[...history].reverse().map((h, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex w-3 flex-col items-center">
                      <span
                        className={`mt-1 h-3 w-3 rounded-full ${i === 0 ? "bg-[#e0622d]" : "bg-[#e5d5c5]"}`}
                      />
                      {i < arr.length - 1 && (
                        <span className="w-0.5 flex-1 bg-[#f3eae0]" />
                      )}
                    </div>
                    <div className="min-w-0 pb-4">
                      <p className="text-sm font-bold">
                        {statusStyle(h.status, order.cancelledBy).label}
                      </p>
                      <p className="text-xs text-[#9a7a7a]">
                        {fmtDateTime(h.at)}
                      </p>
                      {!!h.note && (
                        <p className="break-words text-xs text-[#9a7a7a]">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      <Link
        href="/shop/orders"
        className="block py-2 text-center text-sm font-bold text-[#9b4326]"
      >
        ← Back to orders
      </Link>

      {action && (
        <ReasonSheet
          kind={action.kind}
          itemName={action.item ? itemName(action.item) : "Entire order"}
          needsBank={
  action.kind === "CANCEL"
    ? !!cancelInfo?.requiresBankDetails
    : action.kind === "REFUND" || (action.kind === "RETURN" && paid)
}
          onClose={() => setAction(null)}
          onSubmit={submitAction}
        />
      )}
    </div>
  );
}
