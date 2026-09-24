import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRV4 Mayorista",
    short_name: "CRV4",
    description: "Catálogo mayorista de CRV4.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbfaf7",
    theme_color: "#f4f0e8",
    icons: [
      { src: "/icons/crv4-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/crv4-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
