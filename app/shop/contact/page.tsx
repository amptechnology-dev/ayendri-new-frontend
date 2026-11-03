import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us | AYENDRI",
  description: "Learn about AYENDRI, our story, our products and our promise.",
  alternates: { canonical: "/shop/about" },
};

export default function Page() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-10">
      <h1 className="text-3xl font-black text-[#4a0710]">About AYENDRI</h1>
      <p className="mt-4 text-sm leading-7">[Your content here]</p>
    </div>
  );
}