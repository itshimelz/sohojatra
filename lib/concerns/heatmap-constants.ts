/** Must match `ConcernCategory` in `prisma/schema.prisma` (API query param). */
export const HEATMAP_CATEGORY_OPTIONS = [
  "Infrastructure",
  "Health",
  "Education",
  "Environment",
  "Corruption",
  "Safety",
  "Rights",
  "Economy",
] as const

/** Must match `ConcernStatus` in `prisma/schema.prisma` (API query param). */
export const HEATMAP_STATUS_OPTIONS = [
  "Submitted",
  "UnderReview",
  "ExpertProposed",
  "GovtApproved",
  "InProgress",
  "Resolved",
  "Rated",
] as const

export type HeatmapCategoryValue = (typeof HEATMAP_CATEGORY_OPTIONS)[number]
export type HeatmapStatusValue = (typeof HEATMAP_STATUS_OPTIONS)[number]
