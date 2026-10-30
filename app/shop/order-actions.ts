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

export const REQUEST_REASONS = [
  "Damaged item",
  "Defective item",
  "Wrong item received",
  "Size / fit issue",
  "Other",
];

// same mapping as the app
export const REASON_CODE: Record<string, string> = {
  "Damaged item": "PRODUCT_DAMAGE",
  "Defective item": "QUALITY_ISSUE",
  "Wrong item received": "WRONG_PRODUCT",
  "Size / fit issue": "SIZE_MISMATCH",
};

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
  },
) {
  const res = await axiosInstance.post(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/requests`,
    payload,
    noCreds,
  );
  return res.data?.data ?? res.data;
}

export const actionError = (e: any, fallback = "Something went wrong. Please try again.") =>
  e?.response?.data?.errors?.[0]?.message ?? e?.response?.data?.message ?? e?.message ?? fallback;