"use client"

import { useEffect, useState } from "react"
import { Trophy, GraduationCap, CheckCircle, Star } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n/context"

type LeaderboardEntry = {
  id: string
  university: string
  solvedConcerns: number
  acceptedResearch: number
  score: number
}

const medalColor = ["text-amber-400", "text-slate-400", "text-orange-400"]

export default function LeaderboardPage() {
  const t = useT().leaderboard
  const [rows, setRows] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/leaderboard/universities")
        const data = (await response.json()) as { leaderboard: LeaderboardEntry[] }
        setRows(data.leaderboard ?? [])
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.description}</p>
      </div>

      {!loading && rows.length >= 3 && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((pos) => {
            const entry = rows[pos]
            if (!entry) return null
            const rank = pos + 1
            return (
              <Card
                key={entry.id}
                className={`rounded-2xl text-center ${rank === 1 ? "border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10" : ""}`}
              >
                <CardContent className="pt-6 pb-5">
                  <Trophy className={`mx-auto size-8 mb-2 ${medalColor[pos]}`} weight="fill" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">#{rank}</p>
                  <p className="mt-1 text-base font-bold leading-tight">{entry.university}</p>
                  <p className="mt-3 text-3xl font-bold tabular-nums text-primary">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">{t.impactScore}</p>
                  <div className="mt-3 flex justify-center gap-3 text-xs text-muted-foreground">
                    <span>{entry.solvedConcerns} {t.solved}</span>
                    <span>·</span>
                    <span>{entry.acceptedResearch} {t.research}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>{t.fullRankings}</CardTitle>
          <CardDescription>{t.allInstitutions}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">{t.noData}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/40 ${index < 3 ? "font-medium" : ""}`}
                >
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    index === 0 ? "bg-amber-100 text-amber-600" :
                    index === 1 ? "bg-slate-100 text-slate-600" :
                    index === 2 ? "bg-orange-100 text-orange-600" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{item.university}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                      <CheckCircle className="size-3.5" />
                      <span>{item.solvedConcerns}</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 text-muted-foreground">
                      <GraduationCap className="size-3.5" />
                      <span>{item.acceptedResearch}</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      <Star className="mr-1 size-3" weight="fill" />
                      {item.score}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
