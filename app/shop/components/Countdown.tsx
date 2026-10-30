"use client";
import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

export default function Countdown({ hours = 8 }: { hours?: number }) {
  const [left, setLeft] = useState(hours * 3600);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : hours * 3600)), 1000);
    return () => clearInterval(t);
  }, [hours]);
  const f = (n: number) => String(n).padStart(2, "0");
  return (
    <div className="flex items-center gap-2 rounded-full bg-[#ffe8c2] px-5 py-2 text-xl font-extrabold text-[#a3161c]">
      <Timer size={18} /> {f(Math.floor(left / 3600))}:{f(Math.floor((left % 3600) / 60))}:{f(left % 60)}
    </div>
  );
}