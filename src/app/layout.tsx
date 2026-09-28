import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { PwaRegister } from "@/components/pwa-register";
import { getCategoryTree } from "@/lib/categories-repository";
import { getProducts } from "@/lib/products-repository";
import "./globals.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CRV4",
    template: "%s | CRV4",
  },
  description:
    "Catálogo mayorista de CRV4.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/crv4-logo-final-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/crv4-logo-final-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "CRV4 Mayorista",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const categories = await getCategoryTree();
  const products = await getProducts();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PwaRegister />
        <Navbar categories={categories} products={products} />
        <div className="pt-20">{children}</div>
      </body>
    </html>
  );
}
