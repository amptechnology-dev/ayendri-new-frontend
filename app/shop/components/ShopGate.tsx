"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useShop } from "../shop-data";

// pages that don't need shop data render straight away, so crawlers get real HTML instead of a spinner
const OPEN_PATHS = [
  "/",
  "/shop",
  "/shop/about",
  "/shop/contact",
  "/shop/privacy-policy",
  "/shop/shipping-returns",
  "/shop/editorial-policy",
];

export default function ShopGate({ children }: { children: ReactNode }) {
  const loaded = useShop((s) => s.loaded);
  const path = usePathname() ?? "";
  const open = OPEN_PATHS.includes(path);

  useEffect(() => {
    void useShop.getState().load();
  }, []);

  if (!loaded && !open) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f2b632] border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}