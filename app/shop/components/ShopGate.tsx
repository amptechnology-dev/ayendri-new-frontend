"use client";
import { useEffect, type ReactNode } from "react";
import { useShop } from "../shop-data";

export default function ShopGate({ children }: { children: ReactNode }) {
  const loaded = useShop((s) => s.loaded);

  useEffect(() => {
    void useShop.getState().load();
  }, []);

  if (!loaded) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#f2b632] border-t-transparent" />
      </div>
    );
  }
  return <>{children}</>;
}