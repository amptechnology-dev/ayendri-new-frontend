"use client";

import { useEffect } from "react";
import { useShop } from "../shop-data";

export default function ShopLoader() {
  const load = useShop((s) => s.load);

  useEffect(() => {
    void load();
  }, [load]);

  return null;
}