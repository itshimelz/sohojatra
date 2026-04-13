"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbsUp, ThumbsDown } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

type Props = {
  initialUpvotes: number
  initialHasUpvoted: boolean
}

export function UpvoteButton({ initialUpvotes, initialHasUpvoted }: Props) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [voteState, setVoteState] = useState<"up" | "down" | "none">(
    initialHasUpvoted ? "up" : "none"
  )
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: string }[]>([])

  const handleVote = (e: React.MouseEvent<HTMLButtonElement>, type: "up" | "down") => {
    // Calculate click origin for popup animation
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const id = Date.now()

    if (type === "up") {
      setClicks((prev) => [...prev, { id, x, y, val: "+1" }])
      if (voteState !== "up") {
        setVoteState("up")
        setUpvotes((prev) => (voteState === "down" ? prev + 2 : prev + 1))
      } else {
        // Repeated claps like Medium
        setUpvotes((prev) => prev + 1)
      }
    } else {
      setClicks((prev) => [...prev, { id, x, y, val: "-1" }])
      if (voteState !== "down") {
        setVoteState("down")
        setUpvotes((prev) => (voteState === "up" ? prev - 2 : prev - 1))
      } else {
        // Repeated downvotes
        setUpvotes((prev) => prev - 1)
      }
    }

    // Cleanup click after animation
    setTimeout(() => {
      setClicks((prev) => prev.filter((c) => c.id !== id))
    }, 1000)
  }

  return (
    <div className="relative inline-flex flex-col items-center gap-2">
      <div className="flex flex-col items-center rounded-full border border-border/60 bg-background/50 p-1">
        {/* Upvote Button */}
        <motion.button
          onClick={(e) => handleVote(e, "up")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full outline-none transition-colors",
            voteState === "up"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <ThumbsUp weight={voteState === "up" ? "fill" : "duotone"} className="size-6" />
          
          <AnimatePresence>
            {clicks
              .filter((c) => c.val === "+1")
              .map((click) => (
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
        
        {/* Count Label */}
        <span
          className={cn(
            "py-1.5 text-sm font-bold tabular-nums",
            voteState === "up"
              ? "text-primary"
              : voteState === "down"
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {upvotes}
        </span>

        {/* Downvote Button */}
        <motion.button
          onClick={(e) => handleVote(e, "down")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "relative flex size-12 items-center justify-center rounded-full outline-none transition-colors",
            voteState === "down"
              ? "bg-destructive/10 text-destructive"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          <ThumbsDown weight={voteState === "down" ? "fill" : "duotone"} className="size-6" />
          
          <AnimatePresence>
            {clicks
              .filter((c) => c.val === "-1")
              .map((click) => (
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
