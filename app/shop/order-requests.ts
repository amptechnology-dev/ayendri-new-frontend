"use client";
import axiosInstance from "@/service/axios.service";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type RequestType = "RETURN" | "REPLACEMENT" | "REFUND";
export type BankDetails = {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
};
export type Policy = {
  returnable: boolean;
  replaceable: boolean;
  refundable: boolean;
  returnDays?: number;
  replacementDays?: number;
  refundDays?: number;
};
export type OrderRequest = {
  _id?: string;
  id?: string;
  orderId?: string;
  itemId?: string;
  productId?: string;
  type?: RequestType;
  requestType?: RequestType;
  status?: string;
  reason?: string;
  createdAt?: string;
  [key: string]: unknown;
};
type CreateRequestPayload = {
  type: RequestType;
  reason: string;
  itemId?: string;
  productId?: string;
  description?: string;
  bankDetails?: BankDetails;
};

export function isMadeFor(product: any): boolean {
  const text = [
    product?.name,
    product?.title,
    product?.categoryName,
    product?.category?.name,
    product?.productType,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return /custom|personalized|personalised|made.to.order|made for you/.test(
    text,
  );
}

export function productPolicy(product: any): Policy {
  const source = product?.returnPolicy ?? product?.policy ?? product ?? {};
  return {
    returnable: Boolean(
      source.returnable ??
        source.isReturnable ??
        product?.returnable ??
        product?.isReturnable,
    ),
    replaceable: Boolean(
      source.replaceable ??
        source.isReplaceable ??
        product?.replaceable ??
        product?.isReplaceable,
    ),
    refundable: Boolean(
      source.refundable ??
        source.isRefundable ??
        product?.refundable ??
        product?.isRefundable,
    ),
    returnDays:
      Number(source.returnDays ?? source.returnWindowDays) || undefined,
    replacementDays:
      Number(source.replacementDays ?? source.replaceWindowDays) || undefined,
    refundDays:
      Number(source.refundDays ?? source.refundWindowDays) || undefined,
  };
}

function withinDays(
  dateMs: number | null | undefined,
  days: number | undefined,
): boolean {
  if (!dateMs || !days) return false;
  const elapsed = Date.now() - dateMs;
  return elapsed >= 0 && elapsed <= days * 24 * 60 * 60 * 1000;
}

export function eligibleTypes({
  policy,
  madeFor,
  status,
  paid,
  deliveredAtMs,
  bookingDateMs,
}: {
  policy: Policy;
  madeFor: boolean;
  status: string;
  paid: boolean;
  deliveredAtMs?: number | null;
  bookingDateMs?: number | null;
}): RequestType[] {
  if (madeFor) return [];
  const normalizedStatus = status.toUpperCase();
  const delivered = normalizedStatus === "DELIVERED";
  const results: RequestType[] = [];
  if (
    delivered &&
    policy.returnable &&
    withinDays(deliveredAtMs, policy.returnDays)
  ) {
    results.push("RETURN");
  }
  if (
    delivered &&
    policy.replaceable &&
    withinDays(deliveredAtMs, policy.replacementDays)
  ) {
    results.push("REPLACEMENT");
  }
  if (
    paid &&
    policy.refundable &&
    (delivered
      ? withinDays(deliveredAtMs, policy.refundDays)
      : bookingDateMs
        ? bookingDateMs > Date.now()
        : ["PROCESSING", "PENDING", "APPROVED", "CONFIRMED"].includes(
            normalizedStatus,
          ))
  ) {
    results.push("REFUND");
  }
  return results;
}

export function validateBank(details: BankDetails): string | null {
  if (!details.accountHolderName.trim()) {
    return "Enter the account holder's name.";
  }
  if (!/^\d{8,20}$/.test(details.accountNumber.trim())) {
    return "Enter a valid bank account number.";
  }
  if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(details.ifscCode.trim())) {
    return "Enter a valid IFSC code.";
  }
  if (!details.bankName.trim()) {
    return "Enter the bank name.";
  }
  return null;
}

export async function createOrderRequest(
  orderId: string,
  payload: CreateRequestPayload,
) {
  const response = await axiosInstance.post(
    `/api/order/my-orders/${encodeURIComponent(orderId)}/requests`,
    payload,
    noCreds,
  );
  return response.data?.data ?? response.data;
}

export async function myRequests(orderId?: string): Promise<OrderRequest[]> {
  const response = await axiosInstance.get("/api/order/my-requests", {
    params: orderId ? { orderId } : undefined,
    ...noCreds,
  });
  const payload = response.data?.data ?? response.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.data?.requests)) return payload.data.requests;
  return [];
}