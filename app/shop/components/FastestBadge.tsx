import { Zap } from "lucide-react";

export default function FastestBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[10px] border border-[#FFD9BA] bg-[#FFF4EC] font-extrabold text-[#E8634A] ${
        compact ? "px-1.5 py-0.5 text-[10.5px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Zap size={compact ? 11 : 14} className="fill-[#E8634A]" />
      Fastest delivery
    </span>
  );
}