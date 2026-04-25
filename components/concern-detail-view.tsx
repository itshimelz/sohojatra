"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  CaretLeft as ChevronLeft,
  CheckCircle,
  Clock,
  MapPin,
  User,
  WarningCircle,
  ArrowUp,
  ArrowDown,
  ChatDots,
  Lightbulb,
} from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import type { Concern } from "@/lib/concerns/types"
import { getStatusBadgeVariant, getStatusLabel } from "@/lib/concerns/presentation"
import { findConcernById } from "@/lib/concerns/client-store"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type ConcernComment = {
  id: string
  concernId: string
  authorName: string
  body: string
  quoted?: string
  upvotes: number
  downvotes: number
  aiPriorityScore: number
  createdAt: string
}

type SolutionPlan = {
  id: string
  concernId: string
  title: string
  summary: string
  technicalDocs: string[]
  budgetEstimateBdt: number
  timeline: string
  riskNotes: string
  status: "Submitted" | "UnderReview" | "Approved" | "Rejected" | "RevisionRequested"
  submittedBy: string
  governmentComments?: string
  assignedDepartment?: string
  createdAt: string
  updatedAt: string
}

const PLAN_STATUS_COLORS: Record<string, string> = {
  Submitted: "bg-blue-100 text-blue-800",
  UnderReview: "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  RevisionRequested: "bg-orange-100 text-orange-800",
}

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
  const [comments, setComments] = useState<ConcernComment[]>([])
  const [plans, setPlans] = useState<SolutionPlan[]>([])
  const [commentBody, setCommentBody] = useState("")
  const [commentAuthor, setCommentAuthor] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "anon"
    return window.localStorage.getItem("sohojatra_user_id") ?? `citizen-${Math.random().toString(36).slice(2, 10)}`
  }, [])

  useEffect(() => {
    const fromClient = findConcernById(concernId)
    if (fromClient) setConcern(fromClient)

    // Load comments and solution plans in parallel
    Promise.all([
      fetch(`/api/concerns/${concernId}/comments`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setComments(Array.isArray(d.comments) ? d.comments : [])),
      fetch(`/api/solution-plans?concernId=${concernId}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setPlans(Array.isArray(d.plans) ? d.plans : [])),
    ]).catch(() => {})
  }, [concernId])

  const statusLabels = {
    submitted: t.submitted,
    underReview: t.underReview,
    resolved: t.resolved,
    rejected: t.rejected,
  }

  const handleVote = async (value: 1 | -1) => {
    if (hasVoted) return
    setHasVoted(true)
    try {
      await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, targetType: "concern", targetId: concernId, value }),
      })
      if (concern) {
        setConcern({
          ...concern,
          upvotes: value === 1 ? concern.upvotes + 1 : concern.upvotes,
          downvotes: value === -1 ? concern.downvotes + 1 : concern.downvotes,
        })
      }
    } catch {
      setHasVoted(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!commentBody.trim() || !commentAuthor.trim()) return
    setIsSubmittingComment(true)
    try {
      const res = await fetch(`/api/concerns/${concernId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: commentAuthor.trim(), body: commentBody.trim() }),
      })
      if (res.ok) {
        const data = (await res.json()) as { comment: ConcernComment }
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev])
          setCommentBody("")
        }
      }
    } finally {
      setIsSubmittingComment(false)
    }
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
          <Link
            href="/concerns"
            className={buttonVariants({ variant: "outline", className: "rounded-full" })}
          >
            {t.details}
          </Link>
          <Link
            href="/concerns/submit"
            className={buttonVariants({ className: "rounded-full" })}
          >
            {t.submitNew}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/concerns"
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "mb-6 -ml-3 rounded-full flex items-center gap-2",
        })}
      >
        <ChevronLeft className="h-4 w-4" />
        {t.details}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-8">
          {/* Concern Header */}
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
                <span>
                  {concern.location.address ??
                    `${concern.location.lat.toFixed(4)}, ${concern.location.lng.toFixed(4)}`}
                </span>
              </div>
            </div>

            {/* Vote buttons */}
            <div className="mt-4 flex items-center gap-3 border-t border-border/60 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
                disabled={hasVoted}
                onClick={() => void handleVote(1)}
              >
                <ArrowUp className="h-4 w-4" />
                <span>{concern.upvotes}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
                disabled={hasVoted}
                onClick={() => void handleVote(-1)}
              >
                <ArrowDown className="h-4 w-4" />
                <span>{concern.downvotes}</span>
              </Button>
              {hasVoted && (
                <span className="text-xs text-muted-foreground">Vote recorded</span>
              )}
            </div>
          </div>

          {concern.photos.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Attached Photos</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {concern.photos.map((photo, index) => (
                  <div
                    key={photo}
                    className="relative aspect-video overflow-hidden rounded-2xl border bg-muted"
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

          {/* Solution Plans */}
          {plans.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Solution Proposals ({plans.length})</h3>
              </div>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className="rounded-2xl border border-border/60 bg-card p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h4 className="font-semibold">{plan.title}</h4>
                      <Badge className={PLAN_STATUS_COLORS[plan.status] ?? "bg-gray-100"}>
                        {plan.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.summary}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget Estimate</p>
                        <p className="font-medium">৳ {plan.budgetEstimateBdt.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timeline</p>
                        <p className="font-medium">{plan.timeline}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Submitted by {plan.submittedBy}
                      {plan.assignedDepartment && ` · Assigned: ${plan.assignedDepartment}`}
                    </p>
                    {plan.governmentComments && (
                      <div className="rounded-xl bg-muted/50 border border-border/40 p-3 text-sm">
                        <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                          Government Note:
                        </span>
                        <p className="mt-1">{plan.governmentComments}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discussion */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ChatDots className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                Discussion{comments.length > 0 ? ` (${comments.length})` : ""}
              </h3>
            </div>

            {/* Add comment form */}
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <input
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Your name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
              />
              <textarea
                className="w-full rounded-xl border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px] resize-none"
                placeholder="Add a comment… (Bangla or English)"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <Button
                size="sm"
                className="rounded-full"
                disabled={isSubmittingComment || !commentBody.trim() || !commentAuthor.trim()}
                onClick={() => void handleCommentSubmit()}
              >
                {isSubmittingComment ? "Posting…" : "Post Comment"}
              </Button>
            </div>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="rounded-2xl border border-border/60 bg-card p-4 space-y-2"
                  >
                    {comment.quoted && (
                      <blockquote className="border-l-2 border-primary/40 pl-3 text-xs text-muted-foreground italic">
                        {comment.quoted}
                      </blockquote>
                    )}
                    <p className="text-sm">{comment.body}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-medium">{comment.authorName}</span>
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                    {comment.aiPriorityScore > 0 && (
                      <div className="text-xs text-primary font-medium">
                        AI Score: {comment.aiPriorityScore.toFixed(1)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No comments yet. Be the first to add context or evidence.
              </p>
            )}
          </div>
        </div>

        {/* Timeline sidebar */}
        <div className="sticky top-6 h-fit space-y-6 rounded-3xl border border-border/60 bg-card p-6">
          <div>
            <h3 className="mb-1 text-lg font-semibold">{tr.timeline}</h3>
            <p className="mb-6 text-sm text-muted-foreground">Live status updates for this concern</p>
          </div>

          <div className="space-y-8 pl-2">
            {concern.updates
              .slice()
              .sort(
                (left, right) =>
                  new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
              )
              .map((update, index) => {
                const isLast = index === concern.updates.length - 1
                const isResolved = update.status === "Resolved"

                return (
                  <div key={update.id} className="relative">
                    {!isLast && (
                      <div className="absolute top-6 bottom-[-32px] left-[11px] w-px bg-border" />
                    )}
                    <div className="flex gap-4">
                      <div
                        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-card ${
                          isResolved
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isResolved ? (
                          <CheckCircle className="h-3 w-3" weight="fill" />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-current" />
                        )}
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
                        <div className="mt-1 text-xs font-medium text-muted-foreground">
                          by {update.author}
                        </div>
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
