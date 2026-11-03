"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, LayoutGrid, ClipboardCheck, User } from "lucide-react";

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
type TabsPt = { x: number; w: number } | null;

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

  // ---------- hide while the on-screen keyboard is open ----------
  const [typing, setTyping] = useState(false);
  useEffect(() => {
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName);
    const onIn = (e: FocusEvent) => {
      if (isField(e.target)) setTyping(true);
    };
    const onOut = () => setTyping(false);
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  const gone = hidden || typing;

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

  // ---------- cursor reactivity (mouse only) ----------
  const navRef = useRef<HTMLElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLAnchorElement>(null);
  const [navPt, setNavPt] = useState<Pt>(null); // relative to nav
  const [tabs, setTabs] = useState<TabsPt>(null); // cursor x + row width, relative to tabs row
  const [profPt, setProfPt] = useState<Pt>(null); // relative to profile bubble

  const onNavMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const nr = navRef.current?.getBoundingClientRect();
    const tr = tabsRef.current?.getBoundingClientRect();
    if (nr) setNavPt({ x: e.clientX - nr.left, y: e.clientY - nr.top });
    if (tr) setTabs({ x: e.clientX - tr.left, w: tr.width });
  };
  const onNavLeave = () => {
    setNavPt(null);
    setTabs(null);
  };
  const onProfMove = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = profileRef.current?.getBoundingClientRect();
    if (r) setProfPt({ x: e.clientX - r.left, y: e.clientY - r.top });
  };

  // dock-style magnification: icons near the cursor grow, falling off with distance
  const mag = (i: number) => {
    if (!tabs) return 1;
    const itemW = tabs.w / items.length;
    const d = Math.abs(tabs.x - (i + 0.5) * itemW);
    return 1 + MAG_STRENGTH * Math.max(0, 1 - d / MAG_RADIUS);
  };

  const tint = activeIdx >= 0 ? items[activeIdx].color : "#ffffff";

  return (
    <div
      // --prof = profile bubble size: 48px on small phones, 56px from 380px up
      className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center gap-3 px-3 [--prof:48px] min-[380px]:[--prof:56px]"
      style={{
        paddingBottom: "max(12px, env(safe-area-inset-bottom))",
        transform: gone ? "translateY(calc(100% + 24px))" : "translateY(0)",
        opacity: gone ? 0 : 1,
        transition: `transform ${gone ? 380 : 560}ms ${gone ? SMOOTH : SPRING}, opacity 300ms ease`,
      }}
    >
      <nav
        ref={navRef}
        onPointerMove={onNavMove}
        onPointerLeave={onNavLeave}
        className="pointer-events-auto relative rounded-[30px] border border-white/60 bg-white/35 backdrop-blur-2xl backdrop-saturate-150 [-webkit-tap-highlight-color:transparent]"
        style={{
          padding: PAD,
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

        {/* tab row: width = screen width minus side padding, gap, profile bubble and nav padding/border; capped at 252px */}
        <div
          ref={tabsRef}
          className="relative flex"
          style={{
            width: "clamp(165px, calc(100vw - 24px - 12px - var(--prof) - 18px), 252px)",
            height: ITEM_H,
          }}
        >
          {/* liquid glass indicator (sized in % so it follows the tab width) */}
          <span
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 rounded-[22px] border border-white/70 backdrop-blur-md"
            style={{
              width: `${100 / items.length}%`,
              height: ITEM_H,
              opacity: activeIdx >= 0 ? 1 : 0,
              transform: `translateX(${Math.max(activeIdx, 0) * 100}%) scale(${moving ? "1.14, 0.93" : "1, 1"})`,
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
                className="relative z-10 flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] active:scale-90 min-[360px]:text-[11px]"
                style={{
                  height: ITEM_H,
                  color: active ? INK : "#4a3a3c",
                  fontWeight: active ? 700 : 600,
                  transition: `color 300ms ease, transform 250ms ${SPRING}`,
                }}
              >
                <span
                  style={{
                    transform: `translateY(${active ? -1 : 0}px) scale(${(active ? 1.18 : 1) * m})`,
                    transition: `transform ${tabs === null ? 450 : 140}ms ${tabs === null ? SPRING : "ease-out"}`,
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
                <span className="max-w-full truncate">{label}</span>
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
        className="pointer-events-auto relative grid h-[var(--prof)] w-[var(--prof)] shrink-0 place-items-center overflow-hidden rounded-full border border-white/70 backdrop-blur-2xl backdrop-saturate-150 active:scale-90 [-webkit-tap-highlight-color:transparent]"
        style={{
          background: profileActive
            ? `linear-gradient(160deg, ${PROFILE_COLOR}59, ${PROFILE_COLOR}26 60%, rgba(255,255,255,.4))`
            : "rgba(255,255,255,.4)",
          boxShadow: profileActive
            ? "0 6px 16px rgba(28,18,20,.14), inset 0 1.5px 0 rgba(255,255,255,.9)"
            : "0 10px 28px rgba(74,7,16,.18), inset 0 1.5px 0 rgba(255,255,255,.85)",
          transform: `scale(${profPt ? 1.1 : profileActive ? 1.08 : 1})`,
          transition: `transform 560ms ${SPRING}, background 300ms ease, box-shadow 300ms ease`,
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
        <span className="sr-only">Profile</span>
      </Link>
    </div>
  );
}