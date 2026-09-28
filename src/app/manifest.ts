import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRV4 Mayorista",
    short_name: "CRV4",
    description: "Catálogo mayorista de CRV4.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b666b",
    lang: "es",
    icons: [
      {
        src: "/icons/crv4-logo-final-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/crv4-logo-final-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
