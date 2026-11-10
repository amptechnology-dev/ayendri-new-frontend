import { shopApi } from "../auth";

const KEY = "ayendri:pendingPay";

export type PendingPay = {
  source: "CART" | "BUY_NOW";
  sessionIds: string[]; // one session per store, paid one after another
  buyNow?: {
    productId: string;
    variantId: string | null;
    quantity: number;
    bookingDate?: string;
  };
};

export const loadPending = (): PendingPay | null => {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
export const savePending = (p: PendingPay) => {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch {}
};
export const clearPending = () => {
  try { sessionStorage.removeItem(KEY); } catch {}
};

const unwrap = (v: any) => (v?.data && !Array.isArray(v.data) ? v.data : v);

export async function startSessionPayment(sessionId: string) {
  const res = await shopApi.post(
    `/payment/session/initiate/${encodeURIComponent(sessionId)}`,
    {},
  );
  const d = unwrap(res.data);
    console.log("INITIATE RESPONSE", d);
  if (!d?.paymentUrl || !d?.payuParams)
    throw new Error(d?.message || "Unable to start payment.");
  submitPayUPayment(d.paymentUrl, d.payuParams);
}

export async function verifySession(sessionId: string) {
  const res = await shopApi.get(
    `/payment/session/verify/${encodeURIComponent(sessionId)}`,
  );
  return unwrap(res.data) as {
    status: "PENDING" | "PAID" | "EXPIRED" | "REFUND_REQUIRED";
    order: any | null;
    session: any;
  };
}

// Order Now failed -> put the product in the cart.
// TODO: replace the body with your existing add-to-cart call from cart-api.
export async function moveBuyNowToCart(item: NonNullable<PendingPay["buyNow"]>) {
  await shopApi.post("/api/cart/add", item);
}

export function submitPayUPayment(
  paymentUrl: string,
  payuParams: Record<string, string>,
) {
  if (!paymentUrl || !/^https?:\/\//i.test(paymentUrl)) {
    throw new Error("Invalid payment gateway URL.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = paymentUrl;
  form.style.display = "none";

  for (const [key, value] of Object.entries(payuParams)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}