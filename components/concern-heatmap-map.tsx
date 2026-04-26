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

export function ConcernHeatmapMap({ labels }: ConcernHeatmapMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const abortRef = useRef<AbortController | null>(null)

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

    setStatus("loading")
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
    } catch (e) {
      if ((e as Error).name === "AbortError") return
      setStatus("error")
      setErrorMessage(e instanceof Error ? e.message : labels.error)
    }
  }, [labels.error])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const styleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL
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
          "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.8, 12, 1.4, 18, 2.2],
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0,
            "rgba(33,102,172,0)",
            0.15,
            "rgba(103,169,207,0.55)",
            0.35,
            "rgba(209,229,240,0.75)",
            0.55,
            "rgba(253,219,199,0.85)",
            0.75,
            "rgba(239,138,98,0.9)",
            1,
            "rgba(178,24,43,0.95)",
          ],
          "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 3, 10, 18, 14, 28, 18, 36],
          "heatmap-opacity": ["interpolate", ["linear"], ["zoom"], 7, 0.95, 18, 0.75],
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

  const retry = () => {
    const map = mapRef.current
    if (map) void loadHeatmapForBounds(map)
  }

  return (
    <section className="mb-10 overflow-hidden rounded-xl border border-border bg-card shadow-sm" aria-label={labels.title}>
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

      <div className="relative">
        <div ref={containerRef} className="h-[min(52vh,440px)] w-full min-h-[280px]" role="application" />

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
    </section>
  )
}
