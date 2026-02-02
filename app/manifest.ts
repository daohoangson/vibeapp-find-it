import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "3moji",
    short_name: "3moji",
    description: "The fun way to learn words with emojis!",
    start_url: "/",
    display: "standalone",
    background_color: "#f0f9ff",
    theme_color: "#f0f9ff",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
