import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Editorial Policy | AYENDRI",
  description:
    "How AYENDRI researches, writes and reviews the product information and guides published on our shop.",
  alternates: { canonical: "/shop/editorial-policy" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-10">
      <h1 className="text-3xl font-black text-[#4a0710]">Editorial Policy</h1>
      <p className="mt-2 text-xs text-[#6b4a4a]">
        Last updated <time dateTime="2026-11-03">3 November 2026</time>
      </p>

      <h2 className="mt-8 text-xl font-extrabold text-[#4a0710]">Our commitment</h2>
      <p className="mt-3 text-sm leading-7">
        Everything we publish about our products, from Rudraksha and malas to idols, jewellery and puja
        essentials, is written to be accurate, honest and useful. We describe what we sell as it is.
      </p>

      <h2 className="mt-8 text-xl font-extrabold text-[#4a0710]">How we write and review</h2>
      <p className="mt-3 text-sm leading-7">
        Product descriptions are written by our team and checked against the actual product before they
        go live. Spiritual and traditional information is based on established sources and reviewed by
        [name or role of reviewer] before publishing.
      </p>

      <h2 className="mt-8 text-xl font-extrabold text-[#4a0710]">Corrections and updates</h2>
      <p className="mt-3 text-sm leading-7">
        If you find a mistake, write to us at [your email] and we will review it and correct it promptly.
        Pages show the date they were last updated.
      </p>

      <h2 className="mt-8 text-xl font-extrabold text-[#4a0710]">Independence</h2>
      <p className="mt-3 text-sm leading-7">
        We do not publish paid reviews or undisclosed promotions. Customer reviews are shown as
        submitted by verified buyers.
      </p>
    </div>
  );
}