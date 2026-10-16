"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import axiosInstance from "@/service/axios.service";

// Quill browser-only, tai SSR off
const Editor = dynamic(() => import("primereact/editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="flex h-40 items-center justify-center rounded-lg border border-blue-200 bg-blue-50/40">
      <i className="pi pi-spin pi-spinner text-2xl text-blue-500" />
    </div>
  ),
});

type TermsFormProps = {
  termsId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const MAX_TITLE = 150;

// Quill faka thakle "<p><br></p>" dey, ta check korar jonno
const isEmptyHtml = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim().length === 0;

// Toolbar: Bold, Italic, Underline, Heading, Bullet, Ordered, Link, Clear
const editorHeader = (
  <>
    <span className="ql-formats">
      <select className="ql-header" defaultValue="" aria-label="Heading">
        <option value="2">Heading</option>
        <option value="3">Sub heading</option>
        <option value="">Normal</option>
      </select>
    </span>
    <span className="ql-formats">
      <button type="button" className="ql-bold" aria-label="Bold" />
      <button type="button" className="ql-italic" aria-label="Italic" />
      <button type="button" className="ql-underline" aria-label="Underline" />
    </span>
    <span className="ql-formats">
      <button type="button" className="ql-list" value="ordered" aria-label="Numbered list" />
      <button type="button" className="ql-list" value="bullet" aria-label="Bullet list" />
    </span>
    <span className="ql-formats">
      <button type="button" className="ql-link" aria-label="Link" />
      <button type="button" className="ql-clean" aria-label="Clear formatting" />
    </span>
  </>
);

export default function TermsForm({ termsId, onClose, onSuccess }: TermsFormProps) {
  const isEditMode = !!termsId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------- Edit mode: existing load ----------
  useEffect(() => {
    if (!termsId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(
          `/api/terms-conditions/single/${termsId}`,
        );
        if (cancelled) return;
        const t = res.data.terms;
        setTitle(t.title || "");
        setDescription(t.description || "");
        setOrder(t.order ?? 0);
        setIsActive(t.isActive ?? true);
      } catch (error: any) {
        if (cancelled) return;
        toast.error(
          error.response?.data?.message || "Failed to fetch terms & conditions",
        );
        onClose();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termsId]);

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    if (isEmptyHtml(description)) {
      toast.error("Description is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/api/terms-conditions/upsert", {
        ...(isEditMode ? { id: termsId } : {}),
        title: title.trim(),
        description,
        order: order ?? 0,
        isActive,
      });

      toast.success(
        res.data.message ||
          `Terms & conditions ${isEditMode ? "updated" : "created"} successfully!`,
      );
      onSuccess();
    } catch (error: any) {
      const apiErrors = error.response?.data?.errors;
      toast.error(
        (Array.isArray(apiErrors) && apiErrors[0]?.message) ||
          error.response?.data?.message ||
          `Failed to ${isEditMode ? "update" : "create"} terms & conditions`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <i className="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-3">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ---------- Title ---------- */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <i className="pi pi-tag text-blue-600"></i>
            Title <span className="text-red-500">*</span>
          </h4>
          <InputText
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={MAX_TITLE}
            placeholder="e.g. Acceptance of Terms"
            className="w-full"
            disabled={isSubmitting}
          />
          <p className="text-right text-[11px] text-gray-400">
            {title.length}/{MAX_TITLE}
          </p>
        </div>

        {/* ---------- Description (rich text) ---------- */}
        <div className="space-y-1.5">
          <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <i className="pi pi-align-left text-blue-600"></i>
            Description <span className="text-red-500">*</span>
          </h4>
          <div className="rounded-lg overflow-hidden border border-blue-200">
            <Editor
              value={description}
              onTextChange={(e) => setDescription(e.htmlValue || "")}
              headerTemplate={editorHeader}
              readOnly={isSubmitting}
              placeholder="Write terms here..."
              style={{ height: "220px" }}
            />
          </div>
        </div>

        {/* ---------- Order ---------- */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">Display Order</p>
              <p className="text-xs text-gray-500">
                Small numbers will be looks front (0, 1, 2...)
              </p>
            </div>
            <InputNumber
              value={order}
              onValueChange={(e) => setOrder(e.value ?? 0)}
              min={0}
              max={9999}
              showButtons
              inputStyle={{ width: "70px", textAlign: "center" }}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* ---------- Status ---------- */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Status</p>
              <p className="text-xs text-gray-500">
                {isActive ? "Live — visible to users" : "Hidden — not displayed"}
              </p>
            </div>
            <InputSwitch
              checked={isActive}
              onChange={(e) => setIsActive(!!e.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* ---------- Buttons ---------- */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            onClick={onClose}
            className="flex-1 bg-gray-100 text-gray-700 border-0 hover:bg-gray-200"
            outlined
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            label={isSubmitting ? "Saving..." : isEditMode ? "Update" : "Create"}
            icon={isSubmitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            disabled={isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}