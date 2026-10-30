"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export const inputCls =
  "h-[52px] w-full rounded-[14px] bg-[#F5F5F7] px-4 text-sm text-[#1C1B1F] outline-none placeholder:text-[#8A8A93] focus:ring-2 focus:ring-[#f7c8a5]";
export const btnCls =
  "mt-2 grid h-[54px] w-full place-items-center rounded-2xl bg-[#f7c8a5] text-base font-bold text-black transition hover:brightness-95 disabled:opacity-60";

export function Notice({ error, info }: { error?: string; info?: string }) {
  if (!error && !info) return null;
  return (
    <p className={`rounded-xl px-3 py-2 text-xs font-semibold ${error ? "bg-[#fff1f2] text-[#b91c1c]" : "bg-[#ecfdf5] text-[#047857]"}`}>
      {error || info}
    </p>
  );
}

export default function AuthShell({
  title, subtitle, children, footer,
}: { title: string; subtitle: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const router = useRouter();
  const back = () => (window.history.length > 1 ? router.back() : router.push("/shop"));
  return (
    <div className="grid min-h-[75vh] place-items-center bg-[linear-gradient(135deg,#FDEBD6_0%,#F5E1EC_35%,#E9E3F7_70%,#E3E0F5_100%)] px-4 py-10">
      <div className="relative w-full max-w-[420px]">
        <button onClick={back} aria-label="Go back" className="absolute -top-1 left-0 grid h-9 w-9 -translate-y-full place-items-center text-[#1C1B1F]">
          <ChevronLeft size={22} />
        </button>
        <div className="flex flex-col items-center rounded-[28px] bg-white/70 px-6 pb-6 pt-8 backdrop-blur">
          <div className="mb-[18px] grid h-14 w-14 place-items-center rounded-[18px] bg-[rgb(245,185,121)] text-white">
            <ShieldCheck size={26} />
          </div>
          <h1 className="text-[26px] font-extrabold text-[#1C1B1F]">{title}</h1>
          <p className="mt-1.5 text-center text-[13px] text-[#8A8A93]">{subtitle}</p>
          <div className="mt-6 w-full space-y-3">{children}</div>
          {footer && <div className="mt-6 flex justify-center text-[13px] text-[#8A8A93]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}