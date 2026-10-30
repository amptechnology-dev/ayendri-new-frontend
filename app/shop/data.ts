export type Product = {
  slug: string; name: string; category: string; price: number; mrp: number;
  image: string; rating: number; reviews: number; tag?: string; description: string;
  createdAt?: string; categoryName?: string; variantId?: string;
  delivery?: any;
  deliveryTime?: string;
  isMadeForProduct?: boolean;
  raw?: any;
};
export type Category = { slug: string; name: string; sub: string[]; image?: string };

export const categories: Category[] = [
  { slug: "karungali", name: "Karungali", sub: ["Mala", "Bracelets", "Pendants"] },
  { slug: "rudraksha", name: "Rudraksha", sub: ["1 Mukhi", "5 Mukhi", "Siddha Mala"] },
  { slug: "jewellery", name: "Jewellery", sub: ["Rings", "Bracelets", "Chains"] },
  { slug: "mala", name: "Mala", sub: ["Tulsi", "Sandalwood", "Crystal"] },
  { slug: "stones", name: "Stones", sub: ["Raw Crystals", "Tumbled", "Pyramids"] },
  { slug: "daily-essentials", name: "Daily Essentials", sub: ["Incense", "Camphor", "Diyas"] },
  { slug: "pyrite", name: "Pyrite", sub: ["Bracelets", "Cubes", "Frames"] },
  { slug: "idols", name: "Idols", sub: ["Ganesh", "Lakshmi", "Shiva"] },
  { slug: "services", name: "Services", sub: ["Pujas", "Consultations"] },
];

const img = (n: string) => `/img/photos/${n}`;
export const products: Product[] = [
  { slug: "karungali-mala-108", name: "Karungali Mala 108 Beads", category: "karungali", price: 799, mrp: 2499, image: img("product-mala.jpg"), rating: 4.8, reviews: 1240, tag: "Bestseller", description: "Energised ebony wood mala, hand-knotted and certified." },
  { slug: "5-mukhi-rudraksha", name: "5 Mukhi Rudraksha Pendant", category: "rudraksha", price: 499, mrp: 1499, image: img("product-rudraksha.jpg"), rating: 4.7, reviews: 860, tag: "Free Coin", description: "Natural Nepal bead in a silver-plated cap." },
  { slug: "lakshmi-ganesh-idol", name: "Lakshmi Ganesh Brass Idol", category: "idols", price: 1299, mrp: 3299, image: img("product-idol.jpg"), rating: 4.9, reviews: 540, tag: "Diwali Sale", description: "Solid brass pair for Diwali puja." },
  { slug: "evil-eye-bracelet", name: "Evil Eye Protection Bracelet", category: "jewellery", price: 399, mrp: 1199, image: img("product-jewellery.jpg"), rating: 4.6, reviews: 2100, description: "Black onyx beads with an evil-eye charm." },
  { slug: "diwali-puja-kit", name: "Complete Diwali Puja Kit", category: "daily-essentials", price: 699, mrp: 1799, image: img("product-puja.jpg"), rating: 4.8, reviews: 390, tag: "Combo", description: "21-piece kit with everything for Lakshmi puja." },
  { slug: "pyrite-wealth-bracelet", name: "Pyrite Wealth Bracelet", category: "pyrite", price: 599, mrp: 1799, image: img("unsplash-1.jpg"), rating: 4.5, reviews: 710, description: "Natural pyrite for abundance." },
  { slug: "tulsi-mala", name: "Tulsi Japa Mala", category: "mala", price: 299, mrp: 799, image: img("unsplash-2.jpg"), rating: 4.7, reviews: 980, description: "Pure tulsi, 108+1 beads." },
  { slug: "crystal-pyramid", name: "Selenite Crystal Pyramid", category: "stones", price: 899, mrp: 2199, image: img("unsplash-3.jpg"), rating: 4.6, reviews: 260, description: "Cleansing selenite pyramid." },
];

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const off = (p: Product) => (p.mrp > 0 ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0);