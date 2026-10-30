"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, LayoutGrid, ClipboardCheck, User } from "lucide-react";

const ITEM_W = 84; // px, width of each tab
const ITEM_H = 56; // px, height of each tab
const PAD = 8; // px, nav inner padding
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)"; // iOS-like overshoot
const SMOOTH = "cubic-bezier(0.32, 0.72, 0, 1)"; // iOS-like ease for slide in/out
const MAG_RADIUS = 110; // px, how far the cursor "lens" reaches
const MAG_STRENGTH = 0.22; // extra icon scale at the cursor

const items = [
  { href: "/shop", label: "Home", Icon: Home, color: "#d9803a", match: (p: string) => p === "/shop" },
  { href: "/shop/category/all", label: "Categories", Icon: LayoutGrid, color: "#2f8f82", match: (p: string) => p.startsWith("/shop/category") },
  { href: "/shop/orders", label: "Orders", Icon: ClipboardCheck, color: "#7b5fc0", match: (p: string) => p.startsWith("/shop/orders") },
];

const PROFILE_COLOR = "#c9576f";
const INK = "#1c1214"; // near-black outline for all icons

type Pt = { x: number; y: number } | null;

export default function BottomNav() {
  const path = usePathname() ?? "";
  const activeIdx = items.findIndex((i) => i.match(path));
  const profileActive = path.startsWith("/shop/profile");

  // ---------- hide on scroll down, show on scroll up ----------
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const dy = y - last;
        const atBottom = window.innerHeight + y >= document.documentElement.scrollHeight - 4;
        if (y < 80 || atBottom) setHidden(false);
        else if (dy > 6) setHidden(true);
        else if (dy < -6) setHidden(false);
        if (Math.abs(dy) > 6 || y < 80) last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ---------- squash & stretch the glass blob while it travels ----------
  const prev = useRef(activeIdx);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    if (prev.current !== activeIdx) {
      prev.current = activeIdx;
      setMoving(true);
      const t = setTimeout(() => setMoving(false), 380);
      return () => clearTimeout(t);
    }
  }, [activeIdx]);

  // ---------- cursor reactivity ----------
  const navRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLAnchorElement>(null);
  const [navPt, setNavPt] = useState<Pt>(null); // relative to nav
  const [tabsX, setTabsX] = useState<number | null>(null); // relative to tabs row
  const [profPt, setProfPt] = useState<Pt>(null); // relative to profile bubble

  const onNavMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const nr = navRef.current?.getBoundingClientRect();
    const tr = tabsRef.current?.getBoundingClientRect();
    if (nr) setNavPt({ x: e.clientX - nr.left, y: e.clientY - nr.top });
    if (tr) setTabsX(e.clientX - tr.left);
  };
  const onNavLeave = () => {
    setNavPt(null);
    setTabsX(null);
  };
  const onProfMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = profileRef.current?.getBoundingClientRect();
    if (r) setProfPt({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  // dock-style magnification: icons near the cursor grow, falling off with distance
  const mag = (i: number) => {
    if (tabsX === null) return 1;
    const d = Math.abs(tabsX - (i + 0.5) * ITEM_W);
    return 1 + MAG_STRENGTH * Math.max(0, 1 - d / MAG_RADIUS);
  };

  const tint = activeIdx >= 0 ? items[activeIdx].color : "#ffffff";
  const hideShift = "translateY(calc(100% + 40px))";

  return (
    <>
      <nav
        ref={navRef}
        onPointerMove={onNavMove}
        onPointerLeave={onNavLeave}
        className="fixed bottom-4 left-1/2 z-50 rounded-[30px] border border-white/60 bg-white/35 backdrop-blur-2xl backdrop-saturate-150"
        style={{
          padding: PAD,
          transform: `translateX(-50%) ${hidden ? hideShift : "translateY(0)"}`,
          opacity: hidden ? 0 : 1,
          transition: `transform ${hidden ? 380 : 560}ms ${hidden ? SMOOTH : SPRING}, opacity 300ms ease`,
          boxShadow:
            "0 14px 40px rgba(74,7,16,.20), inset 0 1.5px 0 rgba(255,255,255,.85), inset 0 -1px 0 rgba(255,255,255,.25)",
        }}
      >
        {/* cursor spotlight (glass sheen that follows the pointer) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[30px]"
          style={{
            opacity: navPt ? 1 : 0,
            transition: "opacity 300ms ease",
            background: navPt
              ? `radial-gradient(130px circle at ${navPt.x}px ${navPt.y}px, rgba(255,255,255,.75), ${tint}1f 45%, transparent 75%)`
              : "none",
          }}
        />

        <div ref={tabsRef} className="relative flex" style={{ width: ITEM_W * items.length, height: ITEM_H }}>
          {/* liquid glass indicator */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 rounded-[22px] border border-white/70 backdrop-blur-md"
            style={{
              width: ITEM_W,
              height: ITEM_H,
              opacity: activeIdx >= 0 ? 1 : 0,
              transform: `translateX(${Math.max(activeIdx, 0) * ITEM_W}px) scale(${moving ? "1.14, 0.93" : "1, 1"})`,
              transition: `transform 520ms ${SPRING}, background 400ms ease, opacity 200ms ease`,
              background: `linear-gradient(160deg, ${tint}38 0%, ${tint}1a 55%, rgba(255,255,255,.35) 100%)`,
              boxShadow: `0 4px 12px rgba(28,18,20,.12), inset 0 1.5px 0 rgba(255,255,255,.9), inset 0 -4px 10px ${tint}1a`,
            }}
          />

          {items.map(({ href, label, Icon, color }, i) => {
            const active = i === activeIdx;
            const m = mag(i);
            return (
              <Link
                key={label}
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative z-10 flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] active:scale-90"
                style={{
                  width: ITEM_W,
                  height: ITEM_H,
                  color: active ? INK : "#4a3a3c",
                  fontWeight: active ? 700 : 600,
                  transition: `color 300ms ease, transform 250ms ${SPRING}`,
                }}
              >
                <span
                  style={{
                    transform: `translateY(${active ? -1 : 0}px) scale(${(active ? 1.18 : 1) * m})`,
                    transition: `transform ${tabsX === null ? 450 : 140}ms ${tabsX === null ? SPRING : "ease-out"}`,

                  }}
                >
                  <Icon
                    size={21}
                    strokeWidth={active ? 2.2 : 2}
                    color={INK}
                    fill={active ? `${color}99` : "none"}
                    style={{ transition: "fill 300ms ease, stroke 300ms ease" }}
                  />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* profile bubble */}
      <Link
        ref={profileRef}
        href="/shop/profile"
        aria-label="Profile"
        onPointerMove={onProfMove}
        onPointerLeave={() => setProfPt(null)}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center overflow-hidden rounded-full border border-white/70 backdrop-blur-2xl backdrop-saturate-150 active:scale-90"
        style={{
          background: profileActive
            ? `linear-gradient(160deg, ${PROFILE_COLOR}59, ${PROFILE_COLOR}26 60%, rgba(255,255,255,.4))`
            : "rgba(255,255,255,.4)",
          boxShadow: profileActive
            ? `0 6px 16px rgba(28,18,20,.14), inset 0 1.5px 0 rgba(255,255,255,.9)`
            : "0 10px 28px rgba(74,7,16,.18), inset 0 1.5px 0 rgba(255,255,255,.85)",
          transform: `${hidden ? hideShift : "translateY(0)"} scale(${profPt ? 1.1 : profileActive ? 1.08 : 1})`,
          opacity: hidden ? 0 : 1,
          transition: `transform ${hidden ? 380 : 560}ms ${hidden ? SMOOTH : SPRING}, opacity 300ms ease, background 300ms ease, box-shadow 300ms ease`,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: profPt ? 1 : 0,
            transition: "opacity 250ms ease",
            background: profPt
              ? `radial-gradient(60px circle at ${profPt.x}px ${profPt.y}px, rgba(255,255,255,.8), ${PROFILE_COLOR}22 55%, transparent 80%)`
              : "none",
          }}
        />
        <User
          size={25}
          strokeWidth={profileActive ? 2.2 : 2}
          color={INK}
          fill={profileActive ? `${PROFILE_COLOR}99` : "none"}
          className="relative"
          style={{ transition: "fill 300ms ease, stroke 300ms ease" }}
        />
      </Link>
    </>
  );
}