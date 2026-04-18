"use client"

import { useEffect, useMemo, useState } from "react"
import { ChartBar, Clock, Buildings, Star, ArrowRight } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProjectMilestone {
  id: string
  title: string
  dueDate: string
  status: "Pending" | "In Progress" | "Verified"
}

interface ProjectDeliverable {
  id: string
  title: string
  ministry: string
  department?: string
  status: "Planning" | "In Progress" | "On Hold" | "Completed"
  progress: number
  deadline: string
  owner: string
  budgetAllocatedBdt?: number
  budgetSpentBdt?: number
  milestones: ProjectMilestone[]
  followers?: string[]
}

const statusStyles: Record<string, string> = {
  Planning: "bg-blue-100 text-blue-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "On Hold": "bg-orange-100 text-orange-700",
  Completed: "bg-green-100 text-green-700",
}

const progressBarColor: Record<string, string> = {
  Planning: "bg-blue-400",
  "In Progress": "bg-amber-400",
  "On Hold": "bg-orange-400",
  Completed: "bg-green-500",
}

export default function ProjectTrackerPage() {
  const [projects, setProjects] = useState<ProjectDeliverable[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "Planning" | "In Progress" | "On Hold" | "Completed">("all")

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "anonymous"
    const existing = window.localStorage.getItem("sohojatra_user_id")
    if (existing) return existing
    const next = `citizen-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem("sohojatra_user_id", next)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" })
        const data = (await res.json()) as { projects?: ProjectDeliverable[] }
        if (!cancelled) setProjects(Array.isArray(data.projects) ? data.projects : [])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const toggleFollow = async (projectId: string) => {
    const res = await fetch(`/api/projects/${projectId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggleFollow", followerId: userId }),
    })
    if (!res.ok) return
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        const followers = p.followers ?? []
        return {
          ...p,
          followers: followers.includes(userId)
            ? followers.filter((f) => f !== userId)
            : [...followers, userId],
        }
      })
    )
  }

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter)

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "In Progress").length,
    completed: projects.filter((p) => p.status === "Completed").length,
    avgProgress: projects.length > 0
      ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
      : 0,
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Government</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Project Tracker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Monitor ongoing civic infrastructure projects — budgets, milestones, and real-time
          progress across all government departments.
        </p>
      </div>

      {/* KPI row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Projects", value: stats.total, Icon: ChartBar },
          { label: "Active", value: stats.active, Icon: Clock },
          { label: "Completed", value: stats.completed, Icon: Buildings },
          { label: "Avg Progress", value: `${stats.avgProgress}%`, Icon: ArrowRight },
        ].map((s) => (
          <Card key={s.label} className="rounded-2xl">
            <CardContent className="flex items-center gap-3 pt-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.Icon className="size-4" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", "Planning", "In Progress", "On Hold", "Completed"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {key === "all" ? "All" : key}
          </button>
        ))}
      </div>

      {/* Projects grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No projects found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((project) => {
            const isFollowing = (project.followers ?? []).includes(userId)
            const verifiedMilestones = project.milestones?.filter((m) => m.status === "Verified").length ?? 0
            const totalMilestones = project.milestones?.length ?? 0
            return (
              <Card key={project.id} className="flex flex-col rounded-2xl transition-all hover:border-primary/30 hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={statusStyles[project.status]}>{project.status}</Badge>
                    <button
                      onClick={() => void toggleFollow(project.id)}
                      className={`flex size-8 items-center justify-center rounded-full transition-colors ${
                        isFollowing ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
                      }`}
                      title={isFollowing ? "Unfollow" : "Follow project"}
                    >
                      <Star className="size-4" weight={isFollowing ? "fill" : "regular"} />
                    </button>
                  </div>
                  <CardTitle className="text-base leading-snug">{project.title}</CardTitle>
                  <CardDescription>{project.ministry}{project.department ? ` · ${project.department}` : ""}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  {/* Progress bar */}
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${progressBarColor[project.status]}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Owner</p>
                      <p className="font-medium">{project.owner}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="font-medium">{project.deadline}</p>
                    </div>
                    {typeof project.budgetAllocatedBdt === "number" && (
                      <>
                        <div>
                          <p className="text-xs text-muted-foreground">Allocated</p>
                          <p className="font-medium">৳ {project.budgetAllocatedBdt.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Spent</p>
                          <p className="font-medium">৳ {(project.budgetSpentBdt ?? 0).toLocaleString()}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {totalMilestones > 0 && (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Milestones</span>
                        <span className="font-medium">{verifiedMilestones}/{totalMilestones} verified</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{ width: totalMilestones > 0 ? `${(verifiedMilestones / totalMilestones) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
