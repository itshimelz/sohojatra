import type { ConcernStatus } from "@/lib/concerns/mock"

type StatusLabels = {
  submitted: string
  underReview: string
  resolved: string
  rejected: string
}

type StatusView = "list" | "detail"

export function getStatusLabel(status: ConcernStatus, labels: StatusLabels) {
  switch (status) {
    case "Submitted":
      return labels.submitted
    case "Under Review":
      return labels.underReview
    case "Resolved":
      return labels.resolved
    case "Rejected":
      return labels.rejected
    default:
      const _exhaustiveCheck: never = status
      return _exhaustiveCheck
  }
}

export function getStatusBadgeVariant(
  status: ConcernStatus,
  view: StatusView
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Resolved") {
    return "default"
  }

  if (status === "Rejected") {
    return "destructive"
  }

  if (view === "list" && status === "Submitted") {
    return "outline"
  }

  return "secondary"
}
