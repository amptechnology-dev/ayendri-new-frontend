"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

const css = `
@keyframes hr-spin { to { transform: rotate(360deg); } }
@keyframes hr-flame {
  0%,100% { transform: scale(1,1) skewX(0deg); }
  25%     { transform: scale(.93,1.1) skewX(-3deg); }
  50%     { transform: scale(1.05,.94) skewX(2.5deg); }
  75%     { transform: scale(.97,1.07) skewX(-1.5deg); }
}
@keyframes hr-glow {
  0%,100% { opacity: .3; transform: scale(.85); }
  50%     { opacity: .85; transform: scale(1.15); }
}
@keyframes hr-ember {
  0%   { transform: translate(0,0) scale(1); opacity: 0; }
  15%  { opacity: 1; }
  100% { transform: translate(var(--dx), -52px) scale(.2); opacity: 0; }
}
@keyframes hr-swing { 0%,100% { transform: rotate(-8deg); } 50% { transform: rotate(8deg); } }
@keyframes hr-clapper { 0%,100% { transform: rotate(10deg); } 50% { transform: rotate(-10deg); } }
@keyframes hr-sway { 0%,100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
@keyframes hr-float {
  0%,100% { transform: translateY(0); opacity: .85; }
  50%     { transform: translateY(-5px); opacity: 1; }
}
@keyframes hr-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.07); } }
@keyframes hr-twinkle {
  0%,100% { opacity: .2; transform: scale(.5) rotate(0deg); }
  50%     { opacity: 1;  transform: scale(1.3) rotate(45deg); }
}
@keyframes hr-smoke {
  0%   { stroke-dashoffset: 0;    opacity: 0; }
  20%  { opacity: .95; }
  100% { stroke-dashoffset: -100; opacity: 0; }
}
@keyframes hr-drift { 0%,100% { transform: translateX(-2px); } 50% { transform: translateX(3px); } }
@keyframes hr-rise {
  0%   { transform: translateY(0); opacity: 0; }
  10%  { opacity: .85; }
  90%  { opacity: .5; }
  100% { transform: translateY(-520px); opacity: 0; }
}
@keyframes hr-shine {
  0%,100% { filter: drop-shadow(0 0 2px rgba(246,196,83,.35)); }
  50%     { filter: drop-shadow(0 0 8px rgba(246,196,83,.95)); }
}
@keyframes hr-dash { to { stroke-dashoffset: -90; } }

.hr-box   { transform-box: fill-box; transform-origin: center; }
.hr-shine { animation: hr-shine 4s ease-in-out infinite; }
.hr-ring-a { transform-box: fill-box; transform-origin: center; animation: hr-spin 90s linear infinite; }
.hr-ring-b { transform-box: fill-box; transform-origin: center; animation: hr-spin 60s linear infinite reverse; }
.hr-ring-c { animation: hr-dash 6s linear infinite; }
.hr-flame  { transform-box: fill-box; transform-origin: 50% 100%; animation: hr-flame 1.5s ease-in-out infinite; }
.hr-glow   { transform-box: fill-box; transform-origin: center; animation: hr-glow 2.4s ease-in-out infinite; }
.hr-ember  { opacity: 0; animation: hr-ember 2.8s ease-out infinite; }
.hr-swing  { transform-box: fill-box; transform-origin: 50% 0%; animation: hr-swing 3.6s ease-in-out infinite; }
.hr-clap   { transform-box: fill-box; transform-origin: 50% 0%; animation: hr-clapper 3.6s ease-in-out infinite; animation-delay: .35s; }
.hr-sway   { transform-box: fill-box; transform-origin: 50% 100%; animation: hr-sway 4.5s ease-in-out infinite; }
.hr-float  { transform-box: fill-box; transform-origin: center; animation: hr-float 5s ease-in-out infinite; }
.hr-pulse  { transform-box: fill-box; transform-origin: 50% 100%; animation: hr-pulse 4s ease-in-out infinite; }
.hr-twinkle{ transform-box: fill-box; transform-origin: center; animation: hr-twinkle 3s ease-in-out infinite; }
.hr-smoke  { stroke-dasharray: 45 55; opacity: 0; animation: hr-smoke 3.6s linear infinite; }
.hr-drift  { animation: hr-drift 3s ease-in-out infinite; }
.hr-rise   { opacity: 0; animation: hr-rise 12s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  .hr-root, .hr-root * { animation: none !important; }
  .hr-ember, .hr-rise { opacity: 0 !important; }
  .hr-smoke { opacity: .7 !important; }
}
`;

const d = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Diya({ x, y, s, delay = 0 }: { x: number; y: number; s: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="50" cy="22" r="38" fill="url(#hr-glow)" stroke="none" className="hr-glow" style={d(delay)} />
      <use href="#hr-diya-body" />
      <g className="hr-flame" fill="#ffd36b" fillOpacity="0.35" style={d(delay)}>
        <use href="#hr-diya-flame" />
      </g>
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={i}
          className="hr-ember"
          cx={42 + i * 5}
          cy="12"
          r="1.3"
          fill="currentColor"
          stroke="none"
          style={{ animationDelay: `${delay + i * 0.7}s`, ["--dx" as string]: `${(i - 1.5) * 9}px` } as CSSProperties}
        />
      ))}
    </g>
  );
}

function Lotus({ x, y, s, delay = 0 }: { x: number; y: number; s: number; delay?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cx="50" cy="34" r="48" fill="url(#hr-glow)" stroke="none" className="hr-glow" style={d(delay)} />
      <g className="hr-pulse" style={d(delay)}>
        <use href="#hr-lotus" />
      </g>
    </g>
  );
}

function Halo() {
  return (
    <>
      <circle cx="130" cy="280" r="150" fill="url(#hr-glow)" stroke="none" opacity="0.18" className="hr-glow" />
      <g fill="none" stroke="currentColor">
        <circle cx="130" cy="280" r="122" strokeWidth="1" strokeDasharray="2 7" opacity="0.35" className="hr-ring-a" />
        <circle cx="130" cy="280" r="98" strokeWidth="1" opacity="0.3" className="hr-ring-b" strokeDasharray="30 6 4 6" />
        <circle cx="130" cy="280" r="136" strokeWidth="0.8" opacity="0.3" strokeDasharray="6 12" className="hr-ring-c" />
      </g>
    </>
  );
}

function Particles({ seed = 0 }: { seed?: number }) {
  return (
    <g fill="currentColor" stroke="none">
      {Array.from({ length: 10 }, (_, i) => (
        <circle
          key={i}
          className="hr-rise"
          cx={20 + (((i + seed) * 53) % 220)}
          cy={545}
          r={0.8 + ((i + seed) % 3) * 0.5}
          style={{ animationDuration: `${9 + ((i + seed) % 4) * 2.5}s`, animationDelay: `${-(i * 1.7)}s` }}
        />
      ))}
    </g>
  );
}

function Stars({ list }: { list: [number, number, number, number][] }) {
  return (
    <g fill="currentColor" opacity="0.9">
      {list.map(([x, y, s, delay], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}>
          <g className="hr-twinkle" style={d(delay)}>
            <use href="#hr-star" />
          </g>
        </g>
      ))}
    </g>
  );
}

export default function HeroArt() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  // gentle cursor parallax, the two sides drift in opposite directions
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (leftRef.current) leftRef.current.style.transform = `translate3d(${cx * 14}px, ${cy * 10}px, 0)`;
      if (rightRef.current) rightRef.current.style.transform = `translate3d(${-cx * 14}px, ${cy * 10}px, 0)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  return (
    <>
      <style>{css}</style>

      {/* shared drawings (zero-size sprite) */}
      <svg aria-hidden width="0" height="0" className="absolute">
        <defs>
          <radialGradient id="hr-glow">
            <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#f6c453" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f6c453" stopOpacity="0" />
          </radialGradient>

          <g id="hr-gopuram">
            <path d="M8 116H112" />
            <path d="M14 116V94H106V116" />
            <path d="M22 94L30 76H90L98 94" />
            <path d="M34 76L42 60H78L86 76" />
            <path d="M46 60L52 46H68L74 60" />
            <path d="M54 46L58 34H62L66 46" />
            <path d="M60 34V26" />
            <path d="M55 26C55 19 65 19 65 26Z" />
            <path d="M60 19V10" />
            <path d="M52 116V104a8 8 0 0 1 16 0V116" />
            <path d="M26 112V102a4 4 0 0 1 8 0V112M86 112V102a4 4 0 0 1 8 0V112" />
            <path d="M38 88V82a3 3 0 0 1 6 0V88M76 88V82a3 3 0 0 1 6 0V88M56 72V66a4 4 0 0 1 8 0V72" />
          </g>

          <g id="hr-diya-body">
            <path d="M10 40H90C90 58 72 68 50 68C28 68 10 58 10 40Z" />
            <path d="M22 50C34 56 66 56 78 50" />
            <path d="M34 68H66M40 72H60" />
          </g>
          <g id="hr-diya-flame">
            <path d="M50 38C40 28 40 16 50 4C60 16 60 28 50 38Z" />
            <path d="M50 30C46 25 46 20 50 14C54 20 54 25 50 30Z" />
          </g>

          <g id="hr-dhupkati-body">
            <path d="M40 56L34 34M50 56V30M60 56L66 34" />
            <path d="M20 56H80" />
            <path d="M24 56C24 68 36 76 50 76C64 76 76 68 76 56" />
            <path d="M32 64H68" />
            <path d="M50 76V90" />
            <path d="M32 104C32 96 40 90 50 90C60 90 68 96 68 104Z" />
            <path d="M28 104H72" />
          </g>

          <g id="hr-kalash-body">
            <path d="M28 38H52V46C62 52 66 62 62 72C58 84 50 90 40 90C30 90 22 84 18 72C14 62 18 52 28 46Z" />
            <path d="M24 38H56" />
            <path d="M20 62H60" />
          </g>
          <g id="hr-kalash-top">
            <path d="M31 30C31 18 49 18 49 30C49 38 31 38 31 30Z" />
            <path d="M40 20C26 18 18 24 14 32C26 34 34 30 40 20Z" />
            <path d="M40 20C54 18 62 24 66 32C54 34 46 30 40 20Z" />
          </g>

          <g id="hr-bell-body">
            <path d="M30 0V8" />
            <path d="M25 14C25 6 35 6 35 14" />
            <path d="M12 56C12 32 20 16 30 16C40 16 48 32 48 56" />
            <path d="M6 56H54C54 62 50 64 46 64H14C10 64 6 62 6 56Z" />
            <path d="M16 44H44" />
          </g>
          <g id="hr-bell-clapper">
            <path d="M30 64V70" />
            <circle cx="30" cy="74" r="3" />
          </g>

          <g id="hr-lotus">
            <path d="M50 8C40 24 40 40 50 52C60 40 60 24 50 8Z" />
            <path d="M50 52C30 48 18 34 18 20C32 22 44 34 50 52Z" />
            <path d="M50 52C70 48 82 34 82 20C68 22 56 34 50 52Z" />
            <path d="M50 52C26 54 8 46 2 32C16 30 36 38 50 52Z" />
            <path d="M50 52C74 54 92 46 98 32C84 30 64 38 50 52Z" />
            <path d="M30 56H70" />
          </g>
          <path id="hr-star" d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />
        </defs>
      </svg>

      {/* left side: gopuram, diyas, kalash, lotus */}
      <div
        ref={leftRef}
        aria-hidden
        className="hr-root pointer-events-none absolute bottom-8 left-0 top-0 -z-10 hidden w-[calc(50%-500px)] text-[#f6c453] will-change-transform min-[1280px]:block"
      >
        <svg viewBox="0 0 260 560" className="hr-shine h-full w-full" preserveAspectRatio="xMidYMid meet">
          <Halo />
          <g opacity="0.6">
            <Particles seed={0} />
          </g>

          <g {...stroke} opacity="0.9">
            {/* gopuram with glowing finial */}
            <g className="hr-float">
              <circle cx="130" cy="55" r="22" fill="url(#hr-glow)" stroke="none" className="hr-glow" />
              <g transform="translate(40 40) scale(1.5)">
                <use href="#hr-gopuram" />
              </g>
            </g>

            <Diya x={70} y={250} s={1.2} delay={0} />

            {/* kalash with swaying leaves */}
            <g transform="translate(82 360) scale(1.2)">
              <circle cx="40" cy="56" r="40" fill="url(#hr-glow)" stroke="none" className="hr-glow" style={d(0.6)} />
              <use href="#hr-kalash-body" />
              <g className="hr-sway">
                <use href="#hr-kalash-top" />
              </g>
            </g>

            <Lotus x={65} y={480} s={1.3} delay={0.3} />
          </g>

          <Stars
            list={[
              [22, 28, 0.9, 0],
              [214, 150, 0.7, 0.8],
              [30, 340, 0.6, 1.5],
              [220, 470, 0.8, 0.4],
              [200, 60, 0.5, 2.1],
              [40, 200, 0.5, 1.1],
              [224, 300, 0.6, 1.9],
            ]}
          />
        </svg>
      </div>

      {/* right side: dhupkati, bell, diya, lotus */}
      <div
        ref={rightRef}
        aria-hidden
        className="hr-root pointer-events-none absolute bottom-8 right-0 top-0 -z-10 hidden w-[calc(50%-500px)] text-[#f6c453] will-change-transform min-[1280px]:block"
      >
        <svg viewBox="0 0 260 560" className="hr-shine h-full w-full" preserveAspectRatio="xMidYMid meet">
          <Halo />
          <g opacity="0.6">
            <Particles seed={4} />
          </g>

          <g {...stroke} opacity="0.9">
            {/* dhupkati with flowing smoke */}
            <g transform="translate(65 30) scale(1.3)">
              <circle cx="50" cy="50" r="40" fill="url(#hr-glow)" stroke="none" className="hr-glow" />
              <use href="#hr-dhupkati-body" />
              <g className="hr-drift">
                <path pathLength={100} className="hr-smoke" style={d(0)} d="M34 34C28 28 40 24 34 18C30 14 36 10 33 6" />
                <path pathLength={100} className="hr-smoke" style={d(1.2)} d="M50 30C44 24 56 20 50 14C46 10 52 6 50 2" />
                <path pathLength={100} className="hr-smoke" style={d(2.4)} d="M66 34C60 28 72 24 66 18C62 14 68 10 66 6" />
              </g>
            </g>

            {/* swinging bell */}
            <g transform="translate(91 190) scale(1.3)">
              <g className="hr-swing">
                <use href="#hr-bell-body" />
                <g className="hr-clap">
                  <use href="#hr-bell-clapper" />
                </g>
              </g>
            </g>

            <Diya x={70} y={320} s={1.2} delay={0.5} />
            <Lotus x={65} y={450} s={1.3} delay={0.9} />
          </g>

          <Stars
            list={[
              [212, 24, 0.9, 0.3],
              [26, 170, 0.7, 1.2],
              [222, 360, 0.6, 0],
              [30, 500, 0.8, 1.7],
              [30, 90, 0.5, 2.3],
              [226, 230, 0.5, 0.9],
              [200, 520, 0.6, 1.4],
            ]}
          />
        </svg>
      </div>
    </>
  );
}