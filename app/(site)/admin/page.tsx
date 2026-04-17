"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashStats {
  totalConcerns: number
  resolvedConcerns: number
  totalProposals: number
  totalResearch: number
  totalProjects: number
  activeProjects: number
  totalSolutionPlans: number
  approvedPlans: number
  totalAssemblyEvents: number
  averageConcernVotes: number
  topConcerns: Array<{ rank: number; title: string; votes: number; status: string }>
}

interface ActionEntry {
  id: string
  entityType: string
  entityId: string
  action: string
  actorRole: string
  createdAt: string
}

interface ModerationItem {
  id: string
  contentType: string
  contentId: string
  reason: string
  reportedBy: string
  status: string
  createdAt: string
}

export default function AdminPage() {
  const { session } = useAuth()
  const [stats, setStats] = useState<DashStats | null>(null)
  const [actionLog, setActionLog] = useState<ActionEntry[]>([])
  const [modQueue, setModQueue] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [openDataRes, modRes] = await Promise.all([
          fetch("/api/open-data?dataset=statistics"),
          fetch("/api/moderation/queue"),
        ])
        const statsData = await openDataRes.json() as DashStats
        setStats(statsData)

        const actionRes = await fetch("/api/open-data?dataset=action-log")
        const actionData = await actionRes.json() as { data: ActionEntry[] }
        setActionLog((actionData.data ?? []).slice(0, 20))

        if (modRes.ok) {
          const modData = await modRes.json() as { queue: ModerationItem[] }
          setModQueue(modData.queue ?? [])
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const role = (session?.user as { role?: string } | undefined)?.role
  const isAdmin = role === "admin" || role === "government_authority"

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
        <p className="text-muted-foreground mb-6">You must be signed in to access the admin panel.</p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Access Restricted</h1>
        <p className="text-muted-foreground mb-6">
          The admin panel is only accessible to government authorities and admins.
          Your current role is <strong>{role ?? "citizen"}</strong>.
        </p>
        <Link href="/dashboard">
          <Button variant="outline">Go to Dashboard</Button>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  const kpis = stats
    ? [
        { label: "Total Concerns", value: stats.totalConcerns, sub: `${stats.resolvedConcerns} resolved`, color: "text-blue-500" },
        { label: "Proposals", value: stats.totalProposals, sub: "community votes", color: "text-violet-500" },
        { label: "Research Problems", value: stats.totalResearch, sub: "open for applications", color: "text-amber-500" },
        { label: "Projects", value: stats.totalProjects, sub: `${stats.activeProjects} in progress`, color: "text-green-500" },
        { label: "Solution Plans", value: stats.totalSolutionPlans, sub: `${stats.approvedPlans} approved`, color: "text-teal-500" },
        { label: "Assembly Events", value: stats.totalAssemblyEvents, sub: "scheduled meetings", color: "text-rose-500" },
      ]
    : []

  const statusColor: Record<string, string> = {
    Submitted: "bg-blue-100 text-blue-700",
    UnderReview: "bg-yellow-100 text-yellow-700",
    Resolved: "bg-green-100 text-green-700",
    Pending: "bg-orange-100 text-orange-700",
    Escalated: "bg-red-100 text-red-700",
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Admin Panel</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Platform Management</h1>
          <p className="mt-1 text-muted-foreground">
            Logged in as <span className="font-medium text-foreground">{session.user.name}</span>
            {" · "}<span className="capitalize">{role?.replace(/_/g, " ")}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/dashboard"><Button variant="outline" size="sm">Public Dashboard</Button></Link>
          <Link href="/open-data"><Button variant="outline" size="sm">Open Data</Button></Link>
        </div>
      </div>

      {/* KPI grid */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="rounded-2xl">
              <CardContent className="pt-5">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className={`mt-1 text-4xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Moderation queue */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Moderation Queue</CardTitle>
              <Badge variant="secondary">{modQueue.length} pending</Badge>
            </div>
            <CardDescription>Flagged content requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            {modQueue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Queue is clear ✓</p>
            ) : (
              <div className="space-y-3">
                {modQueue.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/60 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.contentType} · reported by {item.reportedBy}
                      </p>
                    </div>
                    <Badge className={statusColor[item.status] ?? "bg-muted text-muted-foreground"}>
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top concerns */}
        {stats && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle>Top Concerns by Votes</CardTitle>
              <CardDescription>Highest community-prioritised issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topConcerns.map((c) => (
                  <div key={c.rank} className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {c.rank}
                    </span>
                    <p className="flex-1 truncate text-sm">{c.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={statusColor[c.status] ?? "bg-muted text-muted-foreground"} variant="outline">
                        {c.status}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums">{c.votes}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent action log */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle>Recent Action Log</CardTitle>
          <CardDescription>Immutable audit trail of platform events</CardDescription>
        </CardHeader>
        <CardContent>
          {actionLog.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No actions logged yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left">
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Action</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Entity</th>
                    <th className="pb-2 pr-4 font-medium text-muted-foreground">Actor Role</th>
                    <th className="pb-2 font-medium text-muted-foreground">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {actionLog.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30">
                      <td className="py-2 pr-4 font-medium">{entry.action}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {entry.entityType} <span className="font-mono text-xs">{entry.entityId.slice(0, 8)}</span>
                      </td>
                      <td className="py-2 pr-4">
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.actorRole ?? "system"}
                        </Badge>
                      </td>
                      <td className="py-2 text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("en-BD", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/concerns", label: "Manage Concerns", desc: "Review and update status" },
          { href: "/projects", label: "Update Projects", desc: "Edit milestones and progress" },
          { href: "/assembly", label: "Schedule Events", desc: "Create assembly meetings" },
          { href: "/open-data", label: "Export Data", desc: "Download CC BY 4.0 datasets" },
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="rounded-2xl transition-all hover:border-primary/40 hover:shadow-sm cursor-pointer h-full">
              <CardContent className="pt-5">
                <p className="font-medium">{link.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{link.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
