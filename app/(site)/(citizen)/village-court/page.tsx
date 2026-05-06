"use client"

import { useEffect, useState, useCallback } from "react"
import { Scales, MapPin, MagnifyingGlass, Plus, Calendar, CheckCircle } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Court = {
  id: string
  name: string
  upazila: string
  district: string
  division: string
  arbitrators: string[]
  _count: { cases: number }
}

type VillageCase = {
  id: string
  caseNumber: string
  disputeType: string
  claimantName: string
  respondentName: string
  description: string
  filedDate: string
  status: string
  outcome?: string
  outcomeSummary?: string
  resolvedDate?: string
  court: { name: string; upazila: string; district: string }
}

type CaseForm = {
  courtId: string
  caseNumber: string
  disputeType: string
  claimantName: string
  respondentName: string
  description: string
  filedDate: string
}

const STATUS_COLOR: Record<string, string> = {
  Filed: "bg-blue-100 text-blue-800",
  "Hearing Scheduled": "bg-yellow-100 text-yellow-800",
  "Under Mediation": "bg-purple-100 text-purple-800",
  Resolved: "bg-green-100 text-green-800",
  Dismissed: "bg-gray-100 text-gray-700",
  Appealed: "bg-orange-100 text-orange-800",
}

const DISPUTE_TYPES = [
  "Land Dispute", "Family Dispute", "Money Recovery", "Assault",
  "Property Damage", "Marriage/Divorce", "Inheritance", "Water Rights", "Other",
]

const STATUSES = ["All", "Filed", "Hearing Scheduled", "Under Mediation", "Resolved", "Dismissed", "Appealed"]

const EMPTY_FORM: CaseForm = {
  courtId: "", caseNumber: "", disputeType: DISPUTE_TYPES[0],
  claimantName: "", respondentName: "", description: "", filedDate: "",
}

export default function VillageCourtPage() {
  const [tab, setTab] = useState<"courts" | "cases" | "file">("courts")
  const [courts, setCourts] = useState<Court[]>([])
  const [cases, setCases] = useState<VillageCase[]>([])
  const [total, setTotal] = useState(0)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)
  const [form, setForm] = useState<CaseForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [filterStatus, setFilterStatus] = useState("All")
  const [filterType, setFilterType] = useState("All")
  const [search, setSearch] = useState("")

  const fetchCourts = useCallback(async () => {
    const res = await fetch("/api/village-court/courts")
    const data = await res.json()
    setCourts(data.courts ?? [])
  }, [])

  const fetchCases = useCallback(async () => {
    const params = new URLSearchParams()
    if (selectedCourt) params.set("courtId", selectedCourt.id)
    if (filterStatus !== "All") params.set("status", filterStatus)
    if (filterType !== "All") params.set("disputeType", filterType)
    if (search) params.set("q", search)
    const res = await fetch(`/api/village-court/cases?${params}`)
    const data = await res.json()
    setCases(data.cases ?? [])
    setTotal(data.total ?? 0)
  }, [selectedCourt, filterStatus, filterType, search])

  useEffect(() => { fetchCourts() }, [fetchCourts])
  useEffect(() => { if (tab === "cases") fetchCases() }, [tab, fetchCases])

  const submitCase = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/village-court/cases", {
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

  const resolvedCount = cases.filter((c) => c.status === "Resolved").length
  const pendingCount = cases.filter((c) => c.status !== "Resolved" && c.status !== "Dismissed").length

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Scales className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Village Court Tracker</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track shalish and village court cases — land disputes, family mediation, and community arbitration across Bangladesh.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active Courts</p>
          <p className="text-2xl font-bold">{courts.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Cases</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {(["courts", "cases", "file"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "courts" ? "Court Directory" : t === "cases" ? "Case Tracker" : "File a Case"}
          </button>
        ))}
      </div>

      {tab === "courts" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {courts.length === 0 ? (
            <p className="col-span-full text-center py-12 text-muted-foreground text-sm">No courts registered yet.</p>
          ) : courts.map((court) => (
            <Card
              key={court.id}
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => { setSelectedCourt(court); setTab("cases") }}
            >
              <CardContent className="p-4 space-y-2">
                <p className="font-semibold text-sm">{court.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" />
                  {court.upazila}, {court.district}
                </p>
                {(court.arbitrators as string[]).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Arbitrators: {(court.arbitrators as string[]).join(", ")}
                  </p>
                )}
                <p className="text-xs font-medium text-primary">{court._count.cases} cases registered</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {tab === "cases" && (
        <div className="space-y-4">
          {selectedCourt && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
              <Scales className="size-4 text-primary" />
              <span>Showing cases for <strong>{selectedCourt.name}</strong></span>
              <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSelectedCourt(null)}>
                Clear filter
              </button>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border pl-9 pr-3 py-1.5 text-sm"
                placeholder="Search by name or case number…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="rounded-md border px-3 py-1.5 text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="rounded-md border px-3 py-1.5 text-sm" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option>All</option>
              {DISPUTE_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setTab("file")}>
              <Plus className="size-3 mr-1" /> File Case
            </Button>
          </div>

          {cases.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No cases found.</p>
          ) : (
            <div className="space-y-3">
              {cases.map((c) => (
                <Card key={c.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{c.caseNumber}</p>
                        <p className="font-semibold text-sm">{c.claimantName} vs {c.respondentName}</p>
                        <p className="text-xs text-muted-foreground">{c.court.name} · {c.court.upazila}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${STATUS_COLOR[c.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{c.disputeType}</Badge>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Filed {new Date(c.filedDate).toLocaleDateString()}
                        </span>
                      </div>
                      {c.status === "Resolved" && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="size-3" weight="fill" />
                          {c.outcome}
                        </span>
                      )}
                    </div>
                    {c.outcomeSummary && (
                      <p className="text-xs text-muted-foreground bg-green-50 border border-green-100 rounded p-2">{c.outcomeSummary}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">{total} total cases</p>
        </div>
      )}

      {tab === "file" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Scales className="size-4" />
              File a Village Court Case
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitted && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Case filed successfully. You will be notified of hearing dates.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Village Court *</label>
                <select
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.courtId}
                  onChange={(e) => setForm((f) => ({ ...f, courtId: e.target.value }))}
                >
                  <option value="">Select court…</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.upazila}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Case Number *</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="e.g. VC-2024-001"
                  value={form.caseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Dispute Type *</label>
                <select
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.disputeType}
                  onChange={(e) => setForm((f) => ({ ...f, disputeType: e.target.value }))}
                >
                  {DISPUTE_TYPES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Filed Date *</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.filedDate}
                  onChange={(e) => setForm((f) => ({ ...f, filedDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Claimant Name *</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="Party filing the case"
                  value={form.claimantName}
                  onChange={(e) => setForm((f) => ({ ...f, claimantName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Respondent Name *</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="Party being claimed against"
                  value={form.respondentName}
                  onChange={(e) => setForm((f) => ({ ...f, respondentName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Dispute Description *</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                rows={4}
                placeholder="Describe the nature of the dispute…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <Button
              onClick={submitCase}
              disabled={submitting || !form.courtId || !form.caseNumber || !form.claimantName || !form.respondentName || !form.description || !form.filedDate}
            >
              {submitting ? "Filing…" : "File Case"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
