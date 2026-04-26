export type ConcernHeatmapMapLabels = {
  title: string
  hint: string
  loading: string
  error: string
  retry: string
}

export type ConcernHeatmapMapProps = {
  /** Fires when heat data fetch state changes (for parent UI). */
  onStatusChange?: (s: "idle" | "loading" | "error") => void
  labels: ConcernHeatmapMapLabels
  /** Prisma `ConcernCategory` value, or empty string for all */
  filterCategory: string
  /** Prisma `ConcernStatus` value, or empty string for all */
  filterStatus: string
  /** Multiplier applied to default heat intensity (zoom curve) */
  intensityMultiplier: number
  /** Multiplier applied to default heat radius (zoom curve) */
  radiusMultiplier: number
  /** Overall heat layer opacity (0–1) */
  heatOpacity: number
  /** Tailwind-friendly height classes for the map container */
  mapHeightClassName: string
  /** When false, only the map area is rendered (no title bar inside the component) */
  showHeader: boolean
  /** Increment to fly the map back to the default center and zoom */
  resetViewSignal?: number
}
