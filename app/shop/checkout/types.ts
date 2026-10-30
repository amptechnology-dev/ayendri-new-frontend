export type CheckoutAddress = {
  fullName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type CheckoutPaymentMethod = "ONLINE" | "COD";

export type CheckoutPreviewPayload = {
  address: CheckoutAddress;
  paymentMethod: CheckoutPaymentMethod;
  remarks?: string;
  couponCode?: string;
};

export type CheckoutResult = {
  orderId: string;
  orderNumber?: string;
  amount?: number;
  paymentUrl?: string;
  paymentData?: Record<string, string>;
};

export function validateCheckoutAddress(
  address: CheckoutAddress,
): string | null {
  if (
    !address.fullName.trim() ||
    !address.phone.trim() ||
    !address.addressLine.trim() ||
    !address.city.trim() ||
    !address.state.trim() ||
    !address.pincode.trim()
  ) {
    return "Please complete all required delivery address fields.";
  }

  if (!/^\d{10}$/.test(address.phone.trim())) {
    return "Enter a valid 10-digit phone number.";
  }

  if (!/^\d{6}$/.test(address.pincode.trim())) {
    return "Enter a valid 6-digit Indian pincode.";
  }

  return null;
}