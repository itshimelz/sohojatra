"use client"

import { useState } from "react"
import { Info, MagnifyingGlass, PaperPlaneTilt, CheckCircle, XCircle } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getStatusLabel } from "@/lib/concerns/presentation"

type StatusLabels = {
  submitted: string
  underReview: string
  resolved: string
  rejected: string
}

type TimelineCopy = {
  timeline: string
  liveUpdates: string
  noUpdates: string
  by: string
  officialNote: string
}

type TimelineUpdate = {
  id?: string
  status: string
  timestamp: string
  author: string
  note?: string
}

const STATUS_CONFIG = {
  Submitted: {
    icon: PaperPlaneTilt,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  "Under Review": {
    icon: MagnifyingGlass,
    color: "text-amber-600",
    bg: "bg-amber-500/10",
  },
  Resolved: {
    icon: CheckCircle,
    color: "text-emerald-600",
    bg: "bg-emerald-500/10",
  },
  Rejected: {
    icon: XCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
} as const

export function StatusTimelineModal({
  updates,
  statusLabels,
  copy,
}: {
  updates: TimelineUpdate[]
  statusLabels: StatusLabels
  copy: TimelineCopy
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-9 rounded-full shadow-sm"
            aria-label={copy.timeline}
          >
            <Info className="size-4" weight="bold" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{copy.timeline}</DialogTitle>
          <DialogDescription>{copy.liveUpdates}</DialogDescription>
        </DialogHeader>

        {updates.length === 0 ? (
          <div className="rounded-xl border border-dashed py-6 text-center">
            <p className="text-sm text-muted-foreground italic">{copy.noUpdates}</p>
          </div>
        ) : (
          <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1">
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
                    <div
                      className={`relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${cfg.bg} ${cfg.color}`}
                    >
                      <Icon className="size-3" weight="fill" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-1">
                        <p className="text-sm font-semibold leading-snug text-foreground">
                          {getStatusLabel(update.status as any, statusLabels)}
                        </p>
                        <time className="shrink-0 text-[11px] text-muted-foreground">
                          {new Date(update.timestamp).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </time>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {copy.by} {update.author}
                      </p>
                      {update.note && (
                        <div className="mt-2 rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-foreground">
                          <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {copy.officialNote}
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
      </DialogContent>
    </Dialog>
  )
}
