import {
  ChartBar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Warning,
  Flask,
  Buildings,
} from "@phosphor-icons/react/dist/ssr"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { getDashboardSnapshot, listProjects, listSolutionPlans, listAssemblyEvents } from "@/lib/sohojatra/store"

export default async function DashboardPage() {
  const [snapshot, projects, plans, events] = await Promise.all([
    getDashboardSnapshot(),
    listProjects(),
    listSolutionPlans(),
    listAssemblyEvents(),
  ])

  const concerns = snapshot.concerns
  const statusCounts = concerns.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  const approvedPlans = plans.filter((p) => p.status === "Approved").length
  const pendingPlans = plans.filter((p) => p.status === "Submitted" || p.status === "UnderReview").length
  const activeProjects = projects.filter((p) => p.status === "In Progress").length
  const completedProjects = projects.filter((p) => p.status === "Completed").length

  const extendedKpis = [
    ...snapshot.kpis,
    {
      label: "Solution plans pending",
      value: String(pendingPlans),
      detail: `${approvedPlans} approved, ${pendingPlans} awaiting government review`,
    },
    {
      label: "Active projects",
      value: `${activeProjects}/${projects.length}`,
      detail: `${completedProjects} completed, ${activeProjects} in progress`,
    },
  ]

  const statusOrder = ["Submitted", "UnderReview", "ExpertProposed", "GovtApproved", "InProgress", "Resolved", "Rated"]
  const statusLabels: Record<string, string> = {
    Submitted: "Submitted",
    UnderReview: "Under Review",
    ExpertProposed: "Expert Proposed",
    GovtApproved: "Govt Approved",
    InProgress: "In Progress",
    Resolved: "Resolved",
    Rated: "Rated",
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Governance Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Accountability metrics and moderation signals
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Public indicators for resolution speed, transparency, and current review queues.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {extendedKpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">{kpi.label}</h2>
                <ChartBar className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Concern Status Distribution */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <CheckCircle className="size-5 text-primary" />
              Concern status pipeline
            </h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusOrder.map((status) => {
                const count = statusCounts[status] ?? 0
                const total = concerns.length || 1
                const pct = Math.round((count / total) * 100)
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{statusLabels[status] ?? status}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/70 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span><MapPin className="mr-1 inline size-4" />Division to ward drill-down</span>
              <span><Clock className="mr-1 inline size-4" />Updated in real time</span>
              <span><Users className="mr-1 inline size-4" />Public-facing metrics</span>
            </div>
          </CardContent>
        </Card>

        {/* Moderation Queue */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Warning className="size-5 text-primary" />
              Moderation queue
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshot.moderation.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No items in queue.</p>
            ) : (
              snapshot.moderation.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/60 bg-muted/20 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-sm">{item.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
                    </div>
                    <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold border border-border/60">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Severity: {item.severity}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Project Tracker Summary */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Buildings className="size-5 text-primary" />
              Active projects
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {projects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No projects yet.</p>
            ) : (
              projects.slice(0, 4).map((project) => (
                <div key={project.id} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate max-w-50">{project.title}</span>
                    <span className="text-muted-foreground shrink-0 ml-2">{project.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{project.department} · Deadline {project.deadline}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Solution Plans + Assembly Summary */}
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flask className="size-5 text-primary" />
              Co-governance pipeline
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-2xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{plans.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Solution plans total</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{approvedPlans}</p>
                <p className="text-xs text-muted-foreground mt-1">Govt approved</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{events.length}</p>
                <p className="text-xs text-muted-foreground mt-1">Assembly events</p>
              </div>
              <div className="rounded-2xl bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">
                  {events.filter((e) => e.status === "Upcoming").length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Upcoming events</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              All KPIs are public-facing per accountability principle (F21)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
