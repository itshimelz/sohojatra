export type ConcernHeatmapMapLabels = {
  title: string
  hint: string
  loading: string
  error: string
  retry: string
}

export type ConcernHeatmapMapProps = {
  labels: ConcernHeatmapMapLabels
  /** Tailwind height classes for the map container */
  mapHeightClassName?: string
  /** When true, show title row with optional loading text */
  showHeader?: boolean
}
