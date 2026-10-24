"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Manrope, Marcellus } from "next/font/google";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Download,
  Flame,
  LogIn,
  Menu,
  Package,
  Play,
  ShoppingBag,
  Star,
  Store,
  Truck,
  X,
} from "lucide-react";

/* ───────────────────────── Fonts ───────────────────────── */
const marcellus = Marcellus({ weight: "400", subsets: ["latin"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], display: "swap" });

/* ───────────────────────── Config ───────────────────────── */
const SITE = {
  name: "AYENDRI",
  tagline: "Sacred for a Higher You",
};

const PHOTOS = "/img/photos";

const BRAND_ICON = `${PHOTOS}/ayendri-logo.png`;

const IMAGES = {
  logo: BRAND_ICON,
  appIcon: BRAND_ICON,
  appScreen: {
    src: `${PHOTOS}/app-screen.png`,
    alt: "AYENDRI app home screen showing curated spiritual products",
    width: 1088,
    height: 1920,
  },
  hero: {
    src: `${PHOTOS}/hero.jpg`,
    alt: "Brass oil lamps, marigold flowers and a rudraksha mala glowing in warm golden light",
    width: 1920,
    height: 1088,
  },
  experience: {
    src: `${PHOTOS}/experience-hands.jpg`,
    alt: "Hands holding a rudraksha mala in prayer by warm lamplight",
    width: 1024,
    height: 1360,
  },
};

const DOWNLOAD_LINKS = {
  // ⚠️ PLACEHOLDER: real Google Play URL diye replace koro
  googlePlay: "https://play.google.com/store/apps/details?id=REPLACE_WITH_AYENDRI_APP_ID",
  // ⚠️ PLACEHOLDER: real APK URL diye replace koro
  apk: "https://REPLACE-WITH-OFFICIAL-HOST/ayendri-app-latest.apk",
};

const NAV_LINKS = [
  { label: "Collections", href: "#collections" },
  { label: "Experience", href: "#experience" },
  { label: "Get Started", href: "#start" },
  { label: "Download", href: "#download" },
];

const PRODUCTS = [
  {
    id: "rudraksha",
    name: "Rudraksha",
    blurb: "Energised beads, sourced and certified at the origin.",
    image: `${PHOTOS}/product-rudraksha.jpg`,
    alt: "Rudraksha mala resting on a polished brass Shiva lingam",
  },
  {
    id: "malas",
    name: "Malas",
    blurb: "Hand-strung tulsi, sandalwood and lotus seed japa malas.",
    image: `${PHOTOS}/product-mala.jpg`,
    alt: "Tulsi and sandalwood prayer mala with a gold lotus pendant",
  },
  {
    id: "idols",
    name: "Idols & Deities",
    blurb: "Hand-finished brass murtis for your home mandir.",
    image: `${PHOTOS}/product-idol.jpg`,
    alt: "Polished brass Ganesha idol on an ivory stone pedestal",
  },
  {
    id: "jewellery",
    name: "Temple Jewellery",
    blurb: "Traditional gold-finish pieces with sacred motifs.",
    image: `${PHOTOS}/product-jewellery.jpg`,
    alt: "Ornate gold temple necklace with ruby and pearl accents",
  },
  {
    id: "puja",
    name: "Puja Essentials",
    blurb: "Thalis, diyas, kalash and natural incense, curated as sets.",
    image: `${PHOTOS}/product-puja.jpg`,
    alt: "Brass puja thali with a glowing diya, kalash and incense sticks",
  },
];

const PILLARS = [
  {
    icon: BadgeCheck,
    title: "Authenticity, certified",
    body: "Every rudraksha and mala is sourced at origin and verified by trusted pandits before listing.",
  },
  {
    icon: Flame,
    title: "Energised with care",
    body: "Products are blessed and quality-checked, so what arrives home carries the right spirit.",
  },
  {
    icon: Truck,
    title: "Doorstep sanctity",
    body: "Thoughtful, tamper-proof packaging keeps your sacred items pristine from our hands to yours.",
  },
];

const STEPS = [
  {
    step: "01",
    icon: Store,
    title: "Create your store",
    desc: "Register and set up your store profile with address, timing and contact details in minutes.",
  },
  {
    step: "02",
    icon: Package,
    title: "Add your products",
    desc: "Upload products with images, prices and descriptions. Manage your full catalogue easily.",
  },
  {
    step: "03",
    icon: Star,
    title: "Grow your sales",
    desc: "Get discovered by customers, collect reviews and track performance in real time.",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { label: "Collections", href: "#collections" },
      { label: "The AYENDRI Experience", href: "#experience" },
      { label: "Get the App", href: "#download" },
      { label: "Visit Store", href: "/store" },
      { label: "Store Login", href: "/login" },
    ],
  },
  {
    title: "Categories",
    links: [
      { label: "Rudraksha", href: "#collections" },
      { label: "Malas", href: "#collections" },
      { label: "Idols & Deities", href: "#collections" },
      { label: "Puja Essentials", href: "#collections" },
    ],
  },
  {
    title: "Support",
    links: [
      // ⚠️ PLACEHOLDER: real page thakle href gulo change koro
      { label: "Contact Us", href: "#contact" },
      { label: "FAQs", href: "#faq" },
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Use", href: "#terms" },
    ],
  },
];

/* ───────────────────────── Social icons (inline SVG) ───────────────────────── */
type IconProps = { className?: string };

function InstagramIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// ⚠️ PLACEHOLDER: official profile link diye replace koro
const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://instagram.com/REPLACE_WITH_AYENDRI_HANDLE", icon: InstagramIcon },
  { label: "YouTube", href: "https://youtube.com/@REPLACE_WITH_AYENDRI_HANDLE", icon: YoutubeIcon },
  { label: "X", href: "https://x.com/REPLACE_WITH_AYENDRI_HANDLE", icon: XIcon },
];

function DisableAdminKitCss() {
  useLayoutEffect(() => {
    const links = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    ).filter((l) => l.getAttribute("href")?.includes("/css/app.css"));

    links.forEach((l) => {
      l.disabled = true;
    });

    return () => {
      links.forEach((l) => {
        l.disabled = false;
      });
    };
  }, []);

  return null;
}

/* ───────────────────────── Reveal (no extra deps) ───────────────────────── */
function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -80px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 750ms cubic-bezier(.22,1,.36,1) ${delay}s, transform 750ms cubic-bezier(.22,1,.36,1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

/* ───────────────────────── Navbar ───────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const solid = scrolled || open;
  const tone = solid ? "text-[var(--ay-foreground)]" : "text-[var(--ay-ivory)]";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid
          ? "border-b border-[var(--ay-border)] bg-[color-mix(in_oklab,var(--ay-ivory)_92%,transparent)] shadow-[0_8px_30px_-18px_rgba(0,0,0,0.25)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:h-20 sm:px-8"
        aria-label="Main"
      >
        <a href="#top" className="flex items-center gap-3" aria-label={`${SITE.name} home`}>
          <Image
            src={IMAGES.logo}
            alt={`${SITE.name} logo`}
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-xl object-cover shadow-md sm:h-11 sm:w-11"
          />
          <span className={`ay-display text-xl tracking-wide ${tone}`}>{SITE.name}</span>
        </a>

        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`group relative text-sm font-semibold tracking-wide transition-colors hover:text-[var(--ay-primary)] ${tone}`}
            >
              {l.label}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[var(--ay-primary)] transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
          <Link
            href="/store"
            className={`text-sm font-semibold transition-colors hover:text-[var(--ay-primary)] ${tone}`}
          >
            Visit Store
          </Link>
          <Link href="/login" className="ay-btn ay-btn-hero ay-btn-sm">
            Login <LogIn className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={`grid h-11 w-11 place-items-center rounded-full border transition-colors md:hidden ${
            solid ? "border-[var(--ay-border)]" : "border-white/30"
          } ${tone}`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <div
        className={`grid overflow-hidden border-t border-[var(--ay-border)] bg-[color-mix(in_oklab,var(--ay-ivory)_96%,transparent)] backdrop-blur-xl transition-all duration-300 md:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] border-t-0 opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-1 px-5 py-6">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-base font-semibold text-[var(--ay-foreground)] transition-colors hover:bg-[oklch(0.905_0.05_70)] hover:text-[var(--ay-primary)]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-3">
              <Link href="/login" className="ay-btn ay-btn-hero w-full">
                Login <LogIn className="h-4 w-4" />
              </Link>
              <Link href="/store" className="ay-btn ay-btn-outline-dark w-full">
                <ShoppingBag className="h-4 w-4" /> Visit Store
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (bgRef.current) {
          bgRef.current.style.transform = `translateY(${Math.min(window.scrollY, 900) * 0.18}px)`;
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section
      id="top"
      className="relative flex min-h-svh items-center overflow-hidden bg-[var(--ay-deep)] text-[var(--ay-ivory)]"
    >
      <div ref={bgRef} className="absolute -inset-y-10 inset-x-0 will-change-transform" aria-hidden="true">
        <Image
          src={IMAGES.hero.src}
          alt={IMAGES.hero.alt}
          width={IMAGES.hero.width}
          height={IMAGES.hero.height}
          sizes="100vw"
          priority
          className="h-full w-full object-cover"
        />
      </div>

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[var(--ay-deep)]/95 via-[var(--ay-deep)]/55 to-[var(--ay-deep)]/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[var(--ay-deep)]/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--ay-deep)]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="ay-float absolute right-[12%] top-[24%] hidden h-40 w-40 rounded-full bg-[var(--ay-gold)]/20 blur-3xl md:block"
      />
      <div
        aria-hidden="true"
        className="ay-float absolute bottom-[18%] right-[30%] hidden h-24 w-24 rounded-full bg-[var(--ay-primary)]/25 blur-2xl md:block"
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-28 pt-36 sm:px-8 sm:pt-40">
        <div className="max-w-2xl">
          <Reveal>
            <p className="ay-eyebrow text-[var(--ay-gold)]">Curated Hindu Spiritual Essentials</p>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="ay-display mt-6 text-5xl leading-[1.05] tracking-tight text-[var(--ay-ivory)] sm:text-6xl lg:text-7xl">
              Where devotion
              <span className="block text-[var(--ay-gold)]">meets everyday grace</span>
            </h1>
          </Reveal>

          <Reveal delay={0.24}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-[var(--ay-ivory)]/75 sm:text-lg">
              AYENDRI brings you authentic rudraksha, hand-strung malas, sacred idols and puja
              essentials — sourced with reverence, delivered with care.
            </p>
          </Reveal>

          <Reveal delay={0.36}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href={DOWNLOAD_LINKS.googlePlay}
                target="_blank"
                rel="noreferrer"
                className="ay-btn ay-btn-hero"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Download on Google Play
              </a>
              <a
                href={DOWNLOAD_LINKS.apk}
                target="_blank"
                rel="noreferrer"
                className="ay-btn ay-btn-outline-light"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download APK
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.48}>
            <div
              className="mt-9 flex items-center gap-3 text-sm text-[var(--ay-ivory)]/70"
              aria-label="Rated 4.8 by over ten thousand devotees"
            >
              <span className="flex items-center gap-1 text-[var(--ay-gold)]" aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </span>
              <span>
                <strong className="font-semibold text-[var(--ay-ivory)]">4.8</strong> · loved by
                10,000+ devotees
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      <a
        href="#collections"
        aria-label="Scroll to collections"
        className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2 text-[var(--ay-ivory)]/60 transition-colors hover:text-[var(--ay-ivory)]"
      >
        <ChevronDown className="ay-scroll-cue h-7 w-7" aria-hidden="true" />
      </a>
    </section>
  );
}

/* ───────────────────────── Collections ───────────────────────── */
function Collections() {
  return (
    <section id="collections" className="overflow-hidden bg-[var(--ay-background)] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="ay-eyebrow text-[var(--ay-primary)]">Curated Collections</p>
          <h2 className="ay-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
            Everything your sadhana needs
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ay-muted-fg)] sm:text-lg">
            Five sacred categories, one standard — authenticity. Every piece is verified before it
            reaches your mandir.
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.15} className="mt-12 sm:mt-16">
        <div className="ay-no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:gap-7 sm:px-8 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {PRODUCTS.map((p) => (
            <article
              key={p.id}
              className="group w-[76vw] min-w-[260px] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-3xl border border-[var(--ay-border)] bg-[var(--ay-card)] shadow-[0_10px_40px_-24px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.3)] sm:w-[320px]"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image
                  src={p.image}
                  alt={p.alt}
                  width={1024}
                  height={1360}
                  sizes="320px"
                  className="h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[var(--ay-deep)]/25 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              </div>
              <div className="p-6">
                <h3 className="ay-display text-xl transition-colors duration-300 group-hover:text-[var(--ay-primary)] sm:text-2xl">
                  {p.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ay-muted-fg)]">{p.blurb}</p>
                <Link
                  href="/store"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--ay-primary)] opacity-100 transition-all duration-500 md:opacity-0 md:group-hover:opacity-100"
                >
                  Explore in store
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
          <div aria-hidden="true" className="w-2 shrink-0 sm:w-6" />
        </div>
      </Reveal>

      <Reveal delay={0.2} className="mx-auto mt-10 max-w-7xl px-5 sm:px-8">
        <p className="text-center text-sm text-[var(--ay-muted-fg)]">
          Swipe to explore — every product is authenticity-verified.
        </p>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── Experience ───────────────────────── */
function Experience() {
  return (
    <section
      id="experience"
      className="relative overflow-hidden bg-[var(--ay-deep)] py-20 text-[var(--ay-ivory)] sm:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[var(--ay-gold)]/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[var(--ay-primary)]/10 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <Reveal>
          <div className="relative mx-auto max-w-md lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-[2rem] border border-[var(--ay-gold)]/30 sm:-inset-4"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-6 -right-6 h-full w-full rounded-[2rem] border border-[var(--ay-gold)]/15"
            />
            <Image
              src={IMAGES.experience.src}
              alt={IMAGES.experience.alt}
              width={IMAGES.experience.width}
              height={IMAGES.experience.height}
              sizes="(min-width: 1024px) 40vw, 448px"
              className="relative aspect-[3/4] w-full rounded-[2rem] object-cover shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]"
            />
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="ay-eyebrow text-[var(--ay-gold)]">The AYENDRI Experience</p>
            <h2 className="ay-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
              Sacred for a higher you
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ay-ivory)]/70 sm:text-lg">
              We believe devotion deserves more than a checkout page. Every product, every order,
              every detail honoured.
            </p>
          </Reveal>

          <div className="mt-10 flex flex-col gap-8">
            {PILLARS.map((p, i) => (
              <Reveal key={p.title} delay={0.1 + i * 0.12}>
                <div className="flex gap-5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[var(--ay-gold)]/30 bg-[var(--ay-gold)]/10 text-[var(--ay-gold)]">
                    <p.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="ay-display text-lg text-[var(--ay-ivory)] sm:text-xl">{p.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[var(--ay-ivory)]/65">{p.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Get Started (store owners) ───────────────────────── */
function GetStarted() {
  return (
    <section id="start" className="relative overflow-hidden bg-[var(--ay-background)] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--ay-gold)]/50 to-transparent"
      />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="ay-eyebrow text-[var(--ay-primary)]">How it works</p>
          <h2 className="ay-display mt-5 text-4xl leading-tight tracking-tight sm:text-5xl">
            Create your store, sell smarter
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--ay-muted-fg)] sm:text-lg">
            Three simple steps from registration to your first order.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.step} delay={0.1 + i * 0.12}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-[var(--ay-border)] bg-[var(--ay-card)] p-7 shadow-[0_10px_40px_-24px_rgba(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_60px_-24px_rgba(0,0,0,0.25)]">
                <span className="ay-display pointer-events-none absolute right-5 top-4 select-none text-5xl text-[var(--ay-gold)]/25">
                  {s.step}
                </span>
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--ay-gold)]/40 bg-[var(--ay-gold)]/15 text-[var(--ay-ember)]">
                  <s.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="ay-display mt-5 text-xl sm:text-2xl">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ay-muted-fg)]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <Link href="/login" className="ay-btn ay-btn-hero">
              Get Started <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/store" className="ay-btn ay-btn-outline-dark">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Visit Store
            </Link>
          </div>
          <p className="mt-5 text-center text-sm text-[var(--ay-muted-fg)]">
            Free to register · Instant setup · Secure &amp; verified
          </p>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Download CTA ───────────────────────── */
function DownloadCta() {
  const [hover, setHover] = useState(false);

  return (
    <section id="download" className="relative overflow-hidden bg-[var(--ay-background)] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[var(--ay-gold)]/50 to-transparent"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-20">
        <div className="order-2 lg:order-1">
          <Reveal>
            <Image
              src={IMAGES.appIcon}
              alt="AYENDRI app icon"
              width={96}
              height={96}
              sizes="80px"
              className="ay-float h-20 w-20 rounded-2xl object-cover shadow-[0_18px_40px_-16px_rgba(0,0,0,0.35)]"
            />
            <h2 className="ay-display mt-7 text-4xl leading-tight tracking-tight sm:text-5xl">
              Carry AYENDRI with you
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--ay-muted-fg)] sm:text-lg">
              Shop authentic spiritual essentials, follow guided puja collections and receive your
              order with doorstep sanctity — all from one beautifully crafted app.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href={DOWNLOAD_LINKS.googlePlay}
                target="_blank"
                rel="noreferrer"
                className="ay-btn ay-btn-hero"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                Download on Google Play
              </a>
              <a
                href={DOWNLOAD_LINKS.apk}
                target="_blank"
                rel="noreferrer"
                className="ay-btn ay-btn-outline-dark"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download APK
              </a>
            </div>
            <p className="mt-5 text-sm text-[var(--ay-muted-fg)]">
              Android 8.0 and above · Free to download
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} className="order-1 lg:order-2">
          <div
            className="relative mx-auto w-fit"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
          >
            <div
              aria-hidden="true"
              className="ay-glow-pulse absolute -inset-10 rounded-full bg-[var(--ay-gold)]/20 blur-3xl"
            />
            <div
              className="relative w-[260px] transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:w-[320px]"
              style={{
                transform: hover ? "rotate(-1.5deg) scale(1.02)" : "rotate(0deg) scale(1)",
              }}
            >
              <Image
                src={IMAGES.appScreen.src}
                alt={IMAGES.appScreen.alt}
                width={IMAGES.appScreen.width}
                height={IMAGES.appScreen.height}
                sizes="320px"
                className="h-auto w-full rounded-[2.2rem] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.45)]"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ───────────────────────── Footer ───────────────────────── */
function Footer() {
  return (
    <footer className="bg-[var(--ay-deep)] pt-16 text-[var(--ay-ivory)]/70 sm:pt-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 pb-14 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        {/* Brand */}
        <div className="max-w-sm">
          <Image
            src={IMAGES.logo}
            alt={`${SITE.name} logo`}
            width={48}
            height={48}
            className="h-12 w-12 rounded-xl object-cover"
          />
          <p className="ay-display mt-4 text-xl text-[var(--ay-ivory)]">{SITE.name}</p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--ay-ivory)]/60">
            {SITE.tagline}. Authentic rudraksha, malas, idols and puja essentials — curated with
            reverence for your spiritual journey.
          </p>
          <div className="mt-6 flex gap-3">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${SITE.name} on ${social.label}`}
                className="grid h-10 w-10 place-items-center rounded-full border border-[var(--ay-ivory)]/15 text-[var(--ay-ivory)]/70 transition-all duration-300 hover:border-[var(--ay-gold)]/50 hover:text-[var(--ay-gold)]"
              >
                <social.icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        {/* Link columns */}
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--ay-gold)]">
              {column.title}
            </h3>
            <ul className="mt-5 flex flex-col gap-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("#") ? (
                    <a
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-[var(--ay-gold)]"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="text-sm transition-colors duration-200 hover:text-[var(--ay-gold)]"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--ay-ivory)]/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-7 text-xs text-[var(--ay-ivory)]/45 sm:flex-row sm:px-8">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved. · Powered by AMP Technology
          </p>
          <p>{PRODUCTS.length} sacred categories · Made with devotion in India</p>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className={`ay-landing min-h-screen ${manrope.className}`}>
      <DisableAdminKitCss />
      <style>{`.ay-landing .ay-display{font-family:${marcellus.style.fontFamily},Georgia,serif}`}</style>
      <Navbar />
      <main>
        <Hero />
        <Collections />
        <Experience />
        <GetStarted />
        <DownloadCta />
      </main>
      <Footer />
    </div>
  );
}