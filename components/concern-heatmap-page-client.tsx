"use client"

import Link from "next/link"

import { ConcernHeatmapMapLazy } from "@/components/concern-heatmap-map-lazy"
import { buttonVariants } from "@/components/ui/button-variants"
import { useT } from "@/lib/i18n/context"

export function ConcernHeatmapPageClient() {
  const t = useT()
  const h = t.concernHeatmap

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{h.title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{h.description}</p>
        </div>
        <Link href="/concerns" className={buttonVariants({ variant: "secondary", size: "sm", className: "shrink-0" })}>
          {h.backToConcerns}
        </Link>
      </div>

      <ConcernHeatmapMapLazy
        labels={{
          title: h.title,
          hint: h.description,
          loading: h.loading,
          error: h.error,
          retry: h.retry,
        }}
      />
    </div>
  )
}
