"use client"

import { useEffect, useState, useCallback } from "react"
import { Waves, MapPin, Warning, Plus, MagnifyingGlass, Drop, Boat } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Island = {
  id: string
  name: string
  district: string
  division: string
  population: number
  floodRisk: string
  isSeasonallyIsolated: boolean
  boatHoursToUpazila: number | null
  hasElectricity: boolean
  hasMobileNetwork: boolean
  _count: { concerns: number }
}

type Concern = {
  id: string
  title: string
  description: string
  category: string
  severity: string
  reporterName: string
  status: string
  createdAt: string
  char: { name: string; district: string; floodRisk: string }
}

type ReportForm = {
  charId: string
  title: string
  description: string
  category: string
  severity: string
  reporterName: string
}

const SEVERITY_COLOR: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
}

const FLOOD_COLOR: Record<string, string> = {
  Low: "text-green-600",
  Medium: "text-yellow-600",
  High: "text-orange-600",
  Extreme: "text-red-600",
}

const CATEGORIES = [
  "River Erosion", "Seasonal Flooding", "Boat Access", "Healthcare Access",
  "Education Access", "Food Security", "Drinking Water", "Electricity",
  "Mobile Connectivity", "Embankment Damage",
]

const EMPTY_FORM: ReportForm = {
  charId: "", title: "", description: "", category: CATEGORIES[0], severity: "Medium", reporterName: "",
}

export default function CharPage() {
  const [tab, setTab] = useState<"map" | "concerns" | "report">("map")
  const [islands, setIslands] = useState<Island[]>([])
  const [concerns, setConcerns] = useState<Concern[]>([])
  const [total, setTotal] = useState(0)
  const [selectedIsland, setSelectedIsland] = useState<Island | null>(null)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState("All")
  const [filterCategory, setFilterCategory] = useState("All")
  const [search, setSearch] = useState("")

  const fetchIslands = useCallback(async () => {
    const res = await fetch("/api/char/islands")
    const data = await res.json()
    setIslands(data.islands ?? [])
  }, [])

  const fetchConcerns = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedIsland) params.set("charId", selectedIsland.id)
    if (filterSeverity !== "All") params.set("severity", filterSeverity)
    if (filterCategory !== "All") params.set("category", filterCategory)
    const res = await fetch(`/api/char/concerns?${params}`)
    const data = await res.json()
    setConcerns(data.concerns ?? [])
    setTotal(data.total ?? 0)
  }, [selectedIsland, filterSeverity, filterCategory])

  useEffect(() => { fetchIslands() }, [fetchIslands])
  useEffect(() => { if (tab === "concerns") fetchConcerns() }, [tab, fetchConcerns])

  const submitReport = async () => {
    if (!form.charId || !form.title || !form.description) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/char/concerns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSubmitted(true)
        setForm(EMPTY_FORM)
        setTimeout(() => setSubmitted(false), 3000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const filteredIslands = islands.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.district.toLowerCase().includes(search.toLowerCase())
  )

  const criticalCount = concerns.filter((c) => c.severity === "Critical").length
  const highCount = concerns.filter((c) => c.severity === "High").length
  const isolatedCount = islands.filter((i) => i.isSeasonallyIsolated).length

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Waves className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Char Citizen Module</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Reporting and tracking for Bangladesh's river island (char) communities — voices from the most vulnerable geographies.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Char Islands</p>
          <p className="text-2xl font-bold">{islands.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Seasonally Isolated</p>
          <p className="text-2xl font-bold text-orange-600">{isolatedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Critical Issues</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">High Severity</p>
          <p className="text-2xl font-bold text-orange-600">{highCount}</p>
        </Card>
      </div>

      <div className="flex gap-2 border-b pb-1">
        {(["map", "concerns", "report"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "map" ? "Island Directory" : t === "concerns" ? "Concerns" : "Report Issue"}
          </button>
        ))}
      </div>

      {tab === "map" && (
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              className="w-full rounded-md border pl-9 pr-3 py-1.5 text-sm"
              placeholder="Search by char name or district…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredIslands.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No char islands registered yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredIslands.map((island) => (
                <Card
                  key={island.id}
                  className={`cursor-pointer transition-colors hover:border-primary/50 ${selectedIsland?.id === island.id ? "border-primary" : ""}`}
                  onClick={() => { setSelectedIsland(island); setTab("concerns") }}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm">{island.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="size-3" />
                          {island.district}, {island.division}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${FLOOD_COLOR[island.floodRisk] ?? "text-gray-600"}`}>
                        {island.floodRisk} Flood Risk
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {island.isSeasonallyIsolated && (
                        <Badge variant="destructive" className="text-xs">Seasonally Isolated</Badge>
                      )}
                      {!island.hasElectricity && (
                        <Badge variant="outline" className="text-xs">No Electricity</Badge>
                      )}
                      {!island.hasMobileNetwork && (
                        <Badge variant="outline" className="text-xs">No Mobile Network</Badge>
                      )}
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground pt-1">
                      <span>Pop: {island.population.toLocaleString()}</span>
                      {island.boatHoursToUpazila != null && (
                        <span className="flex items-center gap-1">
                          <Boat className="size-3" />
                          {island.boatHoursToUpazila}h to upazila
                        </span>
                      )}
                      <span className="text-orange-600">{island._count.concerns} reports</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "concerns" && (
        <div className="space-y-4">
          {selectedIsland && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
              <Waves className="size-4 text-primary" />
              <span>Showing concerns for <strong>{selectedIsland.name}</strong></span>
              <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedIsland(null)}>
                Clear filter
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              {["All", "Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option>All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setTab("report")}>
              <Plus className="size-3 mr-1" /> Report Issue
            </Button>
          </div>

          {concerns.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No concerns found. Be the first to report.</p>
          ) : (
            <div className="space-y-3">
              {concerns.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{c.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.char.name} · {c.char.district}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${SEVERITY_COLOR[c.severity] ?? ""}`}>
                        {c.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{c.category}</Badge>
                      <span>by {c.reporterName} · {new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">{total} total concerns</p>
        </div>
      )}

      {tab === "report" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Warning className="size-4 text-orange-500" weight="fill" />
              Report a Char Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitted && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Report submitted. Thank you for voicing this concern.
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium">Char Island *</label>
              <select
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.charId}
                onChange={(e) => setForm((f) => ({ ...f, charId: e.target.value }))}
              >
                <option value="">Select char island…</option>
                {islands.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} — {i.district}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Category *</label>
              <select
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Severity *</label>
              <select
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {["Low", "Medium", "High", "Critical"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Title *</label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="e.g., River erosion threatening 30 homes"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description *</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                rows={4}
                placeholder="Describe the issue in detail…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Your Name (optional if logged in)</label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="Name or leave blank for anonymous"
                value={form.reporterName}
                onChange={(e) => setForm((f) => ({ ...f, reporterName: e.target.value }))}
              />
            </div>
            <Button
              onClick={submitReport}
              disabled={submitting || !form.charId || !form.title || !form.description}
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
