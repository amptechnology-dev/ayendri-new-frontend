"use client";
/* eslint-disable @next/next/no-img-element */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart, bill } from "../cart";
import { useAuth, errMsg, shopApi } from "../auth";
import { inr } from "../data";
import { submitPayUPayment } from "./payment";
import { getSavedAddresses, addSavedAddress, type SavedAddress } from "../addresses";
import OrderSuccessModal from "../components/order-success-modal";
import { imageUrl, tierPriceFor } from "../cart-api";

type AddressForm = {
  fullName: string;
  phone: string;
  addressLine: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  addressLine: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const toForm = (a: SavedAddress): AddressForm => ({
  fullName: a.fullName ?? "",
  phone: (a.phone ?? "").replace(/\D/g, "").slice(-10),
  addressLine: a.addressLine,
  area: a.area ?? "",
  city: a.city,
  state: a.state,
  pincode: a.pincode,
  country: a.country || "India",
});

function unwrapResponse(payload: any): any {
  let value = payload;

  for (let i = 0; i < 3; i++) {
    if (value?.data && !Array.isArray(value.data)) {
      value = value.data;
    } else {
      break;
    }
  }

  return value;
}

function extractOrderId(payload: any): string {
  const value = unwrapResponse(payload);

  const id =
    value?.order?._id ??
    value?.order?.id ??
    value?.data?.order?._id ??
    value?.data?.order?.id ??
    value?.orderId ??
    value?._id ??
    value?.id;

  return id ? String(id) : "";
}

function extractCreatedOrders(payload: any): { id: string; storeId: string }[] {
  const value = unwrapResponse(payload);
  const list = Array.isArray(value?.orders)
    ? value.orders
    : Array.isArray(value?.data?.orders)
      ? value.data.orders
      : [];
  return list
    .map((o: any) => ({
      id: String(o?._id ?? o?.id ?? ""),
      storeId: String(o?.storeId ?? ""),
    }))
    .filter((o: { id: string }) => o.id);
}

function extractCartDetails(payload: any) {
  const value = unwrapResponse(payload);
  const cart = value?.cart ?? value?.data?.cart ?? value;

  const cartId = value?.cartId ?? value?._id ?? cart?._id ?? cart?.id;

  const stores = Array.isArray(cart?.stores) ? cart.stores : [];

  const storeIds = [
    ...new Set(
      stores
        .map((entry: any) => {
          const store = entry?.store ?? entry?.storeId;
          return typeof store === "object"
            ? (store?._id ?? store?.id ?? store?.storeUniqueId)
            : store;
        })
        .filter(Boolean)
        .map(String),
    ),
  ] as string[];

  return {
    cartId: cartId ? String(cartId) : "",
    storeIds,
  };
}

// delivery charge + ETA er short label
const etaText = (o: any) =>
  `${inr(Number(o?.shippingCharge ?? 0))}${o?.etaLabel ? ` • ${o.etaLabel}` : ""}`;

// [FASTEST] ok:false store group gulor message ekshathe (duplicate bad dewa hoy)
const badMessage = (list: any[]) =>
  [...new Set(list.map((s) => s?.message || "Some items are not available"))].join(
    " ",
  );

export default function Checkout() {
  const cart = useCart();
  const { token, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ orderId: string; message: string } | null>(null);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const [selectedId, setSelectedId] = useState("new");
  const [redirecting, setRedirecting] = useState(false);

  // [FASTEST] user er choice + server theke asha preview
  const [fastest, setFastest] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(""); // pura preview fail
  const [unavailableMsg, setUnavailableMsg] = useState(""); // kichu item unavailable (preview tobuo thake)
  const previewReqRef = useRef(0);

  useEffect(() => setMounted(true), []);

  // load saved addresses and prefill the default one
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    getSavedAddresses({ fullName: user?.name, phone: user?.phone })
      .then((list) => {
        if (cancelled) return;
        setSaved(list);
        if (list[0]?._id) {
          setSelectedId(list[0]._id);
          setAddress(toForm(list[0]));
        } else {
          setAddress((p) => ({
            ...p,
            fullName: p.fullName || user?.name || "",
            phone: p.phone || (user?.phone ?? "").replace(/\D/g, "").slice(-10),
          }));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // [FASTEST] pincode / state / payment / toggle bodlale preview abar ane
  const pin = address.pincode.trim();
  const stateName = address.state.trim();
  const cartCount = cart.items.length;

  useEffect(() => {
    if (!token || cartCount === 0) return;

    if (!/^\d{6}$/.test(pin) || !stateName) {
      previewReqRef.current += 1; // purono response ignore
      setPreview(null);
      setPreviewError("");
      setUnavailableMsg("");
      setPreviewLoading(false);
      return;
    }

    const reqId = ++previewReqRef.current;
    setPreviewLoading(true);
    setPreviewError("");

    const timer = setTimeout(async () => {
      try {
        const cartResponse = await shopApi.get("/api/cart/");
        const { cartId, storeIds } = extractCartDetails(cartResponse.data);
        if (!cartId || !storeIds.length) throw new Error("Cart could not be loaded.");

        const res = await shopApi.post("/order/checkout-preview", {
          cartId,
          storeIds,
          paymentMethod: cart.payment,
          fastestDelivery: fastest,
          deliveryAddress: {
            pincode: pin,
            state: stateName,
            country: address.country,
          },
        });
        if (reqId !== previewReqRef.current) return;

        const data = unwrapResponse(res.data);
        const groups: any[] = Array.isArray(data?.stores) ? data.stores : [];
        const bad = groups.filter((s) => s.ok === false);
        const good = groups.filter((s) => s.ok !== false);

        if (data?.success === false || (groups.length > 0 && good.length === 0)) {
          // [FASTEST] ekta group-o ok na hole-i tokhon pura preview fail
          setPreview(null);
          setUnavailableMsg("");
          setPreviewError(
            bad.length
              ? badMessage(bad)
              : data?.message || "Could not calculate delivery charge.",
          );
        } else {
          // [FASTEST] kichu group bad holeo baki data diye preview rakho,
          // jate toggle ar bill thik thake. Bad item er jonno shudhu warning.
          setPreview(data);
          setUnavailableMsg(bad.length ? badMessage(bad) : "");
        }
      } catch (e) {
        if (reqId !== previewReqRef.current) return;
        setPreview(null);
        setUnavailableMsg("");
        setPreviewError(errMsg(e, "Could not calculate delivery charge."));
      } finally {
        if (reqId === previewReqRef.current) setPreviewLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [token, cartCount, pin, stateName, address.country, cart.payment, fastest]);

  // [FASTEST] preview ashar por jodi fastest available na hoy, toggle off kore dao
  useEffect(() => {
    if (preview && preview.fastestAvailable !== true && fastest) {
      setFastest(false);
    }
  }, [preview, fastest]);

  const rows = cart.items.map((item) => {
    const price =
      tierPriceFor(item.product, item.quantity || 1) ??
      (typeof item.product.price === "number" ? item.product.price : 0);
    const orig = item.product.originalPrice;
    return {
      slug: item.id,
      lineId: item.lineId ?? item.id,
      bookingDate: item.bookingDate
        ? String(item.bookingDate).slice(0, 10)
        : undefined,
      qty: item.quantity,
      product: {
        slug: item.id,
        name: item.product.title,
        image: imageUrl(item.product.image) || "/img/photos/product-puja.jpg",
        price,
        mrp: typeof orig === "number" && orig > price ? orig : price,
      },
    };
  });

  if (!mounted) return null;

  if (redirecting) {
    return (
      <div className="px-6 py-20 text-center text-lg font-bold">
        Redirecting to secure payment…
      </div>
    );
  }

  const successModal = success && (
    <OrderSuccessModal
      orderId={success.orderId}
      message={success.message}
      onView={() => router.replace("/shop/orders")}
      onContinue={() => router.replace("/shop")}
    />
  );

  if (!rows.length) {
    return (
      <>
        {successModal}
        <div className="px-6 py-20 text-center">
          <h1 className="text-2xl font-black">Your cart is empty</h1>
          <button
            onClick={() => router.replace("/shop/cart")}
            className="shop-gold-btn mt-5 rounded-full px-6 py-3"
          >
            Return to cart
          </button>
        </div>
      </>
    );
  }

  const subtotal = bill(
    rows.map((row) => ({
      price: row.product.price,
      mrp: row.product.mrp,
      qty: row.qty,
    })),
    cart.discount,
  );

  // [FASTEST] bill er value server theke (preview thakle), nahole local
  const hasPreview = !!preview && !previewError;
  const itemsAmount = hasPreview ? Number(preview.itemsTotal ?? 0) : subtotal.total;
  const shippingAmount = hasPreview ? Number(preview.totalShipping ?? 0) : null;
  const payableTotal = hasPreview ? Number(preview.grandTotal ?? 0) : subtotal.total;

  // [FASTEST] shudhu ok store group gulo (same storeId onek bar ashte pare)
  const previewStores: any[] =
    hasPreview && Array.isArray(preview.stores)
      ? preview.stores.filter((s: any) => s.ok !== false)
      : [];
  const fastestStores = previewStores.filter((s) => s.fastestOption?.available);
  const showFastest =
    hasPreview && preview.fastestAvailable === true && fastestStores.length > 0;

  // order place kora jabe kina
  const cannotOrder = busy || previewLoading || !!previewError || !!unavailableMsg;

  async function submitOrder() {
    if (!token || !user) {
      router.push("/shop/login?next=/shop/checkout");
      return;
    }
    if (
      !address.fullName.trim() ||
      !address.phone.trim() ||
      !address.addressLine.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.pincode.trim()
    ) {
      setError("Please complete all required delivery address fields.");
      return;
    }
    if (!/^\d{10}$/.test(address.phone.trim())) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError("Enter a valid 6-digit Indian pincode.");
      return;
    }

    setBusy(true);
    let leaving = false;
    setError("");

    try {
      const cartResponse = await shopApi.get("/api/cart/");
      const { cartId, storeIds } = extractCartDetails(cartResponse.data);

      if (!cartId) {
        throw new Error(
          "Your cart ID could not be retrieved. Please refresh your cart.",
        );
      }

      if (!storeIds.length) {
        throw new Error(
          "Store information is missing from your cart. Please refresh your cart.",
        );
      }

      // an order can have several booking dates (one per service item)
      const bookingDates = [
        ...new Set(
          cart.items
            .map((i) => (i.bookingDate ? String(i.bookingDate).slice(0, 10) : ""))
            .filter(Boolean),
        ),
      ];

      const missing = cart.items.find(
        (i) =>
          String(i.product?.productType ?? "").toUpperCase() === "SERVICE" &&
          !i.bookingDate,
      );
      if (missing) {
        throw new Error(
          `Please choose a booking date for "${missing.product.title}". Remove it from the cart and add it again.`,
        );
      }
      const bookingDate = bookingDates[0];
      const itemBookings = cart.items
        .filter((i) => i.bookingDate)
        .map((i) => ({
          productId: i.product._id,
          bookingDate: String(i.bookingDate).slice(0, 10),
        }));

      const deliveryAddress = {
        fullName: address.fullName.trim(),
        phone: address.phone.trim(),
        addressLine: address.addressLine.trim(),
        area: address.area.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        pincode: address.pincode.trim(),
        country: address.country,
      };

      // last check: same fastest value diye preview
      const previewResponse = await shopApi.post("/order/checkout-preview", {
        cartId,
        storeIds,
        paymentMethod: cart.payment,
        fastestDelivery: fastest,
        deliveryAddress: {
          pincode: deliveryAddress.pincode,
          state: deliveryAddress.state,
          country: deliveryAddress.country,
        },
      });

      const finalPreview = unwrapResponse(previewResponse.data);

      if (finalPreview.success === false) {
        throw new Error("Checkout validation failed.");
      }

      if (
        Array.isArray(finalPreview.stores) &&
        finalPreview.stores.some((store: any) => store.ok === false)
      ) {
        throw new Error(
          badMessage(finalPreview.stores.filter((store: any) => store.ok === false)),
        );
      }

      const orderResponse = await shopApi.post("/order/checkout", {
        cartId,
        storeIds,
        deliveryAddress,
        note: cart.remarks.trim() || undefined,
        bookingDate, // first date, kept for the old backend field
        itemBookings, // [{ productId, bookingDate }, ...] one per service item
        paymentMethod: cart.payment,
        fastestDelivery: fastest, // [FASTEST] preview er sathe hubohu same
      });

      const orderPayload = unwrapResponse(orderResponse.data);
      void addSavedAddress(deliveryAddress);

      const created = extractCreatedOrders(orderPayload);
      const orderIds = created.length
        ? created.map((o) => o.id)
        : [extractOrderId(orderPayload)].filter(Boolean);
      const message =
        orderPayload?.message || "Your order has been placed successfully.";

      const clearCartEverywhere = async () => {
        try {
          await shopApi.delete("/api/cart");
        } catch {}
        cart.clear();
      };

      if (cart.payment === "COD") {
        await clearCartEverywhere();
        setSuccess({ orderId: orderIds[0] ?? "", message });
        return;
      }

      // ONLINE
      if (!orderIds.length) {
        throw new Error(
          "Order was created but its ID is missing, so payment could not start.",
        );
      }

      setRedirecting(true);
      await clearCartEverywhere();

      if (orderIds.length > 1) {
        window.alert(
          "You have more than one order. Pay for each one from the Orders page.",
        );
        router.replace("/shop/orders");
        return;
      }

      let payment: any;
      try {
        const paymentResponse = await shopApi.post(
          `/payment/initiate/${encodeURIComponent(orderIds[0])}`,
          {},
        );
        payment = unwrapResponse(paymentResponse.data);
        if (!payment.paymentUrl || !payment.payuParams) {
          throw new Error(
            payment.message || "Unable to initialize online payment.",
          );
        }
      } catch (e) {
        window.alert(
          `${errMsg(e, "Payment could not start.")} Your order is saved. You can pay from the Orders page.`,
        );
        router.replace("/shop/orders");
        return;
      }

      try {
        sessionStorage.setItem("ayendri:payOrder", orderIds[0]);
      } catch {}

      leaving = true;
      submitPayUPayment(payment.paymentUrl, payment.payuParams);
    } catch (e: unknown) {
      setRedirecting(false);
      const failed = (e as any)?.response?.data?.failedStores;
      setError(
        Array.isArray(failed) && failed.length
          ? badMessage(failed)
          : errMsg(e, "Unable to place order. Please try again."),
      );
    } finally {
      if (!leaving) setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] px-6 py-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-3xl font-black text-[#4a0710]">Checkout</h1>
        <span className="text-sm text-[#9a7a7a]">{rows.length} item(s)</span>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* ───────── LEFT: address, fastest delivery, remarks ───────── */}
        <div className="space-y-4">
          <section className="shop-card space-y-3 p-5">
            <h2 className="font-extrabold">Delivery address</h2>

            {saved.length > 0 && (
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {saved.map((a) => (
                  <button
                    key={a._id}
                    type="button"
                    onClick={() => {
                      setSelectedId(a._id!);
                      setAddress(toForm(a));
                    }}
                    className={`rounded-xl border p-3 text-left text-sm ${
                      selectedId === a._id
                        ? "border-[#e0622d] bg-orange-50"
                        : "border-[#e8cfa8]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <b>{a.label || "Home"}</b>
                      {a.isDefault && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          Default
                        </span>
                      )}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-[#6b4a4a]">
                      {[a.addressLine, a.area, a.city, a.state, a.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedId("new");
                    setAddress({
                      ...EMPTY_ADDRESS,
                      fullName: user?.name ?? "",
                      phone: (user?.phone ?? "").replace(/\D/g, "").slice(-10),
                    });
                  }}
                  className={`flex items-center justify-center rounded-xl border border-dashed p-3 text-sm font-bold ${
                    selectedId === "new"
                      ? "border-[#e0622d] text-[#9b4326]"
                      : "border-[#e8cfa8] text-[#9a7a7a]"
                  }`}
                >
                  + Use a new address
                </button>
              </div>
            )}

            {/* form: 2-column grid; wide fields span both columns */}
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["fullName", "Full name", true, ""],
                  ["phone", "10-digit phone number", true, ""],
                  ["addressLine", "House number, street, address", true, "col-span-2"],
                  ["area", "Area / locality", false, ""],
                  ["city", "City", true, ""],
                  ["state", "State", true, ""],
                  ["pincode", "6-digit pincode", true, ""],
                ] as const
              ).map(([key, label, required, span]) => (
                <input
                  key={key}
                  value={address[key]}
                  onChange={(event) =>
                    setAddress((current) => ({
                      ...current,
                      [key]: event.target.value,
                    }))
                  }
                  placeholder={`${label}${required ? " *" : ""}`}
                  required={required}
                  inputMode={key === "phone" || key === "pincode" ? "numeric" : "text"}
                  className={`${span} w-full rounded-xl border border-[#e8cfa8] px-4 py-2.5 text-sm outline-none focus:border-[#e0622d]`}
                />
              ))}
            </div>
          </section>

          {/* [FASTEST] preview er fastestAvailable true hole-i dekhabe */}
          {showFastest && (
            <section className="shop-card space-y-3 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-extrabold">⚡ Fastest delivery</h2>
                  <p className="text-xs text-[#9a7a7a]">
                    Get your order delivered with the fastest courier available.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={fastest}
                  aria-label="Fastest delivery"
                  onClick={() => setFastest((v) => !v)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    fastest ? "bg-[#e0622d]" : "bg-[#d9cbbd]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      fastest ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {fastestStores.map((s, i) => {
                  const opt = s.fastestOption;
                  return (
                    <div
                      key={`${s.storeId}-${i}`}
                      className="rounded-xl border border-[#e8cfa8] p-3 text-xs"
                    >
                      {previewStores.length > 1 && (
                        <p className="mb-1 font-bold text-[#4a0710]">
                          {s.storeName || "Store"}
                          {s.totalItems ? ` · ${s.totalItems} item(s)` : ""}
                        </p>
                      )}
                      <p className={fastest ? "text-[#9a7a7a]" : "font-bold text-[#4a0710]"}>
                        Normal: {etaText(opt.normal)}
                      </p>
                      <p className={fastest ? "font-bold text-[#4a0710]" : "text-[#9a7a7a]"}>
                        Fastest: {etaText(opt.fastest)}
                        {opt.fastest?.fixedFeeApplied ? " (fastest delivery fee)" : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="shop-card p-5">
            <h2 className="mb-2 font-extrabold">Remarks</h2>
            <textarea
              value={cart.remarks}
              onChange={(event) => cart.set({ remarks: event.target.value })}
              placeholder="Add any remarks (optional)"
              className="h-20 w-full rounded-2xl border border-[#e8cfa8] p-3 text-sm outline-none"
            />
          </section>
        </div>

        {/* ───────── RIGHT: sticky summary (items, bill, payment, place order) ───────── */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <section className="shop-card p-5">
            <h2 className="font-extrabold">Order Info</h2>
            <div className="mt-2 max-h-[220px] space-y-3 overflow-y-auto pr-1">
              {rows.map(({ lineId, product, qty, bookingDate }, idx) => (
                <div key={`${lineId}-${idx}`} className="flex items-center gap-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <b className="line-clamp-1">{product.name}</b>
                    <div className="text-xs text-[#9a7a7a]">
                      Qty {qty}
                      {bookingDate ? ` · Booking: ${bookingDate}` : ""}
                    </div>
                  </div>
                  <b className="text-sm">{inr(product.price * qty)}</b>
                </div>
              ))}
            </div>
          </section>

          <section className="shop-card space-y-2 p-5 text-sm">
            <h2 className="font-extrabold">Bill details</h2>
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{inr(itemsAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery{fastest && showFastest ? " (fastest)" : ""}</span>
              {previewLoading && !hasPreview ? (
                <span className="text-[#9a7a7a]">Calculating…</span>
              ) : shippingAmount === null ? (
                <span className="text-[#9a7a7a]">Enter address to see charge</span>
              ) : shippingAmount === 0 ? (
                <span className="text-green-700">Free</span>
              ) : (
                <span className={previewLoading ? "text-[#9a7a7a]" : ""}>
                  {inr(shippingAmount)}
                </span>
              )}
            </div>
            <div className="flex justify-between border-t border-[#e8cfa8] pt-2 text-base font-black">
              <span>Total</span>
              <span>{inr(payableTotal)}</span>
            </div>
            {!!previewError && (
              <p className="rounded-xl bg-red-50 p-2 text-xs text-red-700">
                {previewError}
              </p>
            )}
            {!!unavailableMsg && !previewError && (
              <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-800">
                {unavailableMsg} Please remove the unavailable item(s) from your
                cart to place the order.
              </p>
            )}
          </section>

          <section className="shop-card p-5">
            <h2 className="mb-2 text-sm font-bold">Payment method</h2>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["ONLINE", "Pay Online"],
                  ["COD", "Cash on Delivery"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => cart.set({ payment: value })}
                  aria-pressed={cart.payment === value}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-bold ${
                    cart.payment === value
                      ? "border-[#e0622d] bg-orange-50 text-[#9b4326]"
                      : "border-[#e8cfa8] text-[#9a7a7a]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
          )}

          <button
            onClick={submitOrder}
            disabled={cannotOrder}
            className="shop-gold-btn w-full rounded-full py-4 font-bold disabled:opacity-50"
          >
            {busy ? "Processing..." : `Place Order · ${inr(payableTotal)}`}
          </button>
        </aside>
      </div>

      {successModal}
    </div>
  );
}