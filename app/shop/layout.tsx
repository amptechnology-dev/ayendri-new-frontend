import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./shop.css";
import ShopHeader from "./components/ShopHeader";
import CartSync from "./components/CartSync";
import ShopFooter from "./components/ShopFooter";
import BottomNav from "./components/BottomNav";
import DisableAdminKitCss from "./components/DisableAdminKitCss";
import ShopGate from "./components/ShopGate";
import ShopLoader from "./components/ShopLoader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shop",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AYENDRI Shop: Sacred for a Higher You",
  description: "Rudraksha, malas, idols, jewellery and puja essentials.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} shop-root`}>
      <DisableAdminKitCss />
      <CartSync />
      <ShopHeader />
      <main className="pb-28">
        <ShopLoader />
        <ShopGate>{children}</ShopGate>
      </main>
      <ShopFooter />
      <BottomNav />
    </div>
  );
}
