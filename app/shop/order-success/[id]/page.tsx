import Link from "next/link";
import { Check } from "lucide-react";

export default async function Success({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-[520px] px-6 py-16 text-center">
      <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-green-100">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-green-600 text-white"><Check size={34} /></div>
      </div>
      <h1 className="mt-6 text-3xl font-black">Order placed!</h1>
      <p className="mt-1 font-bold text-[#e0622d]">Order #{id}</p>
      <p className="mt-2 text-sm text-[#6b4a4a]">Your order has been placed successfully. We'll keep you updated on its status.</p>
      <Link href="/shop" className="mt-8 block rounded-full border-2 border-[#e0622d] py-3 font-bold text-[#e0622d]">Continue Shopping</Link>
      <Link href="/shop/orders" className="shop-gold-btn mt-3 block rounded-full py-3.5">View Order Status</Link>
    </div>
  );
}