"use client"

import React, { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown, LockSimple } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { castVoteAction } from "@/app/(site)/(citizen)/concerns/submit/actions"

type Props = {
  concernId: string
  initialUpvotes: number
  initialDownvotes: number
  initialVote: "up" | "down" | null
  isAuthenticated: boolean
  /** "default" = large vertical pill (list cards), "compact" = small horizontal FB-style bar */
  variant?: "default" | "compact"
}

export function UpvoteButton({
  concernId,
  initialUpvotes,
  initialDownvotes,
  initialVote,
  isAuthenticated,
  variant = "default",
}: Props) {
  const [upvotes, setUpvotes]     = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [voteState, setVoteState] = useState<"up" | "down" | null>(initialVote)
  const [clicks, setClicks]       = useState<{ id: number; x: number; y: number; val: string }[]>([])
  const [isPending, startTransition] = useTransition()

  const triggerFloat = (e: React.MouseEvent<HTMLButtonElement>, val: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const id   = Date.now()
    setClicks((prev) => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top, val }])
    setTimeout(() => setClicks((prev) => prev.filter((c) => c.id !== id)), 900)
  }

  const handleVote = (e: React.MouseEvent<HTMLButtonElement>, type: "up" | "down") => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to vote.", { description: "Sign in to make your voice heard." })
      return
    }
    if (isPending) return

    const prev = voteState
    if (prev === type) {
      triggerFloat(e, type === "up" ? "-1" : "+1")
      setVoteState(null)
      setUpvotes((u)   => type === "up"   ? u - 1 : u)
      setDownvotes((d) => type === "down" ? d - 1 : d)
    } else if (prev !== null) {
      triggerFloat(e, type === "up" ? "+1" : "-1")
      setVoteState(type)
      setUpvotes(  (u) => type === "up"   ? u + 1 : u - 1)
      setDownvotes((d) => type === "down" ? d + 1 : d - 1)
    } else {
      triggerFloat(e, type === "up" ? "+1" : "-1")
      setVoteState(type)
      setUpvotes(  (u) => type === "up"   ? u + 1 : u)
      setDownvotes((d) => type === "down" ? d + 1 : d)
    }

    startTransition(async () => {
      try {
        await castVoteAction(concernId, type)
      } catch (err) {
        setVoteState(prev)
        setUpvotes(initialUpvotes)
        setDownvotes(initialDownvotes)
        toast.error(err instanceof Error ? err.message : "Failed to cast vote.")
      }
    })
  }

  const isLocked = !isAuthenticated

  // ── Compact Facebook-style variant ─────────────────────────────────────────
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        {/* Upvote */}
        <motion.button
          onClick={(e) => handleVote(e, "up")}
          whileTap={isLocked ? {} : { scale: 0.9 }}
          disabled={isPending}
          title={isLocked ? "Sign in to vote" : voteState === "up" ? "Retract upvote" : "Upvote"}
          className={cn(
            "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none select-none",
            voteState === "up"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isLocked && "cursor-not-allowed opacity-60",
            isPending && "cursor-wait"
          )}
        >
          {isLocked
            ? <LockSimple className="size-4" weight="duotone" />
            : <ThumbsUp className="size-4" weight={voteState === "up" ? "fill" : "regular"} />
          }
          <span className="tabular-nums">{upvotes}</span>

          <AnimatePresence>
            {clicks.filter((c) => c.val === "+1").map((click) => (
              <motion.span
                key={click.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -24 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-none absolute z-10 text-xs font-bold text-primary select-none"
                style={{ left: click.x, top: click.y - 8 }}
              >
                +1
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>

        {/* Divider */}
        <div className="h-4 w-px bg-border" />

        {/* Downvote */}
        <motion.button
          onClick={(e) => handleVote(e, "down")}
          whileTap={isLocked ? {} : { scale: 0.9 }}
          disabled={isPending}
          title={isLocked ? "Sign in to vote" : voteState === "down" ? "Retract downvote" : "Downvote"}
          className={cn(
            "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none select-none",
            voteState === "down"
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
            isLocked && "cursor-not-allowed opacity-60",
            isPending && "cursor-wait"
          )}
        >
          <ThumbsDown className="size-4" weight={voteState === "down" ? "fill" : "regular"} />
          <span className="tabular-nums">{downvotes}</span>

          <AnimatePresence>
            {clicks.filter((c) => c.val === "-1").map((click) => (
              <motion.span
                key={click.id}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: 20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="pointer-events-none absolute z-10 text-xs font-bold text-destructive select-none"
                style={{ left: click.x, top: click.y - 4 }}
              >
                -1
              </motion.span>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>
    )
  }

  // ── Default large vertical variant (list cards) ─────────────────────────────
  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <div className="flex flex-col items-center rounded-full border border-border/60 bg-background/50 p-1">
        <motion.button
          onClick={(e) => handleVote(e, "up")}
          whileHover={isLocked ? {} : { scale: 1.05 }}
          whileTap={isLocked ? {} : { scale: 0.95 }}
          disabled={isPending}
          title={isLocked ? "Sign in to vote" : voteState === "up" ? "Retract upvote" : "Upvote"}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full outline-none transition-colors",
            voteState === "up" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
            isLocked && "cursor-not-allowed opacity-60",
            isPending && "cursor-wait"
          )}
        >
          {isLocked
            ? <LockSimple className="size-5" weight="duotone" />
            : <ThumbsUp weight={voteState === "up" ? "fill" : "duotone"} className="size-6" />
          }
          <AnimatePresence>
            {clicks.filter((c) => c.val === "+1").map((click) => (
              <motion.div
                key={click.id}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: -50, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-none absolute z-10 font-bold text-primary drop-shadow-sm select-none"
                style={{ left: click.x - 10, top: click.y - 15 }}
              >
                +1
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.button>

        <span className={cn(
          "py-1.5 text-sm font-bold tabular-nums",
          voteState === "up" ? "text-primary" : voteState === "down" ? "text-destructive" : "text-muted-foreground"
        )}>
          {upvotes - downvotes}
        </span>

        <motion.button
          onClick={(e) => handleVote(e, "down")}
          whileHover={isLocked ? {} : { scale: 1.05 }}
          whileTap={isLocked ? {} : { scale: 0.95 }}
          disabled={isPending}
          title={isLocked ? "Sign in to vote" : voteState === "down" ? "Retract downvote" : "Downvote"}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full outline-none transition-colors",
            voteState === "down" ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:bg-muted",
            isLocked && "cursor-not-allowed opacity-60",
            isPending && "cursor-wait"
          )}
        >
          <ThumbsDown weight={voteState === "down" ? "fill" : "duotone"} className="size-6" />
          <AnimatePresence>
            {clicks.filter((c) => c.val === "-1").map((click) => (
              <motion.div
                key={click.id}
                initial={{ opacity: 1, y: 0, scale: 0.8 }}
                animate={{ opacity: 0, y: 50, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-none absolute z-10 font-bold text-destructive drop-shadow-sm select-none"
                style={{ left: click.x - 10, top: click.y - 15 }}
              >
                -1
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  )
}
