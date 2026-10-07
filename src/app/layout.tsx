import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { PwaRegister } from "@/components/pwa-register";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CartProvider } from "@/components/cart/cart-provider";
import { getCategoryTree } from "@/lib/categories-repository";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const viewport: Viewport = { colorScheme: "only light" };

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
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
  const [categories, user] = await Promise.all([getCategoryTree(), getCurrentUser()]);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <AuthProvider initialUser={user}>
          <CartProvider key={user?.id ?? "guest"} userId={user?.id ?? null}>
          <PwaRegister />
          <Navbar categories={categories} />
          <div className="pt-20">{children}</div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
