import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "STRYK — Your Football Identity",
    short_name: "STRYK",
    description: "Your football profile, player cards, matches and squad.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#151515",
    theme_color: "#151515",
    lang: "en",
    icons: [
      { src: "/pwa/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
