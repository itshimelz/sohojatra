import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/seo"

/**
 * Dynamic sitemap generated at build time.
 *
 * For now this covers static pages. When concerns are stored in the DB,
 * add a dynamic segment that queries concern IDs here.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // ── Static pages ────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/concerns`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  // TODO: When concerns are in the DB, dynamically add them here:
  // const concerns = await prisma.concern.findMany({ select: { id: true, updatedAt: true } })
  // const concernPages = concerns.map(c => ({
  //   url: `${SITE_URL}/concerns/${c.id}`,
  //   lastModified: c.updatedAt,
  //   changeFrequency: "weekly" as const,
  //   priority: 0.7,
  // }))

  return [...staticPages]
}
