"use client";

import { useEffect } from "react";
import { useAuth } from "../auth";
import { useCart } from "../cart";

export default function CartSync() {
  const token = useAuth((s) => s.token);
  const ready = useAuth((s) => s.ready);

  useEffect(() => {
    if (!ready) {
      void useAuth.getState().hydrate();
    }
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    if (token) {
      void useCart.getState().hydrate();
    } else {
      useCart.getState().reset();
    }
  }, [token, ready]);

  return null;
}