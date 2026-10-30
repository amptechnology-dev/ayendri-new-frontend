// import Link from "next/link";
// import Image from "next/image";
// import { ChevronRight } from "lucide-react";
// import { inr } from "../data";
// import { useShop } from "../shop-data";

// const HEADER = 130; // px, height of your sticky header when scrolled; tweak if needed

// /* ───────── diya sticker (left + mirrored right) ───────── */
// const Diya = ({ flip = false }: { flip?: boolean }) => (
//   <svg viewBox="0 0 100 84" className="h-[clamp(46px,9vh,84px)] w-auto shrink-0 drop-shadow-[0_4px_0_rgba(90,15,26,.3)]" style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
//     <defs>
//       <linearGradient id="dz-bowl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c2273a" /><stop offset="1" stopColor="#6e0f1f" /></linearGradient>
//       <linearGradient id="dz-fl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff8a1f" /><stop offset="1" stopColor="#ffd44d" /></linearGradient>
//     </defs>
//     <path d="M50 3C60 16 64 26 58 35C55 40 45 40 42 35C36 26 40 15 50 3Z" fill="url(#dz-fl)" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
//     <path d="M50 20C54 26 55 31 52.5 34.5C51 36.5 49 36.5 47.5 34.5C45 31 46.5 26 50 20Z" fill="#fff6c2" />
//     <path d="M6 46H94C94 66 76 80 50 80C24 80 6 66 6 46Z" fill="url(#dz-bowl)" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" />
//     <path d="M6 46C20 40 80 40 94 46C80 52 20 52 6 46Z" fill="#f6b73c" stroke="#fff" strokeWidth="3" strokeLinejoin="round" />
//     <circle cx="30" cy="64" r="2.4" fill="#f6b73c" /><circle cx="50" cy="69" r="2.4" fill="#f6b73c" /><circle cx="70" cy="64" r="2.4" fill="#f6b73c" />
//     <path d="M90 12l1.5 3.8 3.8 1.5-3.8 1.5-1.5 3.8-1.5-3.8-3.8-1.5 3.8-1.5z" fill="#fff" />
//   </svg>
// );

// /* ───────── tilted photo ───────── */
// const Img = ({ i, className = "" }: { i: number; className?: string }) => {
//   const products = useShop((s) => s.products);
//   const p = products[i % products.length];
//   if (!p) return null;
//   return (
//     <div className={`absolute overflow-hidden rounded-[14px] border-2 border-white/90 shadow-[0_8px_16px_rgba(90,40,10,.28)] transition duration-500 ${className}`}>
//       <Image src={p.image} alt="" fill sizes="220px" className="object-cover" />
//     </div>
//   );
// };

// const CARD = "bg-gradient-to-b from-[#fff8e8] to-[#ffefce] shadow-[0_14px_30px_-12px_rgba(120,60,10,.45)]";

// function CatCard({ up, title, a, b }: { up: number; title: string; a: number; b: number }) {
//   return (
//     <Link href="/shop/category/all" className={`group relative min-h-[320px] overflow-hidden rounded-[28px] ${CARD} transition duration-300 hover:-translate-y-1.5 md:min-h-0`}>
//       <div className="absolute left-1/2 top-0 z-20 flex -translate-x-1/2 overflow-hidden rounded-b-[10px] text-[clamp(11px,1.55vh,14px)] font-bold leading-none text-white shadow">
//         <span className="bg-[#4a0710] px-2.5 py-[5px]">Up to</span>
//         <span className="bg-[#1a7a3c] px-2.5 py-[5px]">{up}% OFF</span>
//       </div>
//       <h3 className="px-2 pt-[clamp(30px,6vh,52px)] text-center text-[clamp(15px,2.2vh,20px)] font-extrabold text-[#4a0710]">{title}</h3>
//       <Img i={a} className="-bottom-[3%] -left-[3%] z-10 h-[33%] w-[57%] -rotate-[7deg] group-hover:-rotate-[4deg]" />
//       <Img i={b} className="-bottom-[5%] -right-[4%] h-[31%] w-[57%] rotate-[5deg] group-hover:rotate-[3deg]" />
//     </Link>
//   );
// }

// export default function DharmaFestival() {
//   const products = useShop((s) => s.products);
//   const t = products[0];
//   if (!t) return null;
//   return (
//     <section
//       id="dharma"
//       style={{ ["--dh" as string]: `clamp(640px, calc(100svh - ${HEADER}px), 900px)` } as React.CSSProperties}
//       className="relative flex flex-col overflow-hidden bg-gradient-to-b from-[#ffdf8a] via-[#fcc355] to-[#f6a73a] px-4 pb-[clamp(20px,3.2vh,32px)] pt-[clamp(14px,2.4vh,26px)] md:h-[var(--dh)] md:px-6"
//     >
//       {/* faint ring pattern */}
//       <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70"
//            style={{ background: "radial-gradient(circle at 24px 24px, transparent 13px, rgba(255,255,255,.22) 14px, transparent 15px) 0 0/48px 48px" }} />

//       {/* ── heading ── */}
//       <div className="relative z-10 flex flex-none flex-col items-center text-center">
//         <div className="text-[clamp(11px,1.7vh,16px)] font-extrabold tracking-[.45em] text-[#4a0710]">THE GREAT</div>
//         <div className="flex items-center gap-[clamp(10px,3vw,44px)]">
//           <Diya />
//           <svg viewBox="0 0 520 124" className="h-[clamp(60px,12.5vh,118px)] w-auto" aria-label="DHARMA">
//             {[{ y: 104, fill: "#5a0f1a", sw: 16 }, { y: 98, fill: "#ffffff", sw: 14 }].map((l, k) => (
//               <text key={k} x="260" y={l.y} textAnchor="middle" fontSize="112" fontWeight="900" textLength="480" lengthAdjust="spacingAndGlyphs"
//                     fill={l.fill} stroke="#5a0f1a" strokeWidth={l.sw} strokeLinejoin="round" style={{ paintOrder: "stroke fill", fontFamily: "var(--font-shop), Inter, system-ui, sans-serif" }}>
//                 DHARMA
//               </text>
//             ))}
//           </svg>
//           <Diya flip />
//         </div>
//         <span className="mt-[.6vh] rounded-full bg-gradient-to-b from-[#7d1228] to-[#58091a] px-[clamp(26px,3vw,46px)] py-[clamp(5px,1vh,9px)] text-[clamp(15px,2.3vh,22px)] font-extrabold tracking-[.3em] text-[#f6c75a] shadow-[0_0_0_3px_#fff1c9,0_0_0_6px_#5a0f1a,0_8px_16px_rgba(90,15,26,.35)]">
//           FESTIVAL SALE
//         </span>
//         <p className="mt-[clamp(10px,1.8vh,18px)] text-[clamp(13px,1.95vh,18px)] font-bold text-[#4a0710]">
//           Flat 50% off on bestsellers · Up to 70% off on combos
//         </p>
//       </div>

//       {/* ── cards ── */}
//       <div className="relative z-10 mx-auto mt-[clamp(12px,2.2vh,22px)] grid min-h-0 w-full max-w-[1350px] flex-1 grid-cols-2 gap-[clamp(10px,1.25vw,18px)] md:grid-cols-[1.2fr_repeat(4,1fr)]">
//         <Link href={`/shop/product/${t.slug}`} className={`group relative col-span-2 flex min-h-[380px] flex-col items-center overflow-hidden rounded-[28px] ${CARD} transition duration-300 hover:-translate-y-1.5 md:col-span-1 md:min-h-0`}>
//           <div className="mt-[clamp(10px,2.4vh,24px)] text-[clamp(28px,5.4vh,48px)] font-black leading-none text-[#6e0f1e]">TOP</div>
//           <div className="mt-[.5vh] text-[clamp(9px,1.4vh,13px)] font-bold tracking-[.45em] text-[#4a0710]">DEAL</div>
//           <span className="mt-[1.2vh] rounded-md bg-[#4a0710] px-2 py-px text-[clamp(10px,1.5vh,13px)] font-bold text-white line-through">{inr(t.mrp)}</span>
//           <div className="mt-[.6vh] rounded-[14px] bg-[#1a7a3c] px-[clamp(14px,1.6vw,22px)] py-[.3vh] text-[clamp(26px,5vh,42px)] font-black leading-[1.15] text-white shadow-[0_6px_14px_rgba(26,122,60,.4)]">{inr(t.price)}</div>
//           <div className="mt-[1.4vh] px-4 text-center text-[clamp(13px,2.1vh,19px)] font-extrabold leading-tight text-[#4a0710]">{t.name}</div>
//           <div className="absolute bottom-0 left-1/2 h-[42%] w-[70%] -translate-x-1/2 overflow-hidden rounded-t-[14px] shadow-[0_8px_16px_rgba(90,40,10,.28)]">
//             <Image src={t.image} alt={t.name} fill sizes="260px" className="object-cover transition duration-700 group-hover:scale-105" />
//           </div>
//         </Link>
//         <CatCard up={74} title="Karungali" a={0} b={6} />
//         <CatCard up={90} title="Rudraksha" a={1} b={2} />
//         <CatCard up={73} title="Pyrite for wealth" a={5} b={7} />
//         <CatCard up={67} title="Idols for your mandir" a={3} b={4} />
//       </div>

//       {/* ── Diwali gifting strip ── */}
//       <Link href="/shop/category/all" className={`relative z-10 mx-auto mt-[clamp(10px,1.8vh,18px)] flex h-[clamp(64px,11vh,98px)] w-full max-w-[1350px] flex-none items-center gap-4 rounded-[22px] px-[clamp(14px,1.6vw,26px)] ${CARD} transition hover:-translate-y-0.5`}>
//         <span className="absolute -left-[11px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-[#f8ae40]" />
//         <span className="absolute -right-[11px] top-1/2 h-[22px] w-[22px] -translate-y-1/2 rounded-full bg-[#f8ae40]" />
//         <span className="pointer-events-none absolute inset-[7px] rounded-[16px] border border-dashed border-[#e6b86c]" />
//         <div className="relative flex shrink-0 pl-2">
//           {[3, 4].map((n, k) => (
//             <span key={n} className={`relative h-[clamp(42px,7.2vh,64px)] w-[clamp(42px,7.2vh,64px)] overflow-hidden rounded-lg border-2 border-white shadow-md ${k ? "-ml-4 rotate-6" : "-rotate-6"}`}>
//               <Image src={products[n % products.length].image} alt="" fill sizes="64px" className="object-cover" />
//             </span>
//           ))}
//         </div>
//         <div className="relative min-w-0 flex-1">
//           <div className="text-[clamp(17px,2.9vh,26px)] font-extrabold leading-tight text-[#4a0710]">Diwali gifting</div>
//           <div className="truncate text-[clamp(12px,1.8vh,16px)] text-[#6b4a4a]">Up to 73% off on gifts for family and friends</div>
//         </div>
//         <ChevronRight className="relative shrink-0 text-[#2a0a0d]" />
//       </Link>

//       {/* scalloped bottom edge */}
//       <div aria-hidden className="absolute inset-x-0 bottom-0 z-20 h-[10px]"
//            style={{ background: "radial-gradient(circle at 10px 10px, #fff7ec 7px, transparent 8px) 0 0/20px 10px repeat-x" }} />
//     </section>
//   );
// }