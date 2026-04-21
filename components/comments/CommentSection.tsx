"use client"

import { useCallback, useEffect, useState } from "react"
import { ChatCircle, Spinner } from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { CommentCard } from "./CommentCard"
import { CommentInput } from "./CommentInput"
import type { CommentData, CommentSortOrder, CommentUser } from "./types"
import { AiBadge } from "@/components/ai/AiBadge"

interface RawComment {
  id: string
  authorName?: string
  author?: string
  body: string
  upvotes?: number
  downvotes?: number
  createdAt: string
  parentCommentId?: string
  quoted?: string
  aiPriorityScore?: number
}

function buildTree(flat: RawComment[]): CommentData[] {
  const map = new Map<string, CommentData>()
  const roots: CommentData[] = []

  for (const c of flat) {
    map.set(c.id, {
      id: c.id,
      user: { name: c.authorName ?? c.author ?? "Anonymous" },
      body: c.body,
      upvotes: c.upvotes ?? 0,
      downvotes: c.downvotes ?? 0,
      createdAt: c.createdAt,
      parentCommentId: c.parentCommentId,
      quoted: c.quoted,
      aiPriorityScore: c.aiPriorityScore,
      replies: [],
    })
  }

  for (const node of map.values()) {
    if (node.parentCommentId && map.has(node.parentCommentId)) {
      map.get(node.parentCommentId)!.replies!.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

function sortRoots(roots: CommentData[], order: CommentSortOrder): CommentData[] {
  return [...roots].sort((a, b) =>
    order === "popular"
      ? b.upvotes - b.downvotes - (a.upvotes - a.downvotes)
      : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

interface CommentSectionProps {
  /** API path, e.g. "/api/concerns/abc/comments" */
  apiPath: string
  currentUser: CommentUser | null
  className?: string
}

export function CommentSection({ apiPath, currentUser, className }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([])
  const [sort, setSort] = useState<CommentSortOrder>("popular")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setError(null)
      const res = await fetch(apiPath)
      if (!res.ok) throw new Error("Failed to load comments")
      const data = (await res.json()) as { comments?: RawComment[] }
      setComments(buildTree(data.comments ?? []))
    } catch {
      setError("Could not load comments. Please refresh.")
    } finally {
      setLoading(false)
    }
  }, [apiPath])

  useEffect(() => { void load() }, [load])

  async function handleTopLevelSubmit(content: string) {
    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: content }),
    })
    if (!res.ok) throw new Error("Failed to post comment")
    await load()
  }

  async function handleReply(parentId: string, content: string, replyingToName: string) {
    const quoted = comments
      .flatMap((c) => [c, ...(c.replies ?? [])])
      .find((c) => c.id === parentId)?.body
      ?.slice(0, 120)

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: content,
        parentCommentId: parentId,
        quoted: quoted ? `${replyingToName}: ${quoted}` : undefined,
      }),
    })
    if (!res.ok) throw new Error("Failed to post reply")
    await load()
  }

  async function handleVote(commentId: string, direction: "up" | "down") {
    await fetch(`/api/votes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType: "comment", targetId: commentId, value: direction === "up" ? 1 : -1 }),
    })
  }

  const totalCount = comments.reduce(
    (acc, c) => acc + 1 + (c.replies?.length ?? 0),
    0,
  )
  const sorted = sortRoots(comments, sort)

  return (
    <section className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ChatCircle className="size-5 text-muted-foreground" weight="duotone" />
          <h2 className="text-base font-semibold">
            {totalCount > 0 ? `${totalCount} Comment${totalCount !== 1 ? "s" : ""}` : "Comments"}
          </h2>
          <AiBadge label="AI monitored" size="xs" pulse={false} />
        </div>

        {/* Sort tabs */}
        <div className="flex items-center gap-1 rounded-full bg-muted p-1">
          {(["popular", "recent"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-semibold capitalize transition-colors",
                sort === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Top-level input */}
      {currentUser ? (
        <CommentInput
          currentUser={currentUser}
          onSubmit={handleTopLevelSubmit}
          placeholder="Join the discussion…"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 py-5 text-center text-sm text-muted-foreground">
          <a href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </a>{" "}
          to join the discussion
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-10">
          <Spinner className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-destructive">{error}</p>
      ) : sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
          <ChatCircle className="mx-auto mb-2 size-8 text-muted-foreground/40" weight="duotone" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sorted.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              onReply={handleReply}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </section>
  )
}
