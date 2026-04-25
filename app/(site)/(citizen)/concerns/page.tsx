import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"
import { getDictionary } from "@/lib/i18n/server"
import type { Concern } from "@/lib/concerns/types"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { UpvoteButton } from "@/components/upvote-button"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth-session"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/concerns/presentation"
import { Clock, MapPin } from "@phosphor-icons/react/dist/ssr"

export const metadata: Metadata = {
  title: "Citizen Concerns",
  description:
    "Browse and upvote civic issues reported by verified citizens across Dhaka — from potholes and streetlights to waste management and public safety.",
  alternates: { canonical: `${SITE_URL}/concerns` },
  openGraph: {
    title: "Citizen Concerns — Sohojatra",
    description:
      "See what issues Dhaka residents are reporting. Upvote to help prioritize what gets fixed first.",
    url: `${SITE_URL}/concerns`,
  },
}

type PageProps = {
  searchParams: Promise<{ sort?: string; page?: string }>
}

export default async function ConcernsPage({ searchParams }: PageProps) {
  const d = await getDictionary()
  const t = d.concerns
  const params = await searchParams
  const sort = params.sort || "recent"
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1)
  const pageSize = 10
  const skip = (page - 1) * pageSize

  // Get current session (optional — visitors can still see concerns)
  const session = await getServerSession()
  const userId = session?.user?.id ?? null

  const [totalConcerns, dbConcerns] = await Promise.all([
    prisma.concern.count(),
    prisma.concern.findMany({
      orderBy: sort === "upvotes" ? { upvotes: "desc" } : { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
  ])

  // Fetch this user's votes in one query if logged in
  const userVotes: Record<string, "up" | "down"> = {}
  if (userId) {
    const votes = await prisma.concernVote.findMany({
      where: {
        userId,
        concernId: { in: dbConcerns.map((c) => c.id) },
      },
      select: { concernId: true, voteType: true },
    })
    for (const v of votes) {
      userVotes[v.concernId] = v.voteType as "up" | "down"
    }
  }

  const sortedConcerns: Concern[] = dbConcerns.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    status: (c.status === "UnderReview" ? "Under Review" : c.status) as any,
    upvotes: c.upvotes,
    downvotes: c.downvotes,
    hasUpvoted: userVotes[c.id] === "up",
    currentVote: userVotes[c.id] ?? null,
    createdAt: c.createdAt.toISOString(),
    author: { name: c.authorName },
    location: {
      lat: c.locationLat,
      lng: c.locationLng,
      address: c.location || undefined,
    },
    photos: Array.isArray(c.photos) ? (c.photos as string[]) : [],
    updates: Array.isArray(c.updates) ? (c.updates as any[]) : [],
  }))

  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }
  const totalPages = Math.max(1, Math.ceil(totalConcerns / pageSize))

  const withQuery = (nextPage: number) => {
    const query = new URLSearchParams()
    query.set("sort", sort)
    query.set("page", String(nextPage))
    return `/concerns?${query.toString()}`
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 text-muted-foreground">{t.description}</p>
        </div>
        <Link href="/concerns/submit" className={buttonVariants({ variant: "default" })}>
          {t.submitNew}
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">{t.sortBy}:</span>
        <Link
          href="/concerns?sort=recent&page=1"
          className={buttonVariants({ variant: sort === "recent" ? "secondary" : "ghost", size: "sm" })}
        >
          {t.sortRecent}
        </Link>
        <Link
          href="/concerns?sort=upvotes&page=1"
          className={buttonVariants({ variant: sort === "upvotes" ? "secondary" : "ghost", size: "sm" })}
        >
          {t.sortUpvotes}
        </Link>
      </div>

      <div>
        {sortedConcerns.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">{t.noResults}</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {sortedConcerns.map((concern) => (
              <li key={concern.id} className="group flex gap-4 rounded-lg border-b border-border/60 px-1 py-4 transition-colors hover:bg-muted/40 last:border-b-0 sm:gap-5">
                <div className="shrink-0 pt-0.5">
                  <UpvoteButton
                    concernId={concern.id}
                    initialUpvotes={concern.upvotes}
                    initialDownvotes={concern.downvotes}
                    initialVote={(concern as Concern & { currentVote?: "up" | "down" | null }).currentVote ?? null}
                    isAuthenticated={!!userId}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/concerns/${concern.id}`}
                      className="text-base font-semibold text-foreground transition-colors group-hover:text-primary hover:text-primary sm:text-lg"
                    >
                      {concern.title}
                    </Link>
                    <Badge variant={getStatusBadgeVariant(concern.status, "list")}>
                      {getStatusLabel(concern.status, statusLabels)}
                    </Badge>
                  </div>

                  <p className="line-clamp-2 text-sm text-muted-foreground">{concern.description}</p>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" weight="duotone" />
                      {concern.location.address || `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" weight="duotone" />
                      {new Date(concern.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Link
            href={withQuery(Math.max(1, page - 1))}
            aria-disabled={page <= 1}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: page <= 1 ? "pointer-events-none opacity-50" : "",
            })}
          >
            Previous
          </Link>
          <Link
            href={withQuery(Math.min(totalPages, page + 1))}
            aria-disabled={page >= totalPages}
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className: page >= totalPages ? "pointer-events-none opacity-50" : "",
            })}
          >
            Next
          </Link>
        </div>
      </div>
    </div>
  )
}
