"use client"

import dynamic from "next/dynamic"

import type { ConcernHeatmapMapProps } from "./concern-heatmap-map-types"

const ConcernHeatmapMapInner = dynamic(
  () => import("./concern-heatmap-map").then((m) => m.ConcernHeatmapMap),
  { ssr: false, loading: () => <HeatmapMapSkeleton /> }
)

function HeatmapMapSkeleton() {
  return (
    <div
      className="mb-10 flex h-[min(52vh,440px)] min-h-[280px] w-full animate-pulse items-center justify-center rounded-xl border border-border bg-muted/40"
      aria-hidden
    />
  )
}

export function ConcernHeatmapMapLazy(props: ConcernHeatmapMapProps) {
  return <ConcernHeatmapMapInner {...props} />
}
