"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"

import { Spinner } from "@phosphor-icons/react"

import type { ConcernHeatmapMapProps } from "./concern-heatmap-map-types"

/** Default: Dhaka metro */
const DEFAULT_CENTER: [number, number] = [90.4125, 23.8103]
const DEFAULT_ZOOM = 10.5

/**
 * CARTO light raster — reliable on mobile and avoids OSM tile
 * referrer blocks that can leave maps blank in embedded browsers.
 */
const DEFAULT_RASTER_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    basemap: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © CARTO',
    },
  },
  layers: [{ id: "basemap", type: "raster", source: "basemap", minzoom: 0, maxzoom: 22 }],
}

/** Red heat ramp tuned so sparse points and low density stay visible */
const HEAT_COLOR_STOPS: maplibregl.ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["heatmap-density"],
  0,
  "rgba(254, 226, 226, 0)",
  0.02,
  "rgba(252, 165, 165, 0.45)",
  0.15,
  "rgba(248, 113, 113, 0.75)",
  0.4,
  "rgba(239, 68, 68, 0.9)",
  0.7,
  "rgba(220, 38, 38, 0.95)",
  1,
  "rgba(127, 29, 29, 0.98)",
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

export function ConcernHeatmapMap({
  labels,
  mapHeightClassName = "h-[min(65vh,560px)]",
  showHeader = false,
}: ConcernHeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const loadHeatmapForBounds = useCallback(
    async (map: maplibregl.Map) => {
      const b = map.getBounds()
      const params = new URLSearchParams({
        west: b.getWest().toFixed(5),
        south: b.getSouth().toFixed(5),
        east: b.getEast().toFixed(5),
        north: b.getNorth().toFixed(5),
      })

      abortRef.current?.abort()
      const ac = new AbortController()
      abortRef.current = ac

      setStatus("loading")
      setErrorMessage(null)

      try {
        const res = await fetch(`/api/concerns/heatmap?${params}`, { signal: ac.signal })
        if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
        const geojson = await res.json()

        const src = map.getSource("concerns-heat") as maplibregl.GeoJSONSource | undefined
        if (src) src.setData(geojson)
        setStatus("idle")
      } catch (e) {
        if ((e as Error).name === "AbortError") return
        setStatus("error")
        setErrorMessage(e instanceof Error ? e.message : labels.error)
      }
    },
    [labels.error]
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const envStyle = process.env.NEXT_PUBLIC_MAP_STYLE_URL
    const map = new maplibregl.Map({
      container: el,
      style: (envStyle || DEFAULT_RASTER_STYLE) as string | maplibregl.StyleSpecification,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: { compact: true },
    })

    mapRef.current = map

    const scheduleLoad = debounce(() => {
      if (mapRef.current) void loadHeatmapForBounds(mapRef.current)
    }, 400)

    map.on("load", () => {
      map.addSource("concerns-heat", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      })

      map.addLayer({
        id: "concerns-heat-layer",
        type: "heatmap",
        source: "concerns-heat",
        paint: {
          "heatmap-weight": ["coalesce", ["get", "weight"], 1],
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 5, 0.9, 9, 1.35, 12, 1.85, 16, 2.4, 20, 2.9],
          "heatmap-color": HEAT_COLOR_STOPS,
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 5, 12, 9, 22, 12, 32, 16, 48, 20, 56],
          "heatmap-opacity": 0.92,
        },
      })

      requestAnimationFrame(() => {
        map.resize()
        void loadHeatmapForBounds(map)
      })
    })

    map.on("moveend", scheduleLoad)

    const ro = new ResizeObserver(() => map.resize())
    ro.observe(el)

    const layoutFix = window.setTimeout(() => map.resize(), 200)

    return () => {
      window.clearTimeout(layoutFix)
      ro.disconnect()
      map.off("moveend", scheduleLoad)
      abortRef.current?.abort()
      map.remove()
      mapRef.current = null
    }
  }, [loadHeatmapForBounds])

  const retry = () => {
    const map = mapRef.current
    if (map) void loadHeatmapForBounds(map)
  }

  const mapBlock = (
    <div className="relative overflow-hidden rounded-xl border border-border shadow-sm">
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
