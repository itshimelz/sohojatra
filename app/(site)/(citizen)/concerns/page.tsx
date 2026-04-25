import type { Metadata } from "next"
import { SITE_URL } from "@/lib/seo"
import { getDictionary } from "@/lib/i18n/server"
import type { Concern } from "@/lib/concerns/types"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { ConcernCard } from "@/components/concern-card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "@/lib/auth-session"

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
  searchParams: Promise<{ sort?: string }>
}

export default async function ConcernsPage({ searchParams }: PageProps) {
  const d = await getDictionary()
  const t = d.concerns
  const params = await searchParams
  const sort = params.sort || "recent"

  // Get current session (optional — visitors can still see concerns)
  const session = await getServerSession()
  const userId = session?.user?.id ?? null

  const dbConcerns = await prisma.concern.findMany({
    orderBy: sort === "upvotes" ? { upvotes: "desc" } : { createdAt: "desc" },
  })

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
          href="/concerns?sort=recent"
          className={buttonVariants({ variant: sort === "recent" ? "secondary" : "ghost", size: "sm" })}
        >
          {t.sortRecent}
        </Link>
        <Link
          href="/concerns?sort=upvotes"
          className={buttonVariants({ variant: sort === "upvotes" ? "secondary" : "ghost", size: "sm" })}
        >
          {t.sortUpvotes}
        </Link>
      </div>

      <div className="grid gap-4">
        {sortedConcerns.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center">
            <p className="text-muted-foreground">{t.noResults}</p>
          </div>
        ) : (
          sortedConcerns.map((concern) => (
            <ConcernCard
              key={concern.id}
              concern={concern}
              statusLabels={statusLabels}
              isAuthenticated={!!userId}
            />
          ))
        )}
      </div>
    </div>
  )
}
