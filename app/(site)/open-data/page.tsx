"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"

interface OpenDataset {
  count: number
  data: Array<Record<string, unknown>>
}

interface DataStats {
  totalConcerns: number
  totalProposals: number
  totalResearch: number
  totalAwards: number
  averageConcernVotes: number
  topConcerns: Array<{ rank: number; title: string; votes: number }>
}

export default function OpenDataPortalPage() {
  const t = useT().openData
  const [stats, setStats] = useState<DataStats | null>(null)
  const [datasets, setDatasets] = useState<Record<string, OpenDataset>>({})
  const [activeTab, setActiveTab] = useState<"stats" | "concerns" | "proposals" | "research" | "awards">("stats")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/open-data")
        const data = await res.json()
        setStats(data.datasets.statistics)
        setDatasets({
          concerns: data.datasets.concerns,
          proposals: data.datasets.proposals,
          research: data.datasets.researchProblems,
          awards: data.datasets.awards,
        })
      } catch (error) {
        console.error("Failed to load open data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const downloadDataset = (datasetName: string) => {
    const dataStr = JSON.stringify(datasets[datasetName], null, 2)
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(dataStr))
    element.setAttribute("download", `${datasetName}-${new Date().toISOString().split("T")[0]}.json`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const tabs: { key: typeof activeTab; label: string }[] = [
    { key: "stats",     label: t.tabStats },
    { key: "concerns",  label: t.tabConcerns },
    { key: "proposals", label: t.tabProposals },
    { key: "research",  label: t.tabResearch },
    { key: "awards",    label: t.tabAwards },
  ]

  const kpiCards = stats ? [
    { label: t.totalConcerns,    value: stats.totalConcerns },
    { label: t.totalProposals,   value: stats.totalProposals },
    { label: t.researchProblems, value: stats.totalResearch },
    { label: t.totalAwards,      value: stats.totalAwards },
  ] : []

  if (loading) {
    return <div className="text-center py-12">{t.loading}</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="mt-1 text-muted-foreground">{t.description}</p>
      </div>

      {/* Tabs */}
      <div className="relative">
        <div
          className="flex gap-1 border-b overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`snap-start shrink-0 whitespace-nowrap rounded-t-lg px-5 py-2.5 text-sm font-medium transition-colors ${
                activeTab === key
                  ? "border-b-2 border-primary text-primary bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
              style={{ minWidth: "6rem" }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent sm:hidden" />
      </div>

      {/* Statistics View */}
      {activeTab === "stats" && stats && (
        <Card>
          <CardHeader>
            <CardTitle>{t.platformStats}</CardTitle>
            <CardDescription>{t.platformStatsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {kpiCards.map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border/60 p-4">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1 text-3xl font-bold tabular-nums">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border/60 p-4">
              <p className="text-sm text-muted-foreground">{t.avgConcernVotes}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{stats.averageConcernVotes}</p>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">{t.topConcerns}</h3>
              <div className="space-y-2">
                {stats.topConcerns.map((concern) => (
                  <div key={concern.rank} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="text-lg font-bold">#{concern.rank}</Badge>
                      <span className="text-sm">{concern.title}</span>
                    </div>
                    <span className="font-semibold text-emerald-500">{concern.votes} {t.votes}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Views */}
      {activeTab !== "stats" && datasets[activeTab] && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{tabs.find((tab) => tab.key === activeTab)?.label}</CardTitle>
              <CardDescription>{datasets[activeTab].count} {t.records}</CardDescription>
            </div>
            <Button onClick={() => downloadDataset(activeTab)}>{t.downloadJson}</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    {Object.keys(datasets[activeTab].data[0] ?? {})
                      .slice(0, 4)
                      .map((key) => (
                        <th key={key} className="text-left py-2 px-2 font-medium">{key}</th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets[activeTab].data.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-muted/30">
                      {Object.values(item)
                        .slice(0, 4)
                        .map((val, vidx) => (
                          <td key={vidx} className="py-2 px-2 text-muted-foreground">
                            {typeof val === "object" ? JSON.stringify(val) : String(val).slice(0, 40)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {datasets[activeTab].data.length > 10 && (
              <p className="text-muted-foreground text-sm mt-3">
                {t.showingRecords.replace("{count}", String(datasets[activeTab].count))}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>{t.apiDocs}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">{t.endpoints}</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><code className="bg-muted px-2 py-1 rounded text-xs">/api/open-data</code> — {t.fullDataset}</li>
              <li><code className="bg-muted px-2 py-1 rounded text-xs">/api/open-data?dataset=concerns</code> — {t.tabConcerns}</li>
              <li><code className="bg-muted px-2 py-1 rounded text-xs">/api/open-data?dataset=proposals</code> — {t.tabProposals}</li>
              <li><code className="bg-muted px-2 py-1 rounded text-xs">/api/open-data?dataset=research</code> — {t.tabResearch}</li>
              <li><code className="bg-muted px-2 py-1 rounded text-xs">/api/open-data?dataset=awards</code> — {t.tabAwards}</li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">{t.license}</p>
            <p className="text-muted-foreground">{t.licenseText}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
