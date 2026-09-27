import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { getCategoryTree } from "@/lib/categories-repository";
import "./globals.css";

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
    "Plantilla base con Next.js, React, TypeScript estricto y buenas practicas.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const categories = await getCategoryTree();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Navbar categories={categories} />
        <div className="pt-20">{children}</div>
      </body>
    </html>
  );
}
