"use client"

import { useEffect, useState, useCallback } from "react"
import { Brain, ArrowClockwise, Warning, TrendUp, ChartBar } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Prediction = {
  id: string
  concernId: string
  predictedDays: number
  confidenceScore: number
  impactScore: number
  riskLevel: string
  factors: {
    baseline: number
    upvoteReduction: number
    engagementReduction: number
    agePenaltyDays: number
    ageDays: number
    proposalCount: number
    commentCount: number
  }
  predictedAt: string
  concern?: {
    id: string
    title: string
    status: string
    category: string
    district?: string
    upvotes: number
  } | null
}

type RiskCount = {
  riskLevel: string
  _count: { riskLevel: number }
  _avg: { predictedDays: number; impactScore: number }
}

type Stats = {
  riskCounts: RiskCount[]
  topAtRisk: Prediction[]
  totalPredictions: number
  avgPredictedDays: number
}

const RISK_COLOR: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
}

const RISK_BAR: Record<string, string> = {
  Low: "bg-green-500",
  Medium: "bg-yellow-500",
  High: "bg-orange-500",
  Critical: "bg-red-500",
}

export default function ImpactPage() {
  const [tab, setTab] = useState<"dashboard" | "predict" | "list">("dashboard")
  const [stats, setStats] = useState<Stats | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [total, setTotal] = useState(0)
  const [filterRisk, setFilterRisk] = useState("All")
  const [concernId, setConcernId] = useState("")
  const [predResult, setPredResult] = useState<Prediction | null>(null)
  const [predConcern, setPredConcern] = useState<{ title: string; status: string } | null>(null)
  const [predicting, setPredicting] = useState(false)
  const [predError, setPredError] = useState("")

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/impact/stats")
    const data = await res.json()
    setStats(data)
  }, [])

  const fetchPredictions = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterRisk !== "All") params.set("riskLevel", filterRisk)
    const res = await fetch(`/api/impact/predictions?${params}`)
    const data = await res.json()
    setPredictions(data.predictions ?? [])
    setTotal(data.total ?? 0)
  }, [filterRisk])

  useEffect(() => { if (tab === "dashboard") fetchStats() }, [tab, fetchStats])
  useEffect(() => { if (tab === "list") fetchPredictions() }, [tab, fetchPredictions])

  const runPrediction = async () => {
    if (!concernId.trim()) return
    setPredicting(true)
    setPredError("")
    setPredResult(null)
    try {
      const res = await fetch("/api/impact/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concernId: concernId.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setPredError(data.error ?? "Failed"); return }
      setPredResult(data.prediction)
      setPredConcern(data.concern)
    } finally {
      setPredicting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Brain className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">AI Impact Predictor</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Rule-based ML scoring that predicts resolution time, impact score, and risk level for civic concerns — based on category, votes, age, and engagement.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Predictions Run</p>
            <p className="text-2xl font-bold">{stats.totalPredictions}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Avg Predicted Days</p>
            <p className="text-2xl font-bold">{stats.avgPredictedDays}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Critical Risk</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.riskCounts.find((r) => r.riskLevel === "Critical")?._count.riskLevel ?? 0}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">High Risk</p>
            <p className="text-2xl font-bold text-orange-600">
              {stats.riskCounts.find((r) => r.riskLevel === "High")?._count.riskLevel ?? 0}
            </p>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {(["dashboard", "predict", "list"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "dashboard" ? "Dashboard" : t === "predict" ? "Run Prediction" : "All Predictions"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && stats && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ChartBar className="size-4" />
                Risk Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {["Critical", "High", "Medium", "Low"].map((risk) => {
                const rc = stats.riskCounts.find((r) => r.riskLevel === risk)
                const count = rc?._count.riskLevel ?? 0
                const pct = stats.totalPredictions > 0 ? Math.round((count / stats.totalPredictions) * 100) : 0
                return (
                  <div key={risk} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${RISK_COLOR[risk]}`}>{risk}</span>
                      <span className="text-muted-foreground">{count} concerns · avg {Math.round(rc?._avg.predictedDays ?? 0)} days</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${RISK_BAR[risk]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Warning className="size-4 text-orange-500" weight="fill" />
                Top At-Risk Concerns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.topAtRisk.length === 0 ? (
                <p className="text-sm text-muted-foreground">No predictions yet. Run a prediction to populate this list.</p>
              ) : stats.topAtRisk.map((p, i) => (
                <div key={p.id} className="flex items-start justify-between gap-3 py-2 border-b last:border-0">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="text-xs font-bold text-muted-foreground shrink-0">#{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.concern?.title ?? p.concernId}</p>
                      <p className="text-xs text-muted-foreground">{p.concern?.category} · {p.concern?.district ?? "—"}</p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${RISK_COLOR[p.riskLevel]}`}>{p.riskLevel}</span>
                    <p className="text-xs text-muted-foreground">{p.predictedDays}d · score {p.impactScore}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-1">
                <TrendUp className="size-4" /> Model Factors
              </p>
              <div className="grid sm:grid-cols-2 gap-2 text-xs text-blue-800">
                <span>• Category baseline (Safety=7d, Infrastructure=21d…)</span>
                <span>• Upvote reduction: −0.3d per vote (max 50%)</span>
                <span>• Engagement reduction: −1.5d per proposal/comment</span>
                <span>• Age penalty: +0.1d per day unresolved (max 40%)</span>
                <span>• Impact score: upvotes×2 + proposals×5 + age bonus</span>
                <span>• Confidence: 0.5 base + upvote/age factors</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "predict" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="size-4" />
              Run Impact Prediction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-md border px-3 py-1.5 text-sm font-mono"
                placeholder="Concern ID (e.g. clxyz123…)"
                value={concernId}
                onChange={(e) => setConcernId(e.target.value)}
              />
              <Button onClick={runPrediction} disabled={predicting || !concernId.trim()}>
                {predicting ? <ArrowClockwise className="size-4 animate-spin" /> : "Predict"}
              </Button>
            </div>
            {predError && <p className="text-sm text-red-600">{predError}</p>}

            {predResult && predConcern && (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <p className="font-semibold text-sm">{predConcern.title}</p>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${RISK_COLOR[predResult.riskLevel]}`}>
                    {predResult.riskLevel} Risk
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold">{predResult.predictedDays}</p>
                    <p className="text-xs text-muted-foreground">days to resolve</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold">{predResult.impactScore}</p>
                    <p className="text-xs text-muted-foreground">impact score</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-2xl font-bold">{Math.round(predResult.confidenceScore * 100)}%</p>
                    <p className="text-xs text-muted-foreground">confidence</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-medium text-muted-foreground uppercase tracking-wide">Factor Breakdown</p>
                  {Object.entries(predResult.factors).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-muted-foreground">{k.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                      <span className="font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "list" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <select className="rounded-md border px-3 py-1.5 text-sm" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
              {["All", "Critical", "High", "Medium", "Low"].map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          {predictions.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No predictions found.</p>
          ) : (
            <div className="space-y-2">
              {predictions.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-sm font-medium truncate">{p.concern?.title ?? p.concernId}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.concern?.category} · {p.concern?.district ?? "—"} · {p.concern?.upvotes ?? 0} votes
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Predicted: {p.predictedDays}d · Impact: {p.impactScore} · Confidence: {Math.round(p.confidenceScore * 100)}%
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${RISK_COLOR[p.riskLevel]}`}>{p.riskLevel}</span>
                      <Badge variant="outline" className="text-xs">{p.concern?.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">{total} predictions</p>
        </div>
      )}
    </div>
  )
}
