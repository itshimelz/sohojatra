"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Gavel,
  Warning,
  Buildings,
  MagnifyingGlass,
  ArrowUpRight,
  SealWarning,
  CheckCircle,
  ChartBar,
  Funnel,
} from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Tender {
  id: string
  title: string
  ministry: string
  department?: string
  contractorName?: string
  estimatedValueBdt: string
  awardedValueBdt?: string
  category: string
  district?: string
  status: string
  publishedAt: string
  deadlineAt?: string
  awardedAt?: string
  sourceUrl?: string
  redFlagScore: number
  redFlags: string[]
}

interface Contractor {
  id: string
  name: string
  totalContracts: number
  totalValueBdt: string
  flagCount: number
  averageScore: number
}

interface RedFlagData {
  highRisk: Tender[]
  ministryRisk: { ministry: string; count: number; avgScore: number }[]
  flagTypeCounts: Record<string, number>
}

type Tab = "tenders" | "contractors" | "red-flags"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBDT(value: string | number) {
  const n = typeof value === "string" ? parseInt(value) : value
  if (isNaN(n)) return "৳0"
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)} Lac`
  return `৳${n.toLocaleString()}`
}

const FLAG_LABELS: Record<string, string> = {
  no_contractor: "No Contractor Listed",
  price_inflation_30pct: "Price Inflation >30%",
  price_inflation_15pct: "Price Inflation >15%",
  short_bidding_window: "Short Bidding Window (<7 days)",
}

function riskColor(score: number) {
  if (score >= 50) return "bg-red-500/10 text-red-600 border-red-200"
  if (score >= 25) return "bg-orange-500/10 text-orange-600 border-orange-200"
  return "bg-green-500/10 text-green-600 border-green-200"
}

function riskLabel(score: number) {
  if (score >= 50) return "High Risk"
  if (score >= 25) return "Medium Risk"
  return "Low Risk"
}

function statusColor(status: string) {
  switch (status) {
    case "Open": return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "Awarded": return "bg-green-500/10 text-green-600 border-green-200"
    case "Cancelled": return "bg-muted text-muted-foreground"
    default: return "bg-muted text-muted-foreground"
  }
}

// ─── TenderCard ───────────────────────────────────────────────────────────────

function TenderCard({ tender }: { tender: Tender }) {
  const flags = Array.isArray(tender.redFlags) ? tender.redFlags : []
  const inflation =
    tender.awardedValueBdt && tender.estimatedValueBdt
      ? Math.round(
          ((parseInt(tender.awardedValueBdt) - parseInt(tender.estimatedValueBdt)) /
            parseInt(tender.estimatedValueBdt)) *
            100
        )
      : null

  return (
    <Card className={tender.redFlagScore >= 25 ? "border-orange-200" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge variant="outline" className={`text-xs ${statusColor(tender.status)}`}>
                {tender.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{tender.category}</Badge>
              {tender.redFlagScore > 0 && (
                <Badge variant="outline" className={`text-xs ${riskColor(tender.redFlagScore)}`}>
                  {riskLabel(tender.redFlagScore)}
                </Badge>
              )}
            </div>
            <h3 className="font-medium text-sm leading-snug line-clamp-2">{tender.title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{tender.ministry}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-bold text-sm text-primary">{formatBDT(tender.estimatedValueBdt)}</p>
            <p className="text-xs text-muted-foreground">Estimated</p>
            {tender.awardedValueBdt && (
              <>
                <p className="font-semibold text-sm mt-0.5">{formatBDT(tender.awardedValueBdt)}</p>
                <p className={`text-xs ${inflation && inflation > 15 ? "text-red-600" : "text-muted-foreground"}`}>
                  Awarded{inflation !== null ? ` (${inflation > 0 ? "+" : ""}${inflation}%)` : ""}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3">
          {tender.contractorName ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Buildings className="size-3" /> {tender.contractorName}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-orange-600">
              <Warning className="size-3" /> No contractor listed
            </span>
          )}
          {tender.district && (
            <span className="text-xs text-muted-foreground">· {tender.district}</span>
          )}
          {tender.sourceUrl && (
            <a
              href={tender.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Source <ArrowUpRight className="size-3" />
            </a>
          )}
        </div>

        {flags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {flags.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-1 rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-600"
              >
                <SealWarning className="size-3" />
                {FLAG_LABELS[f] ?? f}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const t = useT()

  const [tab, setTab] = useState<Tab>("tenders")
  const [tenders, setTenders] = useState<Tender[]>([])
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [redFlagData, setRedFlagData] = useState<RedFlagData | null>(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterFlagged, setFilterFlagged] = useState(false)
  const [filterMinistry, setFilterMinistry] = useState("")
  const [totalTenders, setTotalTenders] = useState(0)

  const fetchTenders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFlagged) params.set("flagged", "true")
      if (filterMinistry) params.set("ministry", filterMinistry)
      const r = await fetch(`/api/procurement/tenders?${params}`)
      const data = await r.json()
      setTenders(data.tenders ?? [])
      setTotalTenders(data.total ?? 0)
    } finally {
      setLoading(false)
    }
  }, [filterFlagged, filterMinistry])

  const fetchContractors = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/procurement/contractors?sortBy=flagCount")
      const data = await r.json()
      setContractors(data.contractors ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRedFlags = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/procurement/red-flags")
      const data = await r.json()
      setRedFlagData(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "tenders") fetchTenders()
    else if (tab === "contractors") fetchContractors()
    else if (tab === "red-flags") fetchRedFlags()
  }, [tab, fetchTenders, fetchContractors, fetchRedFlags])

  const filteredTenders = tenders.filter((t) =>
    search
      ? t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.ministry.toLowerCase().includes(search.toLowerCase()) ||
        (t.contractorName ?? "").toLowerCase().includes(search.toLowerCase())
      : true
  )

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "tenders", label: "Tender Feed", icon: <Gavel className="size-4" /> },
    { key: "contractors", label: "Contractor Profiles", icon: <Buildings className="size-4" /> },
    { key: "red-flags", label: "Red Flag Report", icon: <SealWarning className="size-4" /> },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gavel className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.nav.procurement}</h1>
            <p className="text-sm text-muted-foreground">{t.nav.procurementDesc}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === tb.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tenders tab */}
      {tab === "tenders" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search tenders, ministries, contractors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              onClick={() => setFilterFlagged((v) => !v)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                filterFlagged
                  ? "border-red-200 bg-red-500/10 text-red-600"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              <Funnel className="size-4" />
              Flagged Only
            </button>
            <p className="text-sm text-muted-foreground ml-auto">{totalTenders} tenders</p>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Gavel className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No tenders found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Procurement data will appear here as it is published
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenders.map((t) => (
                <TenderCard key={t.id} tender={t} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contractors tab */}
      {tab === "contractors" && (
        <div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : contractors.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Buildings className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No contractors registered yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contractors.map((c) => (
                <Card key={c.id} className={c.flagCount > 0 ? "border-orange-200" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-snug">{c.name}</p>
                      </div>
                      {c.flagCount > 0 && (
                        <Badge variant="outline" className="shrink-0 text-xs bg-red-500/10 text-red-600 border-red-200">
                          {c.flagCount} flags
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="font-semibold text-sm">{c.totalContracts}</p>
                        <p className="text-xs text-muted-foreground">Contracts</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="font-semibold text-sm">{formatBDT(c.totalValueBdt)}</p>
                        <p className="text-xs text-muted-foreground">Total Value</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Red flags tab */}
      {tab === "red-flags" && (
        <div>
          {loading || !redFlagData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                      <SealWarning className="size-4" />
                    </span>
                    <div>
                      <p className="text-lg font-bold">{redFlagData.highRisk.length}</p>
                      <p className="text-xs text-muted-foreground">High-risk tenders</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                      <Buildings className="size-4" />
                    </span>
                    <div>
                      <p className="text-lg font-bold">{redFlagData.ministryRisk.length}</p>
                      <p className="text-xs text-muted-foreground">Ministries with flags</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ChartBar className="size-4" />
                    </span>
                    <div>
                      <p className="text-lg font-bold">
                        {Object.values(redFlagData.flagTypeCounts).reduce((s, v) => s + v, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Total flag incidents</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Flag type breakdown */}
              {Object.keys(redFlagData.flagTypeCounts).length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-4">Flag Type Breakdown</h3>
                    <div className="space-y-3">
                      {Object.entries(redFlagData.flagTypeCounts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([flag, count]) => {
                          const total = Object.values(redFlagData.flagTypeCounts).reduce((s, v) => s + v, 0)
                          const pct = Math.round((count / total) * 100)
                          return (
                            <div key={flag}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm">{FLAG_LABELS[flag] ?? flag}</span>
                                <span className="text-sm font-medium">{count} ({pct}%)</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-red-500/70"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ministry risk table */}
              {redFlagData.ministryRisk.length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-4">Ministry Risk Scores</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 text-xs font-medium text-muted-foreground">Ministry</th>
                            <th className="text-right py-2 pr-4 text-xs font-medium text-muted-foreground">Flagged Tenders</th>
                            <th className="text-right py-2 text-xs font-medium text-muted-foreground">Avg Risk Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redFlagData.ministryRisk.map((row) => (
                            <tr key={row.ministry} className="border-b border-border/50">
                              <td className="py-2 pr-4 font-medium">{row.ministry}</td>
                              <td className="py-2 pr-4 text-right text-muted-foreground">{row.count}</td>
                              <td className="py-2 text-right">
                                <span className={`font-semibold ${row.avgScore >= 50 ? "text-red-600" : row.avgScore >= 25 ? "text-orange-600" : "text-green-600"}`}>
                                  {row.avgScore}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* High-risk tenders list */}
              <h3 className="font-semibold text-sm mb-3">High-Risk Tenders</h3>
              {redFlagData.highRisk.length === 0 ? (
                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-500/10 p-4 text-green-700">
                  <CheckCircle className="size-5 shrink-0" />
                  <p className="text-sm">No high-risk tenders detected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {redFlagData.highRisk.map((t) => (
                    <TenderCard key={t.id} tender={t} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
