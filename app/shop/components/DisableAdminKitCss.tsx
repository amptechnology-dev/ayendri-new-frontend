"use client";
import { useLayoutEffect } from "react";

export default function DisableAdminKitCss() {
  useLayoutEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')
    ).filter((l) => l.getAttribute("href")?.includes("/css/app.css"));

    links.forEach((l) => { l.disabled = true; });
    return () => { links.forEach((l) => { l.disabled = false; }); };
  }, []);

  return null;
}