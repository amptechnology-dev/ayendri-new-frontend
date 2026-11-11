"use client";
import axiosInstance from "@/service/axios.service";
import type { BankDetails } from "./order-requests";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type ActionKind = "CANCEL" | "RETURN" | "REPLACE" | "REFUND";

export const ACTION_LABEL: Record<ActionKind, string> = {
  CANCEL: "Cancel",
  RETURN: "Return",
  REPLACE: "Replace",
  REFUND: "Refund",
};

export const CANCEL_REASONS = [
  "Ordered by mistake",
  "Found a better price",
  "Delivery is too late",
  "Want to change the product or address",
  "Changed my mind",
  "Other",
];

export const LATE_REASON = "Product was delivered late";

export const REQUEST_REASONS = [
  "Product is defective",
  "Product is damaged or deficient",
  "Wrong product delivered",
  "Product is counterfeit or spurious",
  "Product materially differs from its advertised or agreed description",
  LATE_REASON,
];

// the backend only accepts its own codes, so unmatched reasons go as OTHER
export const REASON_CODE: Record<string, string> = {
  "Product is defective": "QUALITY_ISSUE",
  "Product is damaged or deficient": "PRODUCT_DAMAGE",
  "Wrong product delivered": "WRONG_PRODUCT",
  "Product materially differs from its advertised or agreed description":
    "NOT_AS_DESCRIBED",
};

// proof limits (same as the backend)
export const EVIDENCE_MAX_FILES = 5;
export const EVIDENCE_IMAGE_MB = 5;
export const EVIDENCE_VIDEO_MB = 100;

// Same endpoint and body as the app's api.cancelOrder (PATCH)
export async function cancelOrderItem(
  orderId: string,
  reason: string,
  line: { itemId?: string; productId?: string; bankDetails?: BankDetails },
) {
  const res = await axiosInstance.patch(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/cancel`,
    {
      reason,
      ...(line.itemId ? { itemId: line.itemId } : {}),
      ...(line.productId ? { productId: line.productId } : {}),
      ...(line.bankDetails ? { bankDetails: line.bankDetails } : {}),
    },
    noCreds,
  );
  return res.data;
}

// Whole-order cancel. Backend decides the rules (cancelInfo) and creates the refund request itself.
export async function cancelMyOrder(
  orderId: string,
  reason: string,
  bankDetails?: BankDetails,
) {
  const res = await axiosInstance.patch(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/cancel`,
    {
      reason,
      ...(bankDetails ? { bankDetails } : {}),
    },
    noCreds,
  );
  return res.data; // { message, order, refundRequestId? }
}

// Same endpoint as your existing order-requests.ts createOrderRequest, with the app's body
export async function createItemRequest(
  orderId: string,
  payload: {
    type: "RETURN" | "REPLACE" | "REFUND";
    reasonCode: string;
    reason: string;
    itemId?: string;
    productId?: string;
    bankDetails?: BankDetails;
    files?: File[];
  },
) {
  const fd = new FormData();
  fd.append("type", payload.type);
  fd.append("reasonCode", payload.reasonCode);
  fd.append("reason", payload.reason);
  if (payload.itemId) fd.append("itemId", payload.itemId);
  if (payload.productId) fd.append("productId", payload.productId);
  if (payload.bankDetails)
    fd.append("bankDetails", JSON.stringify(payload.bankDetails));
  (payload.files ?? []).forEach((f, i) => fd.append(`evidence${i + 1}`, f));

  const res = await axiosInstance.post(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/requests`,
    fd,
    { ...noCreds, headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data?.data ?? res.data;
}

export const actionError = (e: any, fallback = "Something went wrong. Please try again.") =>
  e?.response?.data?.errors?.[0]?.message ?? e?.response?.data?.message ?? e?.message ?? fallback;



// ASSUMPTION: endpoint and body key. Confirm with the backend.
export async function rescheduleMyOrder(orderId: string, bookingDate: string) {
  const res = await axiosInstance.patch(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/reschedule`,
    { bookingDate },
    noCreds,
  );
  return res.data; // { message, order }
}