const css = `
@keyframes pg-twinkle {
  0%,100% { opacity: .15; transform: scale(.6) rotate(0deg); }
  50%     { opacity: .75; transform: scale(1.2) rotate(45deg); }
}
@keyframes pg-flame {
  0%,100% { transform: scale(1,1) skewX(0deg); }
  30%     { transform: scale(.93,1.1) skewX(-3deg); }
  60%     { transform: scale(1.05,.94) skewX(2.5deg); }
}
@keyframes pg-glow {
  0%,100% { opacity: .35; transform: scale(.9); }
  50%     { opacity: .8;  transform: scale(1.1); }
}
@keyframes pg-rise {
  0%   { transform: translateY(0); opacity: 0; }
  12%  { opacity: .7; }
  100% { transform: translateY(-110vh); opacity: 0; }
}
@keyframes pg-breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }

.pg-star   { animation: pg-twinkle 4s ease-in-out infinite; }
.pg-flame  { transform-box: fill-box; transform-origin: 50% 100%; animation: pg-flame 1.6s ease-in-out infinite; }
.pg-glow   { animation: pg-glow 2.6s ease-in-out infinite; }
.pg-ember  { opacity: 0; animation: pg-rise 16s linear infinite; }
.pg-breathe{ transform-box: fill-box; transform-origin: 50% 100%; animation: pg-breathe 5s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .pg-star, .pg-flame, .pg-glow, .pg-ember, .pg-breathe { animation: none !important; }
  .pg-ember { opacity: 0 !important; }
}
`;

const STARS: [number, number, number, number][] = [
  [6, 14, 18, 0], [93, 10, 14, 1.2], [14, 42, 12, 2.1], [88, 38, 18, 0.6],
  [4, 66, 14, 1.6], [96, 62, 12, 2.6], [22, 88, 16, 0.9], [78, 90, 14, 1.9],
  [50, 6, 12, 2.3], [48, 52, 10, 0.3],
];

function SideDiya({ className }: { className: string }) {
  return (
    <div className={`absolute hidden w-24 text-[#a8731a] xl:block ${className}`}>
      <svg viewBox="0 0 100 80" className="h-auto w-full overflow-visible">
        <defs>
          <radialGradient id="pg-halo">
            <stop offset="0%" stopColor="#ffd98a" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f6c453" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="26" r="46" fill="url(#pg-halo)" className="pg-glow" style={{ transformBox: "fill-box", transformOrigin: "center" }} />
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.55">
          <path d="M10 40H90C90 58 72 68 50 68C28 68 10 58 10 40Z" />
          <path d="M22 50C34 56 66 56 78 50" />
          <path d="M34 68H66M40 72H60" />
        </g>
        <g className="pg-flame" fill="#f2b632" fillOpacity="0.55" stroke="#c9922b" strokeWidth="1.4" strokeLinejoin="round" opacity="0.9">
          <path d="M50 38C40 28 40 16 50 4C60 16 60 28 50 38Z" />
        </g>
      </svg>
    </div>
  );
}

export default function PageArt() {
  const stroke = {
    fill: "none",
    stroke: "#a8731a",
    strokeWidth: 2.4,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const;

  return (
    <>
      <style>{css}</style>

      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* tiled motif pattern */}
        <svg className="absolute inset-0 h-full w-full">
          <defs>
            <g id="pg-gopuram">
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
              <path d="M38 88V82a3 3 0 0 1 6 0V88M76 88V82a3 3 0 0 1 6 0V88M56 72V66a4 4 0 0 1 8 0V72" />
            </g>
            <g id="pg-diya">
              <path d="M10 40H90C90 58 72 68 50 68C28 68 10 58 10 40Z" />
              <path d="M50 38C40 28 40 16 50 4C60 16 60 28 50 38Z" />
              <path d="M50 30C46 25 46 20 50 14C54 20 54 25 50 30Z" />
              <path d="M22 50C34 56 66 56 78 50" />
              <path d="M34 68H66M40 72H60" />
            </g>
            <g id="pg-dhupkati">
              <path d="M40 56L34 34M50 56V30M60 56L66 34" />
              <path d="M34 34C28 28 40 24 34 18C30 14 36 10 33 6" />
              <path d="M50 30C44 24 56 20 50 14C46 10 52 6 50 2" />
              <path d="M66 34C60 28 72 24 66 18C62 14 68 10 66 6" />
              <path d="M20 56H80" />
              <path d="M24 56C24 68 36 76 50 76C64 76 76 68 76 56" />
              <path d="M32 64H68" />
              <path d="M50 76V90" />
              <path d="M32 104C32 96 40 90 50 90C60 90 68 96 68 104Z" />
              <path d="M28 104H72" />
            </g>
            <g id="pg-kalash">
              <path d="M28 38H52V46C62 52 66 62 62 72C58 84 50 90 40 90C30 90 22 84 18 72C14 62 18 52 28 46Z" />
              <path d="M24 38H56" />
              <path d="M20 62H60" />
              <path d="M31 30C31 18 49 18 49 30C49 38 31 38 31 30Z" />
              <path d="M40 20C26 18 18 24 14 32C26 34 34 30 40 20Z" />
              <path d="M40 20C54 18 62 24 66 32C54 34 46 30 40 20Z" />
            </g>
            <g id="pg-bell">
              <path d="M30 0V8" />
              <path d="M25 14C25 6 35 6 35 14" />
              <path d="M12 56C12 32 20 16 30 16C40 16 48 32 48 56" />
              <path d="M6 56H54C54 62 50 64 46 64H14C10 64 6 62 6 56Z" />
              <path d="M16 44H44" />
              <path d="M30 64V70" />
              <circle cx="30" cy="74" r="3" />
            </g>
            <g id="pg-lotus">
              <path d="M50 8C40 24 40 40 50 52C60 40 60 24 50 8Z" />
              <path d="M50 52C30 48 18 34 18 20C32 22 44 34 50 52Z" />
              <path d="M50 52C70 48 82 34 82 20C68 22 56 34 50 52Z" />
              <path d="M50 52C26 54 8 46 2 32C16 30 36 38 50 52Z" />
              <path d="M50 52C74 54 92 46 98 32C84 30 64 38 50 52Z" />
              <path d="M30 56H70" />
            </g>
            <path id="pg-spark" d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />

            <pattern id="pg-tile" width="420" height="420" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
              {/* faint dashed rings for depth */}
              <g fill="none" stroke="#a8731a" strokeWidth="1" opacity="0.14">
                <circle cx="95" cy="205" r="70" strokeDasharray="2 7" />
                <circle cx="320" cy="300" r="62" strokeDasharray="2 7" />
              </g>

              <g {...stroke} opacity="0.3">
                <use href="#pg-bell" transform="translate(108 30) scale(.62)" />
                <use href="#pg-diya" transform="translate(262 34) scale(.5)" />
                <use href="#pg-dhupkati" transform="translate(52 128) scale(.55)" />
                <use href="#pg-lotus" transform="translate(300 150) scale(.5)" />
                <use href="#pg-gopuram" transform="translate(30 250) scale(.55)" />
                <use href="#pg-kalash" transform="translate(300 260) scale(.62)" />
                <use href="#pg-lotus" transform="translate(150 316) scale(.5)" />
                <use href="#pg-diya" transform="translate(236 372) scale(.42)" />
              </g>

              <g fill="#c8922a" opacity="0.45">
                <use href="#pg-spark" transform="translate(190 150) scale(.5)" />
                <use href="#pg-spark" transform="translate(12 60) scale(.4)" />
                <use href="#pg-spark" transform="translate(372 56) scale(.45)" />
                <use href="#pg-spark" transform="translate(220 230) scale(.35)" />
                <use href="#pg-spark" transform="translate(110 392) scale(.4)" />
                <use href="#pg-spark" transform="translate(386 360) scale(.5)" />
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pg-tile)" />
        </svg>

        {/* twinkling stars */}
        {STARS.map(([l, t, s, delay], i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            width={s}
            height={s}
            className="pg-star absolute text-[#d9a02f]"
            style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${delay}s`, transformOrigin: "center", transformBox: "fill-box" }}
          >
            <use href="#pg-spark" fill="currentColor" />
          </svg>
        ))}

        {/* rising embers */}
        {Array.from({ length: 12 }, (_, i) => (
          <span
            key={i}
            className="pg-ember absolute bottom-0 rounded-full bg-[#e0a63a]"
            style={{
              left: `${6 + ((i * 37) % 90)}%`,
              width: 3 + (i % 3),
              height: 3 + (i % 3),
              animationDuration: `${14 + (i % 5) * 3}s`,
              animationDelay: `${-i * 2.3}s`,
            }}
          />
        ))}

        {/* flickering diyas in the side margins */}
        <SideDiya className="bottom-[8%] left-[2%]" />
        <SideDiya className="bottom-[8%] right-[2%]" />
      </div>
    </>
  );
}