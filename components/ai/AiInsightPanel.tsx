"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle,
  Lightning,
  Spinner,
  Translate,
  Warning,
  XCircle,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { AiBadge } from "./AiBadge"

interface AiResult {
  sentiment: number   // -1 to 1
  urgency: number     // 0 to 1
  language: string
}

interface AiInsightPanelProps {
  text: string
  className?: string
  autoFetch?: boolean
  variant?: "card" | "inline"
}

function UrgencyLabel(u: number) {
  if (u >= 0.75) return { label: "Critical", color: "text-rose-600", bg: "bg-rose-500" }
  if (u >= 0.5)  return { label: "High",     color: "text-orange-600", bg: "bg-orange-500" }
  if (u >= 0.25) return { label: "Medium",   color: "text-amber-600",  bg: "bg-amber-500" }
  return              { label: "Low",        color: "text-emerald-600", bg: "bg-emerald-500" }
}

function SentimentLabel(s: number) {
  if (s >= 0.2)  return { label: "Constructive", Icon: CheckCircle, color: "text-emerald-600" }
  if (s >= -0.2) return { label: "Neutral",      Icon: Lightning,   color: "text-amber-600" }
  return              { label: "Critical",       Icon: XCircle,     color: "text-rose-600" }
}

export function AiInsightPanel({
  text,
  className,
  autoFetch = true,
  variant = "card",
}: AiInsightPanelProps) {
  const [result, setResult] = useState<AiResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function fetchAnalysis() {
    if (!text.trim() || text.trim().length < 10) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, user_id: "client" }),
      })
      if (!res.ok) throw new Error("AI service unavailable")
      const data = (await res.json()) as AiResult
      setResult(data)
    } catch {
      setError("AI analysis unavailable — model may be loading.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && text.trim().length >= 10) {
      void fetchAnalysis()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urgency  = result ? UrgencyLabel(result.urgency) : null
  const sentiment = result ? SentimentLabel(result.sentiment) : null

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
        <AiBadge size="xs" className="border-border bg-muted text-muted-foreground" pulse={false} />
        {loading && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
            <Spinner className="size-3 animate-spin" />
            Analyzing
          </span>
        )}
        {error && !loading && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-700 dark:text-amber-400">
            <Warning className="size-3" weight="fill" />
            Unavailable
          </span>
        )}
        {result && !loading && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
              <Lightning className="size-3 text-amber-500" weight="fill" />
              Urgency: <span className={cn("font-semibold", urgency!.color)}>{urgency!.label}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
              {sentiment && <sentiment.Icon className="size-3" weight="fill" />}
              Sentiment: <span className={cn("font-semibold", sentiment!.color)}>{sentiment!.label}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-muted-foreground">
              <Translate className="size-3" />
              {result.language.toUpperCase()}
            </span>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-4 text-card-foreground",
        className,
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <AiBadge />
        {!loading && !result && !error && (
          <button
            onClick={() => void fetchAnalysis()}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            <Lightning className="size-3.5" />
            Run Analysis
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2.5 py-2 text-sm text-muted-foreground">
          <Spinner className="size-4 animate-spin text-primary" />
          <span>Analyzing with fine-tuned model…</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Warning className="size-3.5 text-amber-500" weight="fill" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-3">
          {/* Urgency bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Lightning className="size-3.5 text-amber-500" weight="fill" />
                Urgency
              </span>
              <span className={cn("font-semibold", urgency!.color)}>{urgency!.label}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all duration-700", urgency!.bg)}
                style={{ width: `${Math.round(result.urgency * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[10px] text-muted-foreground">
              {Math.round(result.urgency * 100)}%
            </p>
          </div>

          {/* Sentiment bar */}
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 font-medium text-foreground">
                {sentiment && <sentiment.Icon className="size-3.5" weight="fill" />}
                Sentiment
              </span>
              <span className={cn("font-semibold", sentiment!.color)}>{sentiment!.label}</span>
            </div>
            {/* Centered sentiment scale: negative←|→positive */}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "absolute top-0 h-full rounded-full transition-all duration-700",
                  result.sentiment >= 0 ? "bg-emerald-500 left-1/2" : "bg-rose-500 right-1/2",
                )}
                style={{ width: `${Math.abs(result.sentiment) * 50}%` }}
              />
            </div>
          </div>

          {/* Language */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Translate className="size-3.5" />
            Detected language:&nbsp;
            <span className="font-semibold text-foreground uppercase">{result.language}</span>
          </div>
        </div>
      )}
    </div>
  )
}
