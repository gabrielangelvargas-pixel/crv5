import type { Metadata } from "next";
import { CartContent } from "@/components/cart/cart-content";

export const metadata: Metadata = { title: "Mi carrito", robots: { index: false, follow: false } };
export default function CartPage() { return <CartContent />; }
