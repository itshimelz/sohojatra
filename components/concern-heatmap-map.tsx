"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { Spinner } from "@phosphor-icons/react"

import type { ConcernHeatmapMapProps } from "./concern-heatmap-map-types"

/** Default: Dhaka metro */
const DEFAULT_CENTER: [number, number] = [90.4125, 23.8103]
const DEFAULT_ZOOM = 10.5

const OSM_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }],
}

/** Red-only heat ramp: transparent → deep red */
const HEAT_COLOR_STOPS: maplibregl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["heatmap-density"],
  0,
  "rgba(220, 38, 38, 0)",
  0.12,
  "rgba(248, 113, 113, 0.35)",
  0.35,
  "rgba(239, 68, 68, 0.65)",
  0.6,
  "rgba(220, 38, 38, 0.88)",
  1,
  "rgba(127, 29, 29, 0.95)",
]

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t)
    t = setTimeout(() => {
      t = undefined
      fn(...args)
    }, ms)
  }
}

function intensityPaint(mult: number): maplibregl.ExpressionSpecification {
  return [
    "*",
    mult,
    ["interpolate", ["linear"], ["zoom"], 0, 0.85, 12, 1.5, 18, 2.35] as maplibregl.ExpressionSpecification,
  ] as maplibregl.ExpressionSpecification
}

function radiusPaint(mult: number): maplibregl.ExpressionSpecification {
  return [
    "*",
    mult,
    ["interpolate", ["linear"], ["zoom"], 0, 3, 10, 18, 14, 30, 18, 40] as maplibregl.ExpressionSpecification,
  ] as maplibregl.ExpressionSpecification
}

export function ConcernHeatmapMap({
  onStatusChange,
  labels,
  filterCategory,
  filterStatus,
  intensityMultiplier,
  radiusMultiplier,
  heatOpacity,
  mapHeightClassName,
  showHeader,
  resetViewSignal = 0,
}: ConcernHeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const filterCategoryRef = useRef(filterCategory)
  const filterStatusRef = useRef(filterStatus)
  filterCategoryRef.current = filterCategory
  filterStatusRef.current = filterStatus

  const paintRef = useRef({ intensityMultiplier, radiusMultiplier, heatOpacity })
  paintRef.current = { intensityMultiplier, radiusMultiplier, heatOpacity }

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadHeatmapForBounds = useCallback(async (map: maplibregl.Map) => {
    const b = map.getBounds()
    const west = b.getWest()
    const south = b.getSouth()
    const east = b.getEast()
    const north = b.getNorth()

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const params = new URLSearchParams({
      west: west.toFixed(5),
      south: south.toFixed(5),
      east: east.toFixed(5),
      north: north.toFixed(5),
    })
    const cat = filterCategoryRef.current
    const st = filterStatusRef.current
    if (cat) params.set("category", cat)
    if (st) params.set("status", st)

    setStatus("loading")
    onStatusChange?.("loading")
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/concerns/heatmap?${params}`, { signal: ac.signal })
      if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
      const geojson = await res.json()

      const src = map.getSource("concerns-heat") as maplibregl.GeoJSONSource | undefined
      if (src) {
        src.setData(geojson)
      }
      setStatus("idle")
      onStatusChange?.("idle")
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setStatus("error")
      onStatusChange?.("error")
      setErrorMessage(e instanceof Error ? e.message : labels.error)
    }
  }, [labels.error, onStatusChange])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL
    const p = paintRef.current
    const map = new maplibregl.Map({
      container: el,
      style: (styleUrl || OSM_RASTER_STYLE) as string | maplibregl.StyleSpecification,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    })

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    mapRef.current = map

    const scheduleLoad = debounce(() => {
      if (mapRef.current) void loadHeatmapForBounds(mapRef.current)
    }, 450)

    map.on("load", () => {
      map.addSource("concerns-heat", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })

      map.addLayer({
        id: "concerns-heat-layer",
        type: "heatmap",
        source: "concerns-heat",
        maxzoom: 18,
        paint: {
          "heatmap-weight": ["interpolate", ["linear"], ["get", "weight"], 0, 0, 8, 1],
          "heatmap-intensity": intensityPaint(p.intensityMultiplier),
          "heatmap-color": HEAT_COLOR_STOPS,
          "heatmap-radius": radiusPaint(p.radiusMultiplier),
          "heatmap-opacity": p.heatOpacity,
        },
      })

      void loadHeatmapForBounds(map)
    })

    map.on("moveend", scheduleLoad)

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(el)

    return () => {
      ro.disconnect()
      map.off("moveend", scheduleLoad)
      abortRef.current?.abort()
      map.remove()
      mapRef.current = null
    }
  }, [loadHeatmapForBounds])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded() || !map.getLayer("concerns-heat-layer")) return
    const p = paintRef.current
    map.setPaintProperty("concerns-heat-layer", "heatmap-intensity", intensityPaint(p.intensityMultiplier))
    map.setPaintProperty("concerns-heat-layer", "heatmap-radius", radiusPaint(p.radiusMultiplier))
    map.setPaintProperty("concerns-heat-layer", "heatmap-opacity", p.heatOpacity)
  }, [intensityMultiplier, radiusMultiplier, heatOpacity])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    void loadHeatmapForBounds(map)
  }, [filterCategory, filterStatus, loadHeatmapForBounds])

  useEffect(() => {
    if (resetViewSignal <= 0) return
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    map.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM, essential: true })
  }, [resetViewSignal])

  const retry = () => {
    const map = mapRef.current
    if (map) void loadHeatmapForBounds(map)
  }

  const mapBlock = (
    <div className="relative">
      <div ref={containerRef} className={`w-full min-h-[280px] ${mapHeightClassName}`} role="application" />

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 px-4 text-center backdrop-blur-[2px]">
          <p className="text-sm text-destructive">{errorMessage ?? labels.error}</p>
          <button
            type="button"
            onClick={retry}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
          >
            {labels.retry}
          </button>
        </div>
      )}
    </div>
  )

  if (!showHeader) {
    return mapBlock
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label={labels.title}>
      <div className="flex flex-col gap-1 border-b border-border/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{labels.title}</h2>
          <p className="text-sm text-muted-foreground">{labels.hint}</p>
        </div>
        {status === "loading" && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Spinner className="size-3.5 animate-spin" aria-hidden />
            {labels.loading}
          </span>
        )}
      </div>

      {mapBlock}
    </section>
  )
}
