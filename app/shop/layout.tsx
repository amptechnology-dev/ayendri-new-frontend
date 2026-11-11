import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import "./shop.css";
import ShopHeader from "./components/ShopHeader";
import CartSync from "./components/CartSync";
import ShopFooter from "./components/ShopFooter";
import BottomNav from "./components/BottomNav";
import DisableAdminKitCss from "./components/DisableAdminKitCss";
import ShopGate from "./components/ShopGate";
import ShopLoader from "./components/ShopLoader";
import NotificationWatcher from "./components/NotificationWatcher";
import ChatBotWidget from "./components/ChatBotWidget";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-shop",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AYENDRI Shop: Sacred for a Higher You",
  description:
    "Shop authentic Rudraksha, malas, idols, jewellery and puja essentials at AYENDRI. Sacred, energised products delivered across India with care.",
};

// Runs as soon as the browser parses the HTML, before React hydrates.
// Plays loading.mp3 once per browser (first visit only).
const INTRO_AUDIO_SCRIPT = `(function(){try{
  var K='ayendri_intro_audio_played';
  if(localStorage.getItem(K)==='1')return;
  var a=new Audio('/audio/loading.mp3');a.preload='auto';
  window.__introAudio=a;
  var done=function(){try{localStorage.setItem(K,'1')}catch(e){}};
  var ev=['pointerdown','click','touchend','keydown'];
  var off=function(){ev.forEach(function(e){window.removeEventListener(e,unlock)})};
  var unlock=function(){a.play().then(function(){done();off()}).catch(function(){})};
  a.play().then(done).catch(function(){ev.forEach(function(e){window.addEventListener(e,unlock)})});
}catch(e){}})();`;

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} shop-root`}>
      <link
        rel="preload"
        href="/audio/loading.mp3"
        as="audio"
        type="audio/mpeg"
      />
      <script dangerouslySetInnerHTML={{ __html: INTRO_AUDIO_SCRIPT }} />
      <DisableAdminKitCss />
      <CartSync />
      <NotificationWatcher />
      <ShopHeader />
      <main className="pb-28">
        <ShopLoader />
        <ShopGate>{children}</ShopGate>
      </main>
      <ShopFooter />
      <BottomNav />
      <Suspense fallback={null}>
        <ChatBotWidget />
      </Suspense>
    </div>
  );
}
