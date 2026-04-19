import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { getConcern } from "@/lib/sohojatra/store"
import { MOCK_CONCERNS } from "@/lib/concerns/mock"
import { getDictionary } from "@/lib/i18n/server"
import { SITE_URL } from "@/lib/seo"
import { getServerSession } from "@/lib/auth-session"
import { getStatusLabel } from "@/lib/concerns/presentation"
import { UpvoteButton } from "@/components/upvote-button"
import { buttonVariants } from "@/components/ui/button-variants"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import {
  CaretLeft,
  Images,
  User,
  Clock,
  MapPin,
  PaperPlaneTilt,
  MagnifyingGlass,
  CheckCircle,
  XCircle,
} from "@phosphor-icons/react/dist/ssr"

type DetailParams = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: DetailParams): Promise<Metadata> {
  const { id } = await params
  const concern =
    (await getConcern(id).catch(() => null)) ??
    MOCK_CONCERNS.find((c) => c.id === id) ??
    null

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
    openGraph: { title: `${title} — Sohojatra`, description, url, type: "article" },
  }
}

const STATUS_CONFIG = {
  Submitted:     { icon: PaperPlaneTilt, color: "text-muted-foreground",     bg: "bg-muted",           ring: "ring-muted-foreground/20" },
  "Under Review":{ icon: MagnifyingGlass,color: "text-amber-600",            bg: "bg-amber-500/10",    ring: "ring-amber-500/20" },
  Resolved:      { icon: CheckCircle,    color: "text-emerald-600",          bg: "bg-emerald-500/10",  ring: "ring-emerald-500/20" },
  Rejected:      { icon: XCircle,        color: "text-destructive",           bg: "bg-destructive/10",  ring: "ring-destructive/20" },
} as const

export default async function ConcernDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const d = await getDictionary()
  const { id } = await params

  // Try store API first (DB-backed or file state), then fall back to mock data
  const concern =
    (await getConcern(id).catch(() => null)) ??
    MOCK_CONCERNS.find((item) => item.id === id) ??
    null

  if (!concern) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-32 text-center text-muted-foreground font-medium">
        {d.concernDetail.notFound}
      </div>
    )
  }

  const session = await getServerSession()
  const userId = session?.user?.id ?? null
  const currentVote = null
  const photos = concern.photos ?? []
  const updates = concern.updates ?? []
  const displayStatus = concern.status
  const statusCfg = STATUS_CONFIG[displayStatus as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.Submitted
  const StatusIcon = statusCfg.icon
  const statusLabels = {
    submitted: d.concerns.submitted,
    underReview: d.concerns.underReview,
    resolved: d.concerns.resolved,
    rejected: d.concerns.rejected,
  }
  const tr = d.tracking

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* ── Back link ── */}
      <Link
        href="/concerns"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-2 gap-1.5 text-muted-foreground hover:text-foreground",
        })}
      >
        <CaretLeft className="size-4" />
        {d.concernDetail.backToConcerns}
      </Link>

      {/* ── Photo gallery hero ── */}
      {photos.length > 0 && (
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/60">
          {photos.length === 1 ? (
            <AspectRatio ratio={16 / 7}>
              <Image src={photos[0]} alt="Concern photo" fill className="object-cover" />
            </AspectRatio>
          ) : photos.length === 2 ? (
            <div className="grid grid-cols-2 gap-px bg-border/40">
              {photos.map((src, i) => (
                <div key={i} className="relative overflow-hidden bg-muted">
                  <AspectRatio ratio={4 / 3}>
                    <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
                  </AspectRatio>
                </div>
              ))}
            </div>
          ) : (
            /* 3-photo mosaic: large left + two stacked right */
            <div className="grid grid-cols-[2fr_1fr] gap-px bg-border/40" style={{ height: "380px" }}>
              <div className="relative overflow-hidden bg-muted">
                <Image src={photos[0]} alt="Photo 1" fill className="object-cover" />
              </div>
              <div className="flex flex-col gap-px">
                {photos.slice(1, 3).map((src, i) => (
                  <div key={i} className="relative flex-1 overflow-hidden bg-muted">
                    <Image src={src} alt={`Photo ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {photos.length > 0 && (
            <div className="flex items-center gap-1.5 border-t border-border/40 bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
              <Images className="size-3.5" />
              {photos.length} {photos.length > 1 ? d.concernDetail.photosAttached : d.concernDetail.photoAttached}
            </div>
          )}
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

        {/* ── Left column: concern body ── */}
        <div className="space-y-6">
          {/* Header card */}
          <div className="rounded-2xl border border-border/60 bg-card p-6">
            {/* Status + ID row */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
                <StatusIcon className="size-3.5" weight="fill" />
                {getStatusLabel(displayStatus, statusLabels)}
              </div>
              <span className="rounded-lg bg-muted px-2.5 py-1 font-mono text-xs text-muted-foreground">
                #{concern.id.slice(0, 8)}
              </span>
            </div>

            {/* Title */}
            <h1 className="mb-4 text-2xl font-bold tracking-tight leading-tight sm:text-3xl">
              {concern.title}
            </h1>

            {/* Description */}
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
              {concern.description}
            </p>

            {/* Meta row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2.5 border-t border-border/50 pt-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <User className="size-4" weight="duotone" />
                <span className="font-medium text-foreground">{concern.author.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" weight="duotone" />
                <time dateTime={new Date(concern.createdAt).toISOString()}>
                  {new Date(concern.createdAt).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="size-4" weight="duotone" />
                <span>
                  {concern.location.address ||
                    `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}
                </span>
              </div>
            </div>
          </div>

          {/* Vote bar — compact FB-style */}
          <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-card px-5 py-3">
            <span className="text-xs font-medium text-muted-foreground">
              {!userId ? d.concernDetail.signInToVote : d.concernDetail.wasThisHelpful}
            </span>
            <UpvoteButton
              concernId={concern.id}
              initialUpvotes={concern.upvotes}
              initialDownvotes={concern.downvotes}
              initialVote={currentVote}
              isAuthenticated={!!userId}
              variant="compact"
            />
          </div>
        </div>

        {/* ── Right column: tracking timeline ── */}
        <div className="sticky top-6 h-fit rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="mb-0.5 text-base font-semibold">{tr.timeline}</h3>
          <p className="mb-5 text-xs text-muted-foreground">{d.concernDetail.liveUpdates}</p>

          {updates.length === 0 ? (
            <div className="rounded-xl border border-dashed py-6 text-center">
              <p className="text-sm text-muted-foreground italic">{d.concernDetail.noUpdates}</p>
            </div>
          ) : (
            <div className="space-y-6 pl-1">
              {updates.map((update, index) => {
                const cfg =
                  STATUS_CONFIG[update.status as keyof typeof STATUS_CONFIG] ??
                  STATUS_CONFIG.Submitted
                const Icon = cfg.icon
                const isLast = index === updates.length - 1

                return (
                  <div key={update.id ?? index} className="relative">
                    {!isLast && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border" />
                    )}
                    <div className="flex gap-3">
                      {/* Node */}
                      <div
                        className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-card ${cfg.bg} ${cfg.color}`}
                      >
                        <Icon className="size-3" weight="fill" />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-1">
                          <p className="text-sm font-semibold leading-snug text-foreground">
                            {getStatusLabel(update.status, statusLabels)}
                          </p>
                          <time className="shrink-0 text-[11px] text-muted-foreground">
                            {new Date(update.timestamp).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </time>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{d.concernDetail.by} {update.author}</p>
                        {update.note && (
                          <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                              {tr.officialNote}
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
          )}
        </div>
      </div>
    </div>
  )
}
