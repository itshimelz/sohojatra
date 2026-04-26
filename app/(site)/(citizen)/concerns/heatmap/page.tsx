import type { Metadata } from "next"

import { ConcernHeatmapPageClient } from "@/components/concern-heatmap-page-client"
import { getDictionary, getLocale } from "@/lib/i18n/server"
import { SITE_URL } from "@/lib/seo"

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const t = await getDictionary(locale)
  const h = t.concernHeatmap
  return {
    title: h.title,
    description: h.description,
    alternates: { canonical: `${SITE_URL}/concerns/heatmap` },
    openGraph: {
      title: `${h.title} — Sohojatra`,
      description: h.description,
      url: `${SITE_URL}/concerns/heatmap`,
    },
  }
}

export default function ConcernHeatmapPage() {
  return <ConcernHeatmapPageClient />
}
