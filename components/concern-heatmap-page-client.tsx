"use client"

import { useState } from "react"
import Link from "next/link"
import { Spinner } from "@phosphor-icons/react"

import { ConcernHeatmapMapLazy } from "@/components/concern-heatmap-map-lazy"
import { buttonVariants } from "@/components/ui/button-variants"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/lib/i18n/context"
import { HEATMAP_CATEGORY_OPTIONS, HEATMAP_STATUS_OPTIONS } from "@/lib/concerns/heatmap-constants"

export function ConcernHeatmapPageClient() {
  const t = useT()
  const h = t.concernHeatmap

  const [category, setCategory] = useState("")
  const [status, setStatus] = useState("")
  const [intensity, setIntensity] = useState(1)
  const [radius, setRadius] = useState(1)
  const [opacity, setOpacity] = useState(0.9)
  const [resetSignal, setResetSignal] = useState(0)
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "error">("idle")

  const categoryLabels = h.categories as Record<string, string>
  const statusLabels = h.statuses as Record<string, string>

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{h.title}</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">{h.description}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {mapStatus === "loading" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Spinner className="size-3.5 animate-spin" aria-hidden />
              {h.updating}
            </span>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => setResetSignal((n) => n + 1)}>
            {h.resetView}
          </Button>
          <Link href="/concerns" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            {h.backToConcerns}
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
        <p className="mb-4 text-xs text-muted-foreground sm:text-sm">{h.controlsHint}</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="heatmap-category">{h.filterCategory}</Label>
            <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : (v ?? ""))}>
              <SelectTrigger id="heatmap-category" className="h-10 w-full max-w-full">
                <SelectValue placeholder={h.allCategories} />
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[var(--anchor-width)]">
                <SelectItem value="__all__">{h.allCategories}</SelectItem>
                {HEATMAP_CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {categoryLabels[c] ?? c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="heatmap-status">{h.filterStatus}</Label>
            <Select value={status || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : (v ?? ""))}>
              <SelectTrigger id="heatmap-status" className="h-10 w-full max-w-full">
                <SelectValue placeholder={h.allStatuses} />
              </SelectTrigger>
              <SelectContent align="start" className="min-w-[var(--anchor-width)]">
                <SelectItem value="__all__">{h.allStatuses}</SelectItem>
                {HEATMAP_STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {statusLabels[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <Label htmlFor="heatmap-intensity">{h.intensity}</Label>
                <span className="tabular-nums text-muted-foreground">{intensity.toFixed(2)}×</span>
              </div>
              <input
                id="heatmap-intensity"
                type="range"
                min={0.35}
                max={2.5}
                step={0.05}
                value={intensity}
                onChange={(e) => setIntensity(Number.parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <Label htmlFor="heatmap-radius">{h.radius}</Label>
                <span className="tabular-nums text-muted-foreground">{radius.toFixed(2)}×</span>
              </div>
              <input
                id="heatmap-radius"
                type="range"
                min={0.4}
                max={2.2}
                step={0.05}
                value={radius}
                onChange={(e) => setRadius(Number.parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <Label htmlFor="heatmap-opacity">{h.opacity}</Label>
                <span className="tabular-nums text-muted-foreground">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                id="heatmap-opacity"
                type="range"
                min={0.25}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number.parseFloat(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>
      </div>

      <ConcernHeatmapMapLazy
        onStatusChange={setMapStatus}
        labels={{
          title: h.title,
          hint: h.description,
          loading: h.loading,
          error: h.error,
          retry: h.retry,
        }}
        filterCategory={category}
        filterStatus={status}
        intensityMultiplier={intensity}
        radiusMultiplier={radius}
        heatOpacity={opacity}
        mapHeightClassName="h-[min(65vh,560px)]"
        showHeader={false}
        resetViewSignal={resetSignal}
      />
    </div>
  )
}
