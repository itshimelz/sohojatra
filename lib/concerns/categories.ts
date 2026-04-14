// Shared concern category definitions used across the app.
// `value` is stored in the DB; `label` is the human-readable display name.

export const CONCERN_CATEGORIES = [
  { value: "road_infrastructure", label: "Road & Infrastructure" },
  { value: "water_sanitation",    label: "Water & Sanitation" },
  { value: "waste_management",    label: "Waste Management" },
  { value: "electricity",         label: "Electricity & Power" },
  { value: "public_safety",       label: "Public Safety" },
  { value: "environment",         label: "Environment & Pollution" },
  { value: "public_transport",    label: "Public Transport" },
  { value: "health_services",     label: "Health Services" },
  { value: "education",           label: "Education" },
  { value: "other",               label: "Other" },
] as const

export type ConcernCategoryValue = (typeof CONCERN_CATEGORIES)[number]["value"]

/** Returns the human-readable label for a category value, or the raw value if unknown. */
export function getCategoryLabel(value: string): string {
  return CONCERN_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
