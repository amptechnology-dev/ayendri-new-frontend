"use client";

import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { toast } from "react-toastify";
import axiosInstance from "@/service/axios.service";

const schema = z.object({
  storeId: z.string().min(1, "Store is required"),
  question: z.string().trim().min(1, "Question is required").max(500),
  keywordsText: z.string().trim().min(1, "Add at least one keyword"),
  answer: z.string().trim().min(1, "Answer is required").max(2000),
  isActive: z.boolean(),
});

type FormData = z.infer<typeof schema>;

type Props = {
  faqId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

const parseKeywords = (text: string) =>
  Array.from(
    new Set(
      text
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

function ChatbotFaqForm({ faqId, onClose, onSuccess }: Props) {
  const isEdit = !!faqId;
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeId: "",
      question: "",
      keywordsText: "",
      answer: "",
      isActive: true,
    },
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await axiosInstance.get("/api/register/user-based-stores");
        const list = res.data?.stores || [];
        setStores(list);
        if (list.length > 0 && !faqId) setValue("storeId", list[0]._id);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to fetch stores");
      }
    })();

    if (faqId) {
      (async () => {
        try {
          setLoading(true);
          const res = await axiosInstance.get(`/api/chatbot/${faqId}`);
          const f = res.data.faq;
          setValue("question", f.question || "");
          setValue("answer", f.answer || "");
          setValue("keywordsText", (f.keywords || []).join(", "));
          setValue("isActive", f.isActive ?? true);
          const sid = typeof f.storeId === "object" ? f.storeId?._id : f.storeId;
          if (sid) setValue("storeId", sid);
        } catch (err: any) {
          toast.error(err?.response?.data?.message || "Failed to load FAQ");
          onClose();
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqId]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const keywords = parseKeywords(data.keywordsText);
      const payload: any = {
        question: data.question,
        answer: data.answer,
        keywords,
        isActive: data.isActive,
      };
      if (!isEdit) payload.storeId = data.storeId;

      const res = await axiosInstance.request({
        url: isEdit ? `/api/chatbot/${faqId}` : "/api/chatbot",
        method: isEdit ? "put" : "post",
        data: payload,
      });
      toast.success(res.data.message || "Saved");
      onSuccess();
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      toast.error(
        apiErrors?.[0]?.message || err?.response?.data?.message || "Failed to save FAQ",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <i className="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
      </div>
    );
  }

  const err = (msg?: string) =>
    msg ? (
      <small className="text-red-500 flex items-center gap-1">
        <i className="pi pi-exclamation-circle"></i>
        {msg}
      </small>
    ) : null;

  return (
    <div className="px-4 pt-2 pb-3">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {!isEdit && stores.length > 1 && (
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">Store *</label>
            <Controller
              name="storeId"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  options={stores.map((s) => ({ label: s.storeName, value: s._id }))}
                  onChange={(e) => field.onChange(e.value)}
                  placeholder="Select store"
                  className="w-full"
                />
              )}
            />
            {err(errors.storeId?.message)}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Question <span className="text-red-500">*</span>
          </label>
          <InputText className="w-full" {...register("question")} placeholder="e.g. What are your delivery charges?" />
          {err(errors.question?.message)}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Keywords <span className="text-red-500">*</span>
          </label>
          <InputText className="w-full" {...register("keywordsText")} placeholder="delivery, shipping, charge" />
          <small className="text-gray-500">
            Comma separated. If a customer&apos;s message contains any of these, this answer is sent.
          </small>
          {err(errors.keywordsText?.message)}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Answer <span className="text-red-500">*</span>
          </label>
          <InputTextarea className="w-full" rows={5} autoResize {...register("answer")} placeholder="Reply the customer will receive" />
          {err(errors.answer?.message)}
        </div>

        <div className="flex items-center justify-between bg-blue-50/60 border border-blue-100 rounded-lg px-2.5 py-2">
          <div>
            <p className="text-sm font-semibold text-gray-700">Active</p>
            <p className="text-xs text-gray-500">Turn off to stop using this FAQ</p>
          </div>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <InputSwitch checked={field.value} onChange={(e) => field.onChange(e.value)} />
            )}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            onClick={onClose}
            className="flex-1"
            outlined
            disabled={submitting}
          />
          <Button
            type="submit"
            label={submitting ? "Saving..." : isEdit ? "Update FAQ" : "Create FAQ"}
            icon={submitting ? "pi pi-spin pi-spinner" : "pi pi-check"}
            className="flex-1"
            disabled={submitting}
          />
        </div>
      </form>
    </div>
  );
}

export default ChatbotFaqForm;