import { getDictionary } from "@/lib/i18n/server"
import { MOCK_CONCERNS } from "@/lib/concerns/mock"
import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "@/lib/concerns/presentation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  ThumbsUp,
  Clock,
  Chat as MessageSquare,
} from "@phosphor-icons/react/dist/ssr"

type PageProps = {
  searchParams: Promise<{ sort?: string }>
}

export default async function ConcernsPage({ searchParams }: PageProps) {
  const d = await getDictionary()
  const t = d.concerns
  const params = await searchParams
  const sort = params.sort || "recent"

  const sortedConcerns = [...MOCK_CONCERNS].sort((a, b) => {
    if (sort === "upvotes") {
      return b.upvotes - a.upvotes
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild>
          <Link href="/concerns/submit">{t.submitNew}</Link>
        </Button>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t.sortBy}:
        </span>
        <Button
          variant={sort === "recent" ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href="/concerns?sort=recent">{t.sortRecent}</Link>
        </Button>
        <Button
          variant={sort === "upvotes" ? "secondary" : "ghost"}
          size="sm"
          asChild
        >
          <Link href="/concerns?sort=upvotes">{t.sortUpvotes}</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {sortedConcerns.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">{t.noResults}</p>
          </div>
        ) : (
          sortedConcerns.map((concern) => (
            <div
              key={concern.id}
              className="flex gap-4 rounded-lg border bg-card p-5 text-card-foreground transition-colors hover:border-primary/50 sm:gap-5"
            >
              <div className="flex min-w-[60px] flex-col items-center gap-1 pt-1">
                <Button
                  variant={concern.hasUpvoted ? "default" : "outline"}
                  size="sm"
                  className="h-auto w-full flex-col gap-2 py-3"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm leading-none font-bold">
                    {concern.upvotes}
                  </span>
                </Button>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/concerns/${concern.id}`}
                      className="line-clamp-2 text-lg leading-tight font-semibold hover:underline"
                    >
                      {concern.title}
                    </Link>
                    <Badge
                      variant={getStatusBadgeVariant(concern.status, "list")}
                      className="shrink-0"
                    >
                      {getStatusLabel(concern.status, statusLabels)}
                    </Badge>
                  </div>

                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {concern.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{concern.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {new Date(concern.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{concern.updates.length} Updates</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
