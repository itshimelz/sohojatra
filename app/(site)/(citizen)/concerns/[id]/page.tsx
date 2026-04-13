import type { Metadata } from "next"
import { getDictionary } from "@/lib/i18n/server"
import type { Concern } from "@/lib/concerns/mock"

import mockConcernsRaw from "@/public/mock-concerns.json"
const MOCK_CONCERNS = mockConcernsRaw as Concern[]

import {
  getStatusBadgeVariant,
  getStatusLabel,
} from "@/lib/concerns/presentation"
import { SITE_URL } from "@/lib/seo"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  CaretLeft as ChevronLeft,
  MapPin,
  Clock,
  User,
  CheckCircle as CheckCircle2,
  WarningCircle as AlertCircle,
} from "@phosphor-icons/react/dist/ssr"

type DetailParams = { params: Promise<{ id: string }> }

export async function generateMetadata({
  params,
}: DetailParams): Promise<Metadata> {
  const { id } = await params
  const concern = MOCK_CONCERNS.find((c) => c.id === id)

  if (!concern) {
    return { title: "Concern Not Found" }
  }

  const title = concern.title
  const description = `${concern.description.slice(0, 150)}…`
  const url = `${SITE_URL}/concerns/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — Sohojatra`,
      description,
      url,
      type: "article",
    },
  }
}

export default async function ConcernDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const d = await getDictionary()
  const { id } = await params
  const concern = MOCK_CONCERNS.find((c) => c.id === id)

  if (!concern) {
    notFound()
  }

  const t = d.concerns
  const tr = d.tracking
  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }

  const statusConfig = {
    Submitted: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
    "Under Review": {
      icon: AlertCircle,
      color: "text-accent-foreground",
      bg: "bg-accent",
    },
    Resolved: {
      icon: CheckCircle2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    Rejected: {
      icon: AlertCircle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
  } as const

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Link
        href="/concerns"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-3 text-muted-foreground hover:text-foreground",
        })}
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Concerns
      </Link>

      <div className="grid gap-8 md:grid-cols-[2fr_1fr]">
        <div className="space-y-8">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <Badge
                variant={getStatusBadgeVariant(concern.status, "detail")}
                className="px-3 py-1 text-sm font-medium"
              >
                {getStatusLabel(concern.status, statusLabels)}
              </Badge>
              <span className="rounded bg-muted px-2 py-1 font-mono text-sm text-muted-foreground">
                ID: {concern.id}
              </span>
            </div>

            <h1 className="mb-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
              {concern.title}
            </h1>

            <p className="mb-6 text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {concern.description}
            </p>

            <div className="flex flex-wrap gap-4 border-t pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium text-foreground">
                  {concern.author.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{new Date(concern.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>
                  {concern.location.address ||
                    `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          {concern.photos && concern.photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attached Photos</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {concern.photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted"
                  >
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

        {/* Tracking Timeline */}
        <div className="sticky top-6 h-fit space-y-6 rounded-lg border bg-card p-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold">{tr.timeline}</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Live updates from authorities
            </p>
          </div>

          <div className="space-y-8 pl-2">
            {[...concern.updates]
              .sort(
                (a, b) =>
                  new Date(b.timestamp).getTime() -
                  new Date(a.timestamp).getTime()
              )
              .map((update, index) => {
                const config =
                  statusConfig[update.status] || statusConfig["Submitted"]
                const Icon = config.icon
                const isLast = index === concern.updates.length - 1

                return (
                  <div key={update.id} className="relative">
                    {!isLast && (
                      <div className="absolute top-6 bottom-[-32px] left-[11px] w-px bg-border"></div>
                    )}
                    <div className="flex gap-4">
                      <div
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ${config.bg} ${config.color} ring-4 ring-card`}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 pb-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <p className="text-sm leading-none font-medium text-foreground">
                            {getStatusLabel(update.status, statusLabels)}
                          </p>
                          <time className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                            {new Date(update.timestamp).toLocaleDateString()}
                          </time>
                        </div>

                        <div className="mt-1 text-xs font-medium text-muted-foreground">
                          by {update.author}
                        </div>

                        {update.note && (
                          <div className="mt-3 rounded border bg-muted/50 p-3 text-sm text-foreground">
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
