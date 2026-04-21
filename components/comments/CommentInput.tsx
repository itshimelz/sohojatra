"use client"

import { useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { PaperPlaneTilt, X } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { CommentAvatar } from "./Avatar"

interface CommentInputProps {
  currentUser: { name: string }
  placeholder?: string
  onSubmit: (content: string) => Promise<void>
  onCancel?: () => void
  isReply?: boolean
  replyingTo?: string
  disabled?: boolean
}

export function CommentInput({
  currentUser,
  placeholder,
  onSubmit,
  onCancel,
  isReply = false,
  replyingTo,
  disabled = false,
}: CommentInputProps) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const defaultPlaceholder = replyingTo
    ? `Replying to ${replyingTo}…`
    : placeholder ?? "Share your thoughts on this concern…"

  async function handleSubmit() {
    const trimmed = content.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      setContent("")
    } finally {
      setSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      void handleSubmit()
    }
  }

  return (
    <div className={isReply ? "ml-10 sm:ml-14" : "flex gap-3"}>
      {!isReply && (
        <CommentAvatar name={currentUser.name} size="md" className="mt-0.5 shrink-0" />
      )}

      <div className="flex-1 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={defaultPlaceholder}
          rows={isReply ? 2 : 3}
          disabled={disabled || submitting}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none disabled:opacity-50 transition-colors"
        />

        <AnimatePresence>
          {content.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-between"
            >
              <p className="text-[11px] text-muted-foreground">
                ⌘↵ to submit
              </p>
              <div className="flex items-center gap-2">
                {(isReply || onCancel) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancel}
                    disabled={submitting}
                    className="h-8 gap-1.5 text-muted-foreground"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="h-8 gap-1.5 rounded-full px-4"
                >
                  <PaperPlaneTilt className="size-3.5" weight="fill" />
                  {submitting ? "Posting…" : isReply ? "Reply" : "Comment"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
