import type { MetadataRoute } from "next"

/**
 * Web app manifest for PWA support and mobile "Add to Home Screen".
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sohojatra — Civic Reporting for Dhaka",
    short_name: "Sohojatra",
    description:
      "Report civic issues, track progress, and help improve Dhaka city.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      {
        src: "/Sohojatra_logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  }
}
