import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";

// Display serif for headings. Body text keeps the shop's own sans font.
const serif = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "About AYENDRI",
  description:
    "Learn who is behind AYENDRI, how we source our Rudraksha, Karungali malas and idols, and what certified and energised means for you.",
  alternates: { canonical: "/shop/about" },
};

const h2Cls = `${serif.className} text-4xl font-medium leading-tight text-[#4a0710] md:text-5xl`;
const h3Cls = `${serif.className} mt-5 text-2xl font-semibold text-[#4a0710]`;
const pCls = "mt-5 text-[17px] leading-8 text-[#3a2a22]";

/* Grey card that holds the place of a photo.
   To use a real photo later, replace the whole <ImagePlaceholder ... /> with:
   <Image src="/img/photos/your-file.jpg" alt="describe the photo" width={1200} height={900}
          className="w-full rounded-md object-cover" /> (import Image from "next/image") */
function ImagePlaceholder({ ratio, label }: { ratio: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`${ratio} flex w-full items-center justify-center rounded-md bg-gray-200 text-sm text-gray-500 ring-1 ring-[#e8d6bd]`}
    >
      Image placeholder
    </div>
  );
}

function Ornament() {
  return (
    <div aria-hidden className="mx-auto flex w-48 items-center gap-3 text-[#c9962b]">
      <span className="h-px flex-1 bg-current opacity-60" />
      <svg viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
        <path d="M6 0l6 6-6 6-6-6z" />
      </svg>
      <span className="h-px flex-1 bg-current opacity-60" />
    </div>
  );
}

export default function Page() {
  return (
    <article>
      {/* HERO */}
      <header className="relative isolate overflow-hidden border-b border-[#e8d6bd] bg-[radial-gradient(ellipse_at_top,#fff0bd_0%,#ffd98a_35%,#ffb55c_75%,#f0913a_100%)] px-6 py-24 text-center md:py-32">
        {/* soft glow in the centre for extra depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,rgba(255,255,255,0)_55%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[820px] w-[820px] -translate-x-1/2 -translate-y-1/2 text-[#b45309] opacity-25 motion-safe:animate-[spin_180s_linear_infinite]"
        >
          <svg viewBox="-300 -300 600 600" fill="none" stroke="currentColor" strokeWidth="0.7">
            {[60, 110, 160, 210, 260, 295].map((r) => (
              <circle key={r} r={r} />
            ))}
            {Array.from({ length: 12 }, (_, i) => (
              <ellipse key={i} rx="26" ry="95" cy="-155" transform={`rotate(${i * 30})`} />
            ))}
          </svg>
        </div>

        <div className="mx-auto max-w-3xl">
          <h1 className={`${serif.className} text-5xl font-medium leading-[1.05] text-[#4a0710] md:text-7xl`}>
            About AYENDRI
          </h1>
          <p className={`${serif.className} mt-5 text-2xl italic text-[#7a1118] md:text-3xl`}>
            Sacred for a Higher You
          </p>
          <p className="mx-auto mt-8 max-w-xl text-[17px] leading-8 text-[#3a2a22]">
            Demo text: AYENDRI is a home for authentic Rudraksha, Karungali malas, idols and puja
            essentials, chosen with care and sent to you with the respect they deserve.
          </p>
        </div>
      </header>

      {/* OUR STORY */}
      <section className="bg-[#fffaf3] px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-[5fr_6fr] md:gap-16">
          <ImagePlaceholder ratio="aspect-[4/5]" label="Portrait of the founder" />
          <div>
            <h2 className={h2Cls}>Our story</h2>
            <p className={pCls}>
              Demo text: AYENDRI began with a simple wish, to make genuine spiritual products easy to
              find and easy to trust. Too often, devotees were left guessing what was real.
            </p>
            <p className={pCls}>
              Demo text: Today a small team, led by [founder name], selects every product by hand and
              answers every question personally.
            </p>
            <blockquote
              className={`${serif.className} mt-8 border-l-2 border-[#f2b632] pl-6 text-2xl italic leading-snug text-[#4a0710]`}
            >
              “Demo quote: a sacred object should be as honest as it is beautiful.”
            </blockquote>
          </div>
        </div>
      </section>

      {/* SOURCING */}
      <section className="bg-[#f6efe6] px-6 py-16 md:py-24">
        <div className="mx-auto grid max-w-[1100px] items-center gap-10 md:grid-cols-[6fr_5fr] md:gap-16">
          <div className="order-2 md:order-1">
            <h2 className={h2Cls}>Where our products come from</h2>
            <p className={pCls}>
              Demo text: We work directly with trusted growers, artisans and temple craftsmen, so we
              know where each bead, mala and idol began its journey.
            </p>
            <p className={pCls}>
              Demo text: Rudraksha beads are the seeds of the Elaeocarpus ganitrus tree, and you can
              read more about it on{" "}
              <a
                href="https://en.wikipedia.org/wiki/Rudraksha"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold !text-[#7a1118] underline underline-offset-4 hover:!text-[#a3161f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b632]"
              >
                Wikipedia
              </a>
              .
            </p>
          </div>
          <div className="order-1 md:order-2">
            <ImagePlaceholder ratio="aspect-[4/3]" label="Artisans at work" />
          </div>
        </div>
      </section>

      {/* CERTIFIED AND ENERGISED */}
      <section className="bg-[#fffaf3] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[1100px]">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className={h2Cls}>What certified and energised means</h2>
            <div className="mt-6">
              <Ornament />
            </div>
            <p className={`${pCls} mt-6`}>
              Demo text: Every piece goes through three quiet steps before it reaches your home.
            </p>
          </div>

          <div className="mt-14 grid gap-12 md:grid-cols-3 md:gap-10">
            <div>
              <ImagePlaceholder ratio="aspect-[4/3]" label="Selecting products by hand" />
              <h3 className={h3Cls}>Chosen by hand</h3>
              <p className="mt-3 text-[16px] leading-7 text-[#3a2a22]">
                Demo text: We look at size, grain, symmetry and finish, and set aside anything that
                falls short.
              </p>
            </div>
            <div>
              <ImagePlaceholder ratio="aspect-[4/3]" label="Checking products before shipping" />
              <h3 className={h3Cls}>Checked before it ships</h3>
              <p className="mt-3 text-[16px] leading-7 text-[#3a2a22]">
                Demo text: Each item is inspected again and packed with a note on what it is and how to
                care for it.
              </p>
            </div>
            <div>
              <ImagePlaceholder ratio="aspect-[4/3]" label="Energising ritual" />
              <h3 className={h3Cls}>Energised with mantra</h3>
              <p className="mt-3 text-[16px] leading-7 text-[#3a2a22]">
                Demo text: Products are energised with traditional mantras and prayers, so they arrive
                ready to be placed in your puja space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="bg-[#4a0710] px-6 py-16 text-center md:py-20">
        <h2 className={`${serif.className} text-4xl font-medium text-[#fff6e0] md:text-5xl`}>
          Begin your collection
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[17px] leading-8 text-white/80">
          Demo text: Explore Rudraksha, malas, idols and puja essentials, or write to us with any
          question.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          <Link
            href="/shop/category/all"
            className="rounded-full border border-[#fff1c2] bg-gradient-to-b from-[#ffd66b] to-[#f2b632] px-8 py-3 font-bold text-[#4a0710] shadow-[0_2px_8px_rgba(0,0,0,.35)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1c2] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a0710]"
          >
            Browse the collection
          </Link>
          <Link
            href="/shop/contact"
            className="font-semibold !text-[#ffd66b] underline underline-offset-4 hover:!text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fff1c2]"
          >
            Contact us
          </Link>
        </div>
        <p className="mt-10 text-xs text-white/70">
          Last updated <time dateTime="2026-11-03">3 November 2026</time>
        </p>
      </section>
    </article>
  );
}