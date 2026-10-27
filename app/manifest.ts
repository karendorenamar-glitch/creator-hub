import type { MetadataRoute } from "next";
import { KEFOO_DESCRIPTION, KEFOO_TITLE } from "@/lib/wedding/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: KEFOO_TITLE,
    short_name: "Kefoo",
    description: KEFOO_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#FBF7F2",
    theme_color: "#FBF7F2",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
