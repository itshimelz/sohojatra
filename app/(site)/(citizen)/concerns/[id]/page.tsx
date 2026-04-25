import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

import { getConcern } from "@/lib/sohojatra/store"
import { getDictionary } from "@/lib/i18n/server"
import { SITE_URL } from "@/lib/seo"
import { getServerSession } from "@/lib/auth-session"
import { getStatusLabel } from "@/lib/concerns/presentation"
import { UpvoteButton } from "@/components/upvote-button"
import { buttonVariants } from "@/components/ui/button-variants"
import { CommentSection } from "@/components/comments/CommentSection"
import { AiInsightPanel } from "@/components/ai/AiInsightPanel"
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
import { StatusTimelineModal } from "@/components/concerns/status-timeline-modal"

type DetailParams = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: DetailParams): Promise<Metadata> {
  const { id } = await params
  const concern = (await getConcern(id).catch(() => null)) ?? null

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

  const concern = (await getConcern(id).catch(() => null)) ?? null

  if (!concern) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-32 text-center text-muted-foreground font-medium">
        {d.concernDetail.notFound}
      </div>
    )
  }

  const session = await getServerSession()
  const userId = session?.user?.id ?? null
  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name ?? "Anonymous" }
    : null
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
        <div className="relative mb-8 overflow-hidden rounded-2xl border border-border/60 bg-muted/20">
          <div className="absolute right-3 top-3 z-10">
            <StatusTimelineModal
              updates={updates}
              statusLabels={statusLabels}
              copy={{
                timeline: tr.timeline,
                liveUpdates: d.concernDetail.liveUpdates,
                noUpdates: d.concernDetail.noUpdates,
                by: d.concernDetail.by,
                officialNote: tr.officialNote,
              }}
            />
          </div>
          {photos.length === 1 ? (
            <AspectRatio ratio={16 / 9}>
              <Image src={photos[0]} alt="Concern photo" fill className="object-cover" />
            </AspectRatio>
          ) : photos.length === 2 ? (
            <div className="grid grid-cols-2 gap-1 p-1">
              {photos.map((src, i) => (
                <div key={i} className="relative overflow-hidden rounded-xl bg-muted">
                  <AspectRatio ratio={1}>
                    <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" />
                  </AspectRatio>
                </div>
              ))}
            </div>
          ) : (
            /* 3+ photos: wide hero + stacked previews (feed style) */
            <div className="grid grid-cols-1 gap-1 p-1 md:grid-cols-[2fr_1fr]" style={{ minHeight: "320px" }}>
              <div className="relative overflow-hidden rounded-xl bg-muted">
                <Image src={photos[0]} alt="Photo 1" fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" />
              </div>
              <div className="flex flex-col gap-1">
                {photos.slice(1, 3).map((src, i) => (
                  <div key={i} className="relative flex-1 overflow-hidden rounded-xl bg-muted">
                    <Image src={src} alt={`Photo ${i + 2}`} fill className="object-cover transition-transform duration-300 hover:scale-[1.02]" />
                    {i === 1 && photos.length > 3 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white">
                        +{photos.length - 3} more
                      </div>
                    )}
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

      {/* ── Post detail stream (X-style hierarchy, list theme) ── */}
      <div className="border-y border-border">
        <article className="py-5">
          {/* Status + ID row */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.bg} ${statusCfg.color}`}>
              <StatusIcon className="size-3.5" weight="fill" />
              {getStatusLabel(displayStatus, statusLabels)}
            </div>
            <span className="font-mono text-xs text-muted-foreground">#{concern.id.slice(0, 8)}</span>
          </div>

          {/* AI stats above title */}
          {concern.description.length >= 10 && (
            <AiInsightPanel
              text={concern.description}
              variant="inline"
              className="mb-3"
            />
          )}

          {/* Title */}
          <h1 className="mb-3 text-2xl font-bold tracking-tight leading-tight sm:text-3xl">
            {concern.title}
          </h1>

          {/* Post body */}
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground">
            {concern.description}
          </p>

          {/* Meta row */}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
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
        </article>

        {/* Engagement row */}
        <div className="flex items-center justify-between py-3">
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

      {/* ── Comment section ── */}
      <div className="mt-8">
        <CommentSection
          apiPath={`/api/concerns/${concern.id}/comments`}
          currentUser={currentUser}
        />
      </div>
    </div>
  )
}
