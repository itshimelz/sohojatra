"use client"

import { useEffect, useState, useCallback } from "react"
import { TShirt, Warning, Shield, MagnifyingGlass, BookOpen, Star } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Factory = {
  id: string
  factoryCode: string
  name: string
  zone: string
  district: string
  complianceScore: number
  workerCount: number
  buyerBrands: string[]
  certifications: string[]
  _count: { reports: number }
}

type Report = {
  id: string
  factoryCode?: string
  issueType: string
  severity: string
  description: string
  status: string
  createdAt: string
  factory?: { name: string; zone: string } | null
}

type ReportForm = {
  factoryCode: string
  issueType: string
  severity: string
  description: string
  incidentDate: string
  isAnonymous: boolean
}

const SEVERITY_COLOR: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
}

const ISSUE_TYPES = [
  "Wage Theft", "Unpaid Overtime", "Physical Abuse", "Verbal Abuse",
  "Fire Safety Violation", "Structural Hazard", "Forced Overtime",
  "Maternity Rights Violation", "Child Labour", "Discrimination",
  "Illegal Deduction", "Denied Leave", "Other",
]

const LABOR_RIGHTS = [
  { title: "Minimum Wage", detail: "Garment workers are entitled to the government-set minimum wage. Currently Tk 12,500/month for Grade 7 (unskilled)." },
  { title: "Working Hours", detail: "Maximum 8 hours/day, 48 hours/week. Overtime capped at 2 hours/day and must be voluntary with 2× pay." },
  { title: "Maternity Leave", detail: "16 weeks fully paid maternity leave under the Bangladesh Labour Act 2006 (Section 46)." },
  { title: "Safety Rights", detail: "Workers have the right to refuse dangerous work without penalty under BLA Section 78. Fire exits must be unobstructed." },
  { title: "Freedom of Association", detail: "Right to form or join trade unions under BLA Section 176. Retaliation for union activity is illegal." },
  { title: "Termination Rules", detail: "Minimum 60 days notice or 60 days wages in lieu. Termination without cause is an unfair labour practice." },
  { title: "Leave Entitlements", detail: "11 days casual leave, 14 days sick leave, and earned leave of 1 day per 18 days worked annually." },
  { title: "Child Labour", detail: "No worker under 14. Workers aged 14–18 may only do light work for maximum 5 hours/day." },
]

const EMPTY_FORM: ReportForm = {
  factoryCode: "", issueType: ISSUE_TYPES[0], severity: "Medium",
  description: "", incidentDate: "", isAnonymous: true,
}

function complianceColor(score: number) {
  if (score >= 70) return "text-green-600"
  if (score >= 40) return "text-yellow-600"
  return "text-red-600"
}

export default function GarmentPage() {
  const [tab, setTab] = useState<"factories" | "reports" | "report" | "rights">("factories")
  const [factories, setFactories] = useState<Factory[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [total, setTotal] = useState(0)
  const [form, setForm] = useState<ReportForm>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [search, setSearch] = useState("")
  const [filterIssue, setFilterIssue] = useState("All")
  const [filterSeverity, setFilterSeverity] = useState("All")

  const fetchFactories = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    const res = await fetch(`/api/garment/factories?${params}`)
    const data = await res.json()
    setFactories(data.factories ?? [])
  }, [search])

  const fetchReports = useCallback(async () => {
    const params = new URLSearchParams()
    if (filterIssue !== "All") params.set("issueType", filterIssue)
    if (filterSeverity !== "All") params.set("severity", filterSeverity)
    const res = await fetch(`/api/garment/reports?${params}`)
    const data = await res.json()
    setReports(data.reports ?? [])
    setTotal(data.total ?? 0)
  }, [filterIssue, filterSeverity])

  useEffect(() => { if (tab === "factories") fetchFactories() }, [tab, fetchFactories])
  useEffect(() => { if (tab === "reports") fetchReports() }, [tab, fetchReports])

  const submitReport = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/garment/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, incidentDate: form.incidentDate || undefined }),
      })
      if (res.ok) {
        setSubmitted(true)
        setForm(EMPTY_FORM)
        setTimeout(() => setSubmitted(false), 4000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const criticalCount = reports.filter((r) => r.severity === "Critical").length
  const lowComplianceCount = factories.filter((f) => f.complianceScore < 40).length

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <TShirt className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Garment Worker Portal</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Anonymous reporting for Bangladesh's 4 million+ RMG workers. Know your rights, report violations, track factory compliance.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Registered Factories</p>
          <p className="text-2xl font-bold">{factories.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Low Compliance</p>
          <p className="text-2xl font-bold text-red-600">{lowComplianceCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Reports</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Critical Reports</p>
          <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {(["factories", "reports", "report", "rights"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "factories" ? "Factory Directory" : t === "reports" ? "Violation Reports" : t === "report" ? "Report Now" : "Know Your Rights"}
          </button>
        ))}
      </div>

      {tab === "factories" && (
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              className="w-full rounded-md border pl-9 pr-3 py-1.5 text-sm"
              placeholder="Search by factory name or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {factories.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No factories registered yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {factories.map((f) => (
                <Card key={f.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">{f.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{f.factoryCode}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${complianceColor(f.complianceScore)}`}>
                          {f.complianceScore.toFixed(0)}
                        </p>
                        <p className="text-xs text-muted-foreground">compliance</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.zone} Zone · {f.district}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{f.workerCount.toLocaleString()} workers</span>
                      <span className="text-orange-600">{f._count.reports} reports</span>
                    </div>
                    {(f.buyerBrands as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(f.buyerBrands as string[]).slice(0, 3).map((b) => (
                          <Badge key={b} variant="outline" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    )}
                    {(f.certifications as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(f.certifications as string[]).map((c) => (
                          <span key={c} className="flex items-center gap-1 text-xs text-green-700">
                            <Star className="size-3" weight="fill" /> {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={filterIssue}
              onChange={(e) => setFilterIssue(e.target.value)}
            >
              <option>All</option>
              {ISSUE_TYPES.map((i) => <option key={i}>{i}</option>)}
            </select>
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              {["All", "Critical", "High", "Medium", "Low"].map((s) => <option key={s}>{s}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => setTab("report")}>
              + Report Violation
            </Button>
          </div>
          {reports.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No reports found.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm">{r.issueType}</p>
                        {r.factory && (
                          <p className="text-xs text-muted-foreground">{r.factory.name} · {r.factory.zone} Zone</p>
                        )}
                        {!r.factory && r.factoryCode && (
                          <p className="text-xs text-muted-foreground font-mono">Code: {r.factoryCode}</p>
                        )}
                      </div>
                      <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${SEVERITY_COLOR[r.severity] ?? ""}`}>
                        {r.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{r.description}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">{r.status}</Badge>
                      <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground text-center">{total} total reports</p>
        </div>
      )}

      {tab === "report" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Warning className="size-4 text-orange-500" weight="fill" />
              Report a Labour Rights Violation
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              All reports are anonymous by default. Your identity is never shared.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {submitted && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Report submitted. This will be reviewed by labour rights monitors.
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Factory Code (optional)</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  placeholder="e.g. BGD-1234"
                  value={form.factoryCode}
                  onChange={(e) => setForm((f) => ({ ...f, factoryCode: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Incident Date (optional)</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.incidentDate}
                  onChange={(e) => setForm((f) => ({ ...f, incidentDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-medium">Issue Type *</label>
                <select
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.issueType}
                  onChange={(e) => setForm((f) => ({ ...f, issueType: e.target.value }))}
                >
                  {ISSUE_TYPES.map((i) => <option key={i}>{i}</option>)}
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
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Description *</label>
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                rows={5}
                placeholder="Describe the violation in detail. Include dates, witnesses, and any attempts to resolve it internally…"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm((f) => ({ ...f, isAnonymous: e.target.checked }))}
              />
              Submit anonymously (recommended)
            </label>
            <Button onClick={submitReport} disabled={submitting || !form.issueType || !form.description}>
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "rights" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Shield className="size-5 text-blue-600 shrink-0" weight="fill" />
            <p className="text-sm text-blue-900">
              These rights are guaranteed under the <strong>Bangladesh Labour Act 2006</strong> and its 2013 amendment. Violations can be reported to the <strong>Department of Inspection for Factories and Establishments (DIFE)</strong>.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {LABOR_RIGHTS.map((r) => (
              <Card key={r.title}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-primary shrink-0" />
                    <p className="font-semibold text-sm">{r.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <p className="text-sm font-semibold text-orange-900 mb-1">Emergency Contacts</p>
              <div className="space-y-1 text-xs text-orange-800">
                <p>DIFE Hotline: <strong>16357</strong></p>
                <p>Bangladesh Labour Court: File a case at nearest district labour court</p>
                <p>BGMEA Worker Helpline: <strong>01713-006027</strong></p>
                <p>Ain o Salish Kendra (Legal Aid): <strong>02-9345071</strong></p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
