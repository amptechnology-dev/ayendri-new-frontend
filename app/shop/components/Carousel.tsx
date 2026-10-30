"use client";
import { Children, useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Carousel({
  children,
  itemWidth = 230,
}: {
  children: React.ReactNode;
  itemWidth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [l, setL] = useState(false);
  const [r, setR] = useState(true);
  const items = Children.toArray(children);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setL(el.scrollLeft > 8);
    setR(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, items.length]);

  const go = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  const arrow =
    "absolute top-1/3 z-10 hidden h-11 w-11 place-items-center rounded-full bg-white text-[#4a0710] shadow-xl transition hover:scale-110 md:grid";

  return (
    <div className="relative">
      {l && (
        <button aria-label="Previous" onClick={() => go(-1)} className={`${arrow} -left-2`}>
          <ChevronLeft size={20} />
        </button>
      )}
      <div
        ref={ref}
        onScroll={update}
        className="shop-scroll flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4 pt-1"
      >
        {items.map((c, i) => (
          <div key={i} style={{ width: itemWidth }} className="shrink-0 snap-start">
            {c}
          </div>
        ))}
      </div>
      {r && (
        <button aria-label="Next" onClick={() => go(1)} className={`${arrow} -right-2`}>
          <ChevronRight size={20} />
        </button>
      )}
    </div>
  );
}