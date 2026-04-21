"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import {
  ThumbsUp,
  ThumbsDown,
  ArrowBendUpLeft,
  CaretDown,
  CaretRight,
  DotsThree,
  Quotes,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"
import { CommentAvatar } from "./Avatar"
import { CommentInput } from "./CommentInput"
import type { CommentData, CommentUser } from "./types"

interface CommentCardProps {
  comment: CommentData
  currentUser: CommentUser | null
  onReply: (parentId: string, content: string, replyingToName: string) => Promise<void>
  onVote: (commentId: string, direction: "up" | "down") => Promise<void>
  depth?: number
}

export function CommentCard({
  comment,
  currentUser,
  onReply,
  onVote,
  depth = 0,
}: CommentCardProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [repliesCollapsed, setRepliesCollapsed] = useState(depth >= 2)
  const [localUpvotes, setLocalUpvotes] = useState(comment.upvotes)
  const [localDownvotes, setLocalDownvotes] = useState(comment.downvotes)
  const [voted, setVoted] = useState<"up" | "down" | null>(null)

  const hasReplies = (comment.replies?.length ?? 0) > 0
  const isNested = depth > 0

  async function handleVote(dir: "up" | "down") {
    if (!currentUser || voted === dir) return
    setVoted(dir)
    if (dir === "up") setLocalUpvotes((v) => v + 1)
    else setLocalDownvotes((v) => v + 1)
    await onVote(comment.id, dir)
  }

  async function handleReplySubmit(content: string) {
    await onReply(comment.id, content, comment.user.name)
    setReplyOpen(false)
  }

  return (
    <div className={cn("space-y-3", isNested && "border-l-2 border-border/40 pl-4 sm:pl-6")}>
      {/* Comment bubble */}
      <div className="flex items-start gap-3">
        <CommentAvatar
          name={comment.user.name}
          size={isNested ? "sm" : "md"}
          className="mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1">
          {/* Header */}
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="text-sm font-semibold text-foreground">
                {comment.user.name}
              </span>
              {comment.user.isAuthor && (
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Author
                </span>
              )}
              <time className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt))} ago
              </time>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <DotsThree className="size-5" weight="bold" />
            </button>
          </div>

          {/* Quoted text */}
          {comment.quoted && (
            <div className="mb-2 flex gap-2 rounded-lg border-l-2 border-border bg-muted/40 py-2 pl-3 pr-2">
              <Quotes className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" weight="fill" />
              <p className="text-xs italic text-muted-foreground line-clamp-2">{comment.quoted}</p>
            </div>
          )}

          {/* Body */}
          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {comment.body}
          </p>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 pl-11 sm:pl-14">
        {/* Upvote */}
        <button
          onClick={() => void handleVote("up")}
          disabled={!currentUser}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            voted === "up"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/60 text-foreground hover:bg-muted",
          )}
        >
          <ThumbsUp className="size-3.5" weight={voted === "up" ? "fill" : "regular"} />
          {localUpvotes}
        </button>

        {/* Downvote */}
        <button
          onClick={() => void handleVote("down")}
          disabled={!currentUser}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
            voted === "down"
              ? "bg-destructive/15 text-destructive"
              : "bg-muted/60 text-foreground hover:bg-muted",
          )}
        >
          <ThumbsDown className="size-3.5" weight={voted === "down" ? "fill" : "regular"} />
          {localDownvotes}
        </button>

        {/* Reply */}
        {currentUser && depth < 4 && (
          <button
            onClick={() => setReplyOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowBendUpLeft className="size-3.5" />
            Reply
          </button>
        )}
      </div>

      {/* Inline reply input */}
      {replyOpen && currentUser && (
        <div className="pl-11 sm:pl-14">
          <CommentInput
            currentUser={currentUser}
            onSubmit={handleReplySubmit}
            onCancel={() => setReplyOpen(false)}
            isReply
            replyingTo={comment.user.name}
          />
        </div>
      )}

      {/* Nested replies */}
      {hasReplies && (
        <div className="space-y-1 pl-11 sm:pl-14">
          <button
            onClick={() => setRepliesCollapsed((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {repliesCollapsed ? (
              <CaretRight className="size-3.5" />
            ) : (
              <CaretDown className="size-3.5" />
            )}
            {comment.replies!.length}{" "}
            {comment.replies!.length === 1 ? "reply" : "replies"}
          </button>

          {!repliesCollapsed && (
            <div className="mt-3 space-y-4">
              {comment.replies!.map((reply) => (
                <CommentCard
                  key={reply.id}
                  comment={reply}
                  currentUser={currentUser}
                  onReply={onReply}
                  onVote={onVote}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
