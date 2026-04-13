"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  Clock,
  MagnifyingGlass,
  MapPin,
  ThumbsUp,
  Chat as MessageSquare,
} from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Concern } from "@/lib/concerns/mock"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/concerns/presentation"
import { getBrowserConcerns, upvoteConcern } from "@/lib/concerns/client-store"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  dictionary: Dictionary["concerns"]
  initialConcerns: Concern[]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value))
}

export function ConcernsBrowser({ dictionary: t, initialConcerns }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [concerns, setConcerns] = useState<Concern[]>(initialConcerns)
  const [query, setQuery] = useState("")

  useEffect(() => {
    setConcerns(getBrowserConcerns())
  }, [initialConcerns])

  const sort = searchParams.get("sort") || "recent"

  const displayedConcerns = useMemo(() => {
    const filtered = concerns.filter((concern) => {
      const text = `${concern.title} ${concern.description} ${concern.location.address ?? ""}`.toLowerCase()
      return text.includes(query.toLowerCase())
    })

    return [...filtered].sort((left, right) => {
      if (sort === "upvotes" && right.upvotes !== left.upvotes) {
        return right.upvotes - left.upvotes
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    })
  }, [concerns, query, sort])

  const updateSort = (nextSort: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", nextSort)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleUpvote = (concernId: string) => {
    const result = upvoteConcern(concernId)
    setConcerns(result.concerns)

    toast[result.alreadyVoted ? "info" : "success"](t.upvoted)
  }

  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">{t.description}</p>
        </div>
        <Button asChild className="rounded-full">
          <Link href="/concerns/submit">{t.submitNew}</Link>
        </Button>
      </div>

      <div className="mb-6 grid gap-4 rounded-3xl border border-border/60 bg-muted/20 p-4 md:grid-cols-[1fr_auto] md:items-center">
        <label className="relative block">
          <MagnifyingGlass className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-full border border-border/60 bg-background pl-11 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
          />
        </label>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{t.sortBy}:</span>
          <Button
            type="button"
            variant={sort === "recent" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => updateSort("recent")}
            className="rounded-full"
          >
            {t.sortRecent}
          </Button>
          <Button
            type="button"
            variant={sort === "upvotes" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => updateSort("upvotes")}
            className="rounded-full"
          >
            {t.sortUpvotes}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {displayedConcerns.length === 0 ? (
          <div className="rounded-3xl border border-dashed py-12 text-center">
            <p className="text-muted-foreground">{t.noResults}</p>
          </div>
        ) : (
          displayedConcerns.map((concern) => (
            <article
              key={concern.id}
              className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card p-5 text-card-foreground transition-colors hover:border-primary/40 sm:flex-row sm:gap-5"
            >
              <div className="flex min-w-[72px] flex-row items-center gap-2 sm:flex-col sm:items-stretch sm:pt-1">
                <Button
                  type="button"
                  variant={concern.hasUpvoted ? "default" : "outline"}
                  size="sm"
                  className="h-auto w-full flex-1 flex-col gap-1 rounded-2xl py-3"
                  onClick={() => handleUpvote(concern.id)}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-sm leading-none font-bold">{concern.upvotes}</span>
                </Button>
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <Link
                      href={`/concerns/${concern.id}`}
                      className="line-clamp-2 text-lg leading-tight font-semibold text-foreground hover:underline"
                    >
                      {concern.title}
                    </Link>
                    <Badge
                      variant={getStatusBadgeVariant(concern.status, "list")}
                      className="shrink-0 rounded-full"
                    >
                      {getStatusLabel(concern.status, statusLabels)}
                    </Badge>
                  </div>

                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {concern.description}
                  </p>
                </div>

                <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{concern.location.address ?? `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDate(concern.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{concern.updates.length} updates</span>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
