"use client"

import { useEffect, useState } from "react"
import {
  FileText,
  Clock,
  CheckCircle,
  Warning,
  ArrowRight,
  PlusCircle,
  Buildings,
  Scales,
  MagnifyingGlass,
  X,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { toast } from "sonner"

const MINISTRIES = [
  "Ministry of Local Government, Rural Development and Co-operatives",
  "Ministry of Health and Family Welfare",
  "Ministry of Education",
  "Ministry of Environment, Forest and Climate Change",
  "Anti-Corruption Commission (ACC)",
  "Ministry of Home Affairs",
  "Ministry of Finance",
  "Ministry of Law, Justice and Parliamentary Affairs",
  "Ministry of Public Administration",
  "Ministry of Agriculture",
  "Ministry of Water Resources",
  "Ministry of Road Transport and Bridges",
]

type RtiRequest = {
  id: string
  targetMinistry: string
  informationRequested: string
  status: string
  submittedAt: string | null
  deadline: string | null
  respondedAt: string | null
  createdAt: string
}

type ScoreRow = { ministry: string; total: number; responded: number; complianceRate: number }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Draft: { label: "Draft", color: "text-muted-foreground", icon: FileText },
  Submitted: { label: "Submitted", color: "text-blue-500", icon: Clock },
  Responded: { label: "Responded", color: "text-green-500", icon: CheckCircle },
  Appealed: { label: "Appealed", color: "text-amber-500", icon: Warning },
  Resolved: { label: "Resolved", color: "text-green-600", icon: CheckCircle },
  Overdue: { label: "Overdue", color: "text-red-500", icon: Warning },
}

function StatusBadge({ status, deadline }: { status: string; deadline: string | null }) {
  const isOverdue =
    status === "Submitted" && deadline && new Date(deadline) < new Date()
  const key = isOverdue ? "Overdue" : status
  const cfg = STATUS_CONFIG[key] ?? STATUS_CONFIG.Draft
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color}`}>
      <Icon className="size-3.5" weight={key === "Resolved" || key === "Responded" ? "fill" : "regular"} />
      {cfg.label}
    </span>
  )
}

function daysLeft(deadline: string | null) {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / 86400000)
}

export default function RtiPage() {
  const { session } = useAuth()
  const [requests, setRequests] = useState<RtiRequest[]>([])
  const [scorecard, setScorecard] = useState<ScoreRow[]>([])
  const [library, setLibrary] = useState<RtiRequest[]>([])
  const [tab, setTab] = useState<"my" | "library" | "scorecard" | "new">("my")
  const [loading, setLoading] = useState(true)

  // Form state
  const [ministry, setMinistry] = useState(MINISTRIES[0])
  const [infoRequested, setInfoRequested] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [suggestion, setSuggestion] = useState<string[]>([])
  const [searchQ, setSearchQ] = useState("")

  useEffect(() => {
    const fetches: Promise<void>[] = [
      fetch("/api/rti/ministry-scorecard")
        .then((r) => r.json())
        .then((d) => setScorecard(d.scorecard ?? [])),
      fetch("/api/rti/requests?library=1")
        .then((r) => r.json())
        .then((d) => setLibrary(d.requests ?? [])),
    ]
    if (session) {
      fetches.push(
        fetch("/api/rti/requests")
          .then((r) => r.json())
          .then((d) => setRequests(d.requests ?? []))
      )
    }
    Promise.all(fetches).finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    if (searchQ.length < 3) { setSuggestion([]); return }
    const t = setTimeout(() => {
      fetch(`/api/rti/builder/suggest?q=${encodeURIComponent(searchQ)}`)
        .then((r) => r.json())
        .then((d) => {
          setSuggestion(d.suggestion?.questions ?? [])
          if (d.suggestion?.ministry) setMinistry(d.suggestion.ministry)
        })
    }, 400)
    return () => clearTimeout(t)
  }, [searchQ])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session) { toast.error("Please sign in to submit an RTI"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/rti/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetMinistry: ministry, informationRequested: infoRequested, isPublic }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      toast.success("RTI filed successfully! You have 30 days for a response.")
      setRequests((r) => [data.rti, ...r])
      setInfoRequested("")
      setTab("my")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit RTI")
    } finally {
      setSubmitting(false)
    }
  }

  const tabs = [
    { key: "my" as const, label: "My Requests", show: !!session },
    { key: "library" as const, label: "RTI Library", show: true },
    { key: "scorecard" as const, label: "Ministry Scorecard", show: true },
    { key: "new" as const, label: "File RTI", show: !!session },
  ]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <Scales className="size-3" />
            Right to Information Act, 2009
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">RTI Management Portal</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          File Right to Information requests against any Bangladeshi government ministry. Track your
          30-day legal deadline, escalate if ignored, and access public RTI responses.
        </p>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{requests.length}</p>
          <p className="text-sm text-muted-foreground">Your RTI requests</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">{library.length}</p>
          <p className="text-sm text-muted-foreground">Public RTI responses</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-2xl font-bold">
            {scorecard.length > 0
              ? Math.round(scorecard.reduce((s, r) => s + r.complianceRate, 0) / scorecard.length)
              : 0}%
          </p>
          <p className="text-sm text-muted-foreground">Avg ministry compliance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {tabs.filter((t) => t.show).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p className="py-8 text-center text-muted-foreground animate-pulse">Loading…</p>}

      {/* My Requests */}
      {!loading && tab === "my" && (
        <div>
          {requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <FileText className="mx-auto mb-3 size-10 text-muted-foreground/40" />
              <p className="font-medium">No RTI requests yet</p>
              <p className="mt-1 text-sm text-muted-foreground">File your first RTI to hold the government accountable.</p>
              <button
                onClick={() => setTab("new")}
                className={`mt-4 ${buttonVariants({ variant: "default", size: "sm" })}`}
              >
                File an RTI
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {requests.map((rti) => {
                const days = daysLeft(rti.deadline)
                return (
                  <li key={rti.id} className="rounded-xl border border-border bg-card p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={rti.status} deadline={rti.deadline} />
                          <span className="text-xs text-muted-foreground">
                            → {rti.targetMinistry}
                          </span>
                        </div>
                        <p className="mt-1.5 line-clamp-2 text-sm font-medium">{rti.informationRequested}</p>
                      </div>
                      {days !== null && rti.status === "Submitted" && (
                        <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${days <= 3 ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" : "bg-muted text-muted-foreground"}`}>
                          {days > 0 ? `${days}d left` : "Overdue"}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Filed {new Date(rti.createdAt).toLocaleDateString()}
                      {rti.deadline && ` · Deadline ${new Date(rti.deadline).toLocaleDateString()}`}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* RTI Library */}
      {!loading && tab === "library" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            Successful RTI responses shared publicly. Browse to see what information has been obtained.
          </p>
          {library.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No public RTI responses yet.</p>
          ) : (
            <ul className="space-y-3">
              {library.map((rti) => (
                <li key={rti.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Buildings className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{rti.targetMinistry}</span>
                  </div>
                  <p className="text-sm font-medium line-clamp-2">{rti.informationRequested}</p>
                  {rti.respondedAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Responded {new Date(rti.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Ministry Scorecard */}
      {!loading && tab === "scorecard" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            RTI compliance rate by ministry — publicly shaming non-compliant departments.
          </p>
          {scorecard.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ministry</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Requests</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Responded</th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecard.map((row, i) => (
                    <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm">{row.ministry}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{row.total}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{row.responded}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold ${row.complianceRate >= 70 ? "text-green-600 dark:text-green-400" : row.complianceRate >= 40 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                          {row.complianceRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* File New RTI */}
      {tab === "new" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-1 text-lg font-semibold">File a New RTI Request</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Under the RTI Act 2009, the designated officer must respond within 20 working days (≈30 calendar days).
          </p>

          {/* AI suggest search */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">What are you looking for? (AI will suggest)</label>
            <div className="relative">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="e.g. road, corruption, hospital, budget…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {suggestion.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">Suggested questions:</p>
                {suggestion.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInfoRequested(q)}
                    className="block w-full rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target Ministry / Authority</label>
              <select
                value={ministry}
                onChange={(e) => setMinistry(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {MINISTRIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Information Requested</label>
              <textarea
                value={infoRequested}
                onChange={(e) => setInfoRequested(e.target.value)}
                rows={6}
                required
                minLength={20}
                placeholder="Describe clearly what information you are requesting under the RTI Act…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">Legal basis: Right to Information Act, 2009 (Section 8)</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded border-border"
              />
              <label htmlFor="isPublic" className="text-sm text-muted-foreground">
                Make response publicly available in RTI Library (helps other citizens)
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !session}
                className={buttonVariants({ variant: "default" })}
              >
                {submitting ? "Filing…" : "File RTI Request"}
              </button>
              <button type="button" onClick={() => setTab("my")} className={buttonVariants({ variant: "outline" })}>
                Cancel
              </button>
            </div>

            {!session && (
              <p className="text-sm text-muted-foreground">
                Please{" "}
                <Link href="/login" className="text-primary hover:underline">sign in</Link>{" "}
                to file an RTI request.
              </p>
            )}
          </form>
        </div>
      )}

      {/* Legal Info */}
      <div className="mt-8 rounded-xl border border-border bg-muted/20 p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <Scales className="size-4 text-primary" />
          Your Legal Rights
        </h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" weight="fill" />
            Under the RTI Act 2009, every citizen has the right to information held by public bodies.
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" weight="fill" />
            The Designated Officer must respond within 20 working days (30 calendar days).
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" weight="fill" />
            If ignored, you can appeal to the Appellate Authority within 30 days of the deadline.
          </li>
          <li className="flex items-start gap-2">
            <Warning className="mt-0.5 size-4 shrink-0 text-amber-500" weight="fill" />
            Certain information is exempt (national security, personal privacy, Cabinet proceedings).
          </li>
        </ul>
      </div>
    </div>
  )
}
