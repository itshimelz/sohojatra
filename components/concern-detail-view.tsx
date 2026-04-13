"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { CaretLeft as ChevronLeft, CheckCircle, Clock, MapPin, User, WarningCircle } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Concern } from "@/lib/concerns/mock"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/concerns/presentation"
import { findConcernById } from "@/lib/concerns/client-store"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  concernId: string
  initialConcern: Concern | null
  dictionary: Dictionary["concerns"]
  tracking: Dictionary["tracking"]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function ConcernDetailView({ concernId, initialConcern, dictionary: t, tracking: tr }: Props) {
  const [concern, setConcern] = useState<Concern | null>(initialConcern)

  useEffect(() => {
    setConcern(findConcernById(concernId))
  }, [concernId])

  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }

  if (!concern) {
    return (
      <div className="container mx-auto flex min-h-[60svh] max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          <WarningCircle className="size-8" weight="fill" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{t.noResults}</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          This concern is not available in the current browser session. Return to the list or submit a new concern.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/concerns">{t.details}</Link>
          </Button>
          <Button asChild className="rounded-full">
            <Link href="/concerns/submit">{t.submitNew}</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-3 rounded-full">
        <Link href="/concerns" className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          {t.details}
        </Link>
      </Button>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-border/60 bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <Badge
                variant={getStatusBadgeVariant(concern.status, "detail")}
                className="rounded-full px-3 py-1 text-sm font-medium"
              >
                {getStatusLabel(concern.status, statusLabels)}
              </Badge>
              <span className="rounded-full bg-muted px-3 py-1 font-mono text-sm text-muted-foreground">
                {concern.id}
              </span>
            </div>

            <h1 className="mb-4 text-2xl leading-tight font-bold tracking-tight sm:text-4xl">
              {concern.title}
            </h1>

            <p className="mb-6 text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {concern.description}
            </p>

            <div className="flex flex-wrap gap-4 border-t border-border/60 pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">{concern.author.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{formatDate(concern.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{concern.location.address ?? `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}</span>
              </div>
            </div>
          </div>

          {concern.photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attached Photos</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {concern.photos.map((photo, index) => (
                  <div key={photo} className="relative aspect-video overflow-hidden rounded-2xl border bg-muted">
                    <Image
                      src={photo}
                      alt={`Concern proof ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="sticky top-6 h-fit space-y-6 rounded-3xl border border-border/60 bg-card p-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold">{tr.timeline}</h3>
            <p className="mb-6 text-sm text-muted-foreground">Live updates from the current browser session</p>
          </div>

          <div className="space-y-8 pl-2">
            {concern.updates
              .slice()
              .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
              .map((update, index) => {
                const isLast = index === concern.updates.length - 1
                const isResolved = update.status === "Resolved"

                return (
                  <div key={update.id} className="relative">
                    {!isLast && <div className="absolute top-6 bottom-[-32px] left-[11px] w-px bg-border" />}
                    <div className="flex gap-4">
                      <div
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-card ${isResolved ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {isResolved ? <CheckCircle className="h-3 w-3" weight="fill" /> : <div className="h-2 w-2 rounded-full bg-current" />}
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm leading-none font-medium text-foreground">
                            {getStatusLabel(update.status, statusLabels)}
                          </p>
                          <time className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                            {formatDate(update.timestamp)}
                          </time>
                        </div>

                        <div className="mt-1 text-xs font-medium text-muted-foreground">by {update.author}</div>

                        {update.note && (
                          <div className="mt-3 rounded-2xl border border-border/60 bg-muted/50 p-3 text-sm text-foreground">
                            <span className="mb-1 block text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                              {tr.officialNote}:
                            </span>
                            {update.note}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
