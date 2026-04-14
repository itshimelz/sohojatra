import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { UpvoteButton } from "@/components/upvote-button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  MapPin,
  Clock,
  Chat as MessageSquare,
  CheckCircle,
  XCircle,
  MagnifyingGlass,
  PaperPlaneTilt,
} from "@phosphor-icons/react/dist/ssr"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/concerns/presentation"
import type { Concern } from "@/lib/concerns/mock"

type ConcernCardProps = {
  concern: Concern & { currentVote?: "up" | "down" | null }
  statusLabels: {
    submitted: string
    underReview: string
    resolved: string
    rejected: string
  }
  isAuthenticated: boolean
}

export function ConcernCard({ concern, statusLabels, isAuthenticated }: ConcernCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Submitted":
        return <PaperPlaneTilt className="size-4" weight="fill" />
      case "Under Review":
        return <MagnifyingGlass className="size-4" weight="bold" />
      case "Resolved":
        return <CheckCircle className="size-4" weight="fill" />
      case "Rejected":
        return <XCircle className="size-4" weight="fill" />
      default:
        return <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
    }
  }

  return (
    <div className="group flex gap-5 rounded-2xl border border-border/60 bg-card p-6 text-card-foreground transition-all duration-300 hover:border-primary/40 sm:gap-6">
      <div className="flex shrink-0 flex-col items-center pt-1 sm:w-16">
        <UpvoteButton
          concernId={concern.id}
          initialUpvotes={concern.upvotes}
          initialDownvotes={concern.downvotes}
          initialVote={concern.currentVote ?? null}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <Link
              href={`/concerns/${concern.id}`}
              className="line-clamp-2 text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary"
            >
              {concern.title}
            </Link>
            <Badge
              variant={getStatusBadgeVariant(concern.status, "list")}
              className="shrink-0 px-2.5 py-0.5"
            >
              {getStatusLabel(concern.status, statusLabels)}
            </Badge>
          </div>

          <p className="mb-6 line-clamp-2 leading-relaxed text-muted-foreground">
            {concern.description}
          </p>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-border/40 pt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4" weight="duotone" />
            <span className="font-medium">{concern.location.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="size-4" weight="duotone" />
            <span>
              {new Date(concern.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <Dialog>
            <DialogTrigger
              render={
                <button className="flex items-center gap-2 text-primary hover:underline outline-none rounded-md px-1 -mx-1">
                  <MessageSquare className="size-4" weight="fill" />
                  <span className="font-medium">{concern.updates.length} Updates</span>
                </button>
              }
            />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Updates for &quot;{concern.title}&quot;</DialogTitle>
                <DialogDescription>
                  A timeline of administrative responses and actions.
                </DialogDescription>
              </DialogHeader>
              <div className="my-4 space-y-6">
                {concern.updates.map((update) => (
                  <div key={update.id} className="relative pl-10 before:absolute before:left-[15px] before:top-6 before:h-full before:w-px before:bg-border last:before:hidden">
                    <div className="absolute left-0 top-0 flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-background">
                      {getStatusIcon(update.status)}
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-foreground">{getStatusLabel(update.status, statusLabels)}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(update.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {update.note && <p className="text-sm leading-relaxed text-muted-foreground">{update.note}</p>}
                      <span className="mt-1 text-xs font-medium text-muted-foreground/80">By {update.author}</span>
                    </div>
                  </div>
                ))}
                {concern.updates.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground italic">No updates have been posted yet.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}
