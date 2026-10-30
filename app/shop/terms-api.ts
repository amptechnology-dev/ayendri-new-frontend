"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "@/service/axios.service";

// shopApi te credentials chhilo na, tai same rakhlam (CORS "*" er sathe kaj korbe)
const noCreds = { withCredentials: false } as const;

export type Term = {
  _id: string;
  title: string;
  description: string;
  order?: number;
  updatedAt?: string;
};

let cache: Term[] | null = null;

export async function fetchTerms(force = false): Promise<Term[]> {
  if (cache && !force) return cache;
  try {
    const { data } = await axiosInstance.get("/api/terms-conditions/active", {
      headers: { Accept: "application/json" },
      ...noCreds,
    });
    const list: Term[] = Array.isArray(data?.terms) ? data.terms : [];
    cache = list;
    return list;
  } catch (err) {
    throw new Error(
      axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : "Could not load terms.",
    );
  }
}

export function useTerms() {
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback((force = false) => {
    setLoading(true);
    setError("");
    fetchTerms(force)
      .then(setTerms)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load terms."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { terms, loading, error, reload: () => load(true) };
}

export type HtmlBlock = { type: "text" | "space"; text: string };

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

// Turns the backend HTML into paragraphs and blank spacers (same logic as the app)
export function htmlToBlocks(html: string): HtmlBlock[] {
  const parts = (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|ul|ol)>/gi, "\u0000")
    .split("\u0000");

  const blocks: HtmlBlock[] = [];
  parts.forEach((part) => {
    const text = decode(part.replace(/<[^>]+>/g, "")).trim();
    if (text) blocks.push({ type: "text", text });
    else if (blocks.length && blocks[blocks.length - 1].type !== "space")
      blocks.push({ type: "space", text: "" });
  });
  while (blocks.length && blocks[blocks.length - 1].type === "space") blocks.pop();
  return blocks;
}