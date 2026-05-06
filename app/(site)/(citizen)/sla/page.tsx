"use client"

import { useEffect, useState } from "react"
import {
  CheckCircle,
  Clock,
  Warning,
  ArrowUp,
  Star,
  Buildings,
  TrendUp,
  Siren,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"

type DashboardData = {
  summary: {
    total: number
    responded: number
    resolved: number
    breached: number
    responseRate: number
    resolutionRate: number
    breachRate: number
  }
  avgRating: number
  byAuthority: { authority: string | null; total: number; avgRating: number }[]
}

type Breach = {
  concernId: string
  deadline: string
  authority: string | null
  overdueHours: number
  escalationLevel: number
  concern: {
    id: string
    title: string
    category: string
    location: string | null
    district: string | null
  } | null
}

const SLA_CATEGORIES = [
  { label: "Emergency (Public Safety, Fire, Flood)", days: 1, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  { label: "Infrastructure (Potholes, Pipes, Lights)", days: 7, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { label: "Policy Proposals", days: 30, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
]

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  accent: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={`flex size-8 items-center justify-center rounded-lg ${accent}`}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          weight={s <= Math.round(value) ? "fill" : "regular"}
          className={`size-3.5 ${s <= Math.round(value) ? "text-amber-400" : "text-muted-foreground/40"}`}
        />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{value > 0 ? value.toFixed(1) : "—"}</span>
    </span>
  )
}

export default function SlaPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [breaches, setBreaches] = useState<Breach[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/sla/dashboard").then((r) => r.json()),
      fetch("/api/sla/breaches").then((r) => r.json()),
    ])
      .then(([dash, br]) => {
        setData(dash)
        setBreaches(br.breaches ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-muted-foreground animate-pulse">Loading SLA data…</p>
      </div>
    )
  }

  const summary = data?.summary

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Badge variant="secondary" className="gap-1 text-xs">
            <TrendUp className="size-3" />
            Service Level Accountability
          </Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Government Response Tracker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every civic concern has a mandatory response deadline. This dashboard holds authorities
          publicly accountable for meeting — or missing — their commitments.
        </p>
      </div>

      {/* SLA Policy */}
      <div className="mb-8 rounded-xl border border-border bg-muted/30 p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Response Time Policy
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {SLA_CATEGORIES.map((cat) => (
            <div key={cat.label} className={`rounded-lg p-3 ${cat.bg}`}>
              <p className={`text-xl font-bold ${cat.color}`}>
                {cat.days === 1 ? "24 hrs" : `${cat.days} days`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{cat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Cases"
          value={summary?.total ?? 0}
          sub="with SLA tracking"
          icon={Clock}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Resolution Rate"
          value={`${summary?.resolutionRate ?? 0}%`}
          sub={`${summary?.resolved ?? 0} resolved`}
          icon={CheckCircle}
          accent="bg-green-500/10 text-green-600"
        />
        <StatCard
          label="SLA Breaches"
          value={summary?.breached ?? 0}
          sub={`${summary?.breachRate ?? 0}% breach rate`}
          icon={Warning}
          accent="bg-red-500/10 text-red-600"
        />
        <StatCard
          label="Citizen Rating"
          value={data ? `${(data.avgRating || 0).toFixed(1)}/5` : "—"}
          sub="average satisfaction"
          icon={Star}
          accent="bg-amber-500/10 text-amber-600"
        />
      </div>

      {/* Active Breaches */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Siren className="size-5 text-red-500" weight="fill" />
            Active SLA Breaches
            {breaches.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {breaches.length} overdue
              </Badge>
            )}
          </h2>
        </div>

        {breaches.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-6 text-center">
            <CheckCircle className="mx-auto mb-2 size-8 text-green-500" weight="fill" />
            <p className="font-medium text-green-700 dark:text-green-400">No active breaches</p>
            <p className="text-sm text-green-600/70 dark:text-green-500/70">All concerns are within their response deadline.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {breaches.map((breach) => (
              <li
                key={breach.concernId}
                className="flex items-start gap-3 rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-4"
              >
                <Warning className="mt-0.5 size-5 shrink-0 text-red-500" weight="fill" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/concerns/${breach.concernId}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {breach.concern?.title ?? `Concern #${breach.concernId.slice(-6)}`}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {breach.concern?.category ?? "—"}
                    </Badge>
                    {breach.escalationLevel > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <ArrowUp className="mr-1 size-2.5" />
                        Escalated L{breach.escalationLevel}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {breach.concern?.district && `${breach.concern.district} · `}
                    Overdue by{" "}
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {breach.overdueHours}h
                    </span>
                    {breach.authority && ` · Assigned: ${breach.authority}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Authority Scorecards */}
      {data?.byAuthority && data.byAuthority.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Buildings className="size-5 text-primary" />
            Authority Performance
          </h2>
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Authority</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Cases</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Citizen Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.byAuthority.map((row, i) => (
                  <tr key={i} className="border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">{row.authority ?? "Unassigned"}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.total}</td>
                    <td className="px-4 py-3 text-right">
                      <StarRating value={row.avgRating} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center">
        <h3 className="mb-1 font-semibold">Have an unresolved concern?</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Submit a new concern and it will automatically receive an SLA deadline based on its category.
        </p>
        <Link href="/concerns/submit" className={buttonVariants({ variant: "default" })}>
          Submit a Concern
        </Link>
      </div>
    </div>
  )
}
