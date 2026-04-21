"use client"

import { Brain } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface AiBadgeProps {
  label?: string
  className?: string
  pulse?: boolean
  size?: "xs" | "sm"
}

export function AiBadge({
  label = "Fine-tuned AI",
  className,
  pulse = true,
  size = "sm",
}: AiBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/8 font-medium text-violet-600 dark:text-violet-400",
        size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className,
      )}
    >
      <span className="relative flex items-center">
        {pulse && (
          <span className="absolute inset-0 rounded-full bg-violet-500 opacity-40 animate-ping" />
        )}
        <span className="relative size-1.5 rounded-full bg-violet-500" />
      </span>
      <Brain className={size === "xs" ? "size-2.5" : "size-3"} weight="fill" />
      {label}
    </span>
  )
}
