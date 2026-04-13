import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * Dynamic robots.txt via Next.js metadata API.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/login", "/signup"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
