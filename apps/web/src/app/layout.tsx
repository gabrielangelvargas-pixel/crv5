import type { Metadata } from "next";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import { Providers } from "./providers";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "CRV4 Mayorista",
  description: "Catálogo mayorista de regalería, bijouterie y accesorios.",
  applicationName: "CRV4 Mayorista",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body><Providers>{children}</Providers><PwaRegister /></body>
    </html>
  );
}
