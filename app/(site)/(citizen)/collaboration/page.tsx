"use client"

import { useEffect, useState } from "react"
import { Users, ChatCircle, Handshake, ArrowRight, Plus, CheckCircle, Clock } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

type Thread = {
  id: string
  title: string
  messages: Array<{ id: string; author: string; text: string; createdAt?: string }>
  status?: "active" | "resolved" | "pending"
  participantCount?: number
  createdAt?: string
}

type SolutionPlan = {
  id: string
  concernId: string
  title: string
  summary: string
  status: "Submitted" | "UnderReview" | "Approved" | "Rejected" | "Implemented"
  submittedBy: string
  assignedDepartment?: string
  budgetEstimateBdt?: number
  createdAt: string
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  resolved: "bg-blue-100 text-blue-700",
  pending: "bg-yellow-100 text-yellow-700",
  Submitted: "bg-blue-100 text-blue-700",
  UnderReview: "bg-yellow-100 text-yellow-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
  Implemented: "bg-teal-100 text-teal-700",
}

export default function CoGovernancePage() {
  const { session: _session } = useAuth()
  const t = useT().collaboration
  const [threads, setThreads] = useState<Thread[]>([])
  const [plans, setPlans] = useState<SolutionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [showForm, setShowForm] = useState(false)

  async function loadData() {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch("/api/collaboration/threads"),
        fetch("/api/solution-plans"),
      ])
      const tData = (await tRes.json()) as { threads: Thread[] }
      const pData = pRes.ok ? (await pRes.json()) as { plans: SolutionPlan[] } : { plans: [] }
      setThreads(tData.threads ?? [])
      setPlans(pData.plans ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  async function createThread() {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await fetch("/api/collaboration/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-thread", title: newTitle }),
      })
      setNewTitle("")
      setShowForm(false)
      await loadData()
    } finally {
      setCreating(false)
    }
  }

  const approvedPlans = plans.filter((p) => p.status === "Approved" || p.status === "Implemented")
  const pendingPlans = plans.filter((p) => p.status === "Submitted" || p.status === "UnderReview")

  const statCards = [
    { label: t.activeThreads, value: threads.filter((th) => th.status !== "resolved").length || threads.length, icon: ChatCircle, color: "text-blue-500 bg-blue-50" },
    { label: t.solutionPlans, value: plans.length,         icon: Handshake,   color: "text-violet-500 bg-violet-50" },
    { label: t.approvedPlans, value: approvedPlans.length, icon: CheckCircle, color: "text-green-500 bg-green-50" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.description}</p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="rounded-2xl">
            <CardContent className="flex items-center gap-4 pt-5">
              <span className={`flex size-10 items-center justify-center rounded-xl ${stat.color}`}>
                <stat.icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        {/* Threads column */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.threads}</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowForm((v) => !v)}>
              <Plus className="mr-1.5 size-4" />
              {t.newThread}
            </Button>
          </div>

          {showForm && (
            <Card className="rounded-2xl border-primary/30">
              <CardContent className="pt-5 space-y-3">
                <input
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={t.threadPlaceholder}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void createThread()}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => void createThread()} disabled={creating || !newTitle.trim()}>
                    {creating ? t.creating : t.createThread}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>{t.cancel}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t.noThreads}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {threads.map((thread) => (
                <Card key={thread.id} className="rounded-2xl transition-all hover:border-primary/30 hover:shadow-sm">
                  <CardContent className="flex items-start justify-between gap-3 pt-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{thread.title}</p>
                        {thread.status && (
                          <Badge className={statusColors[thread.status] ?? ""} variant="outline">
                            {thread.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {thread.messages.length} {thread.messages.length !== 1 ? t.messages : t.message}
                        {thread.participantCount ? ` · ${thread.participantCount} ${t.participants}` : ""}
                      </p>
                      {thread.messages.length > 0 && (
                        <p className="mt-2 truncate text-sm text-foreground/70">
                          "{thread.messages[thread.messages.length - 1]?.text}"
                        </p>
                      )}
                    </div>
                    <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground/40" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Solution plans sidebar */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">{t.solutionPlansTitle}</h2>
            <p className="text-sm text-muted-foreground">{t.expertPlans}</p>
          </div>

          {pendingPlans.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-600">
                <Clock className="size-3" /> {t.awaitingReview} ({pendingPlans.length})
              </p>
              <div className="space-y-3">
                {pendingPlans.slice(0, 4).map((plan) => (
                  <Card key={plan.id} className="rounded-xl border-amber-200/60">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{plan.title}</p>
                        <Badge className={statusColors[plan.status]}>{plan.status}</Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{plan.summary}</p>
                      {plan.budgetEstimateBdt && (
                        <p className="mt-1.5 text-xs font-medium text-foreground/70">
                          {t.budget} ৳ {plan.budgetEstimateBdt.toLocaleString()}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {approvedPlans.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-green-600">
                <CheckCircle className="size-3" /> {t.approvedPlansTitle} ({approvedPlans.length})
              </p>
              <div className="space-y-3">
                {approvedPlans.slice(0, 4).map((plan) => (
                  <Card key={plan.id} className="rounded-xl border-green-200/60">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{plan.title}</p>
                        <Badge className={statusColors[plan.status]}>{plan.status}</Badge>
                      </div>
                      {plan.assignedDepartment && (
                        <p className="mt-1 text-xs text-muted-foreground">{plan.assignedDepartment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {plans.length === 0 && !loading && (
            <Card className="rounded-xl">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                {t.noPlans}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl bg-gradient-to-br from-primary/10 to-transparent">
            <CardHeader>
              <CardTitle className="text-base">{t.workflow}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p><Users className="mr-1.5 inline size-4 text-primary" />{t.workflowItem1}</p>
              <p><Handshake className="mr-1.5 inline size-4 text-primary" />{t.workflowItem2}</p>
              <p><CheckCircle className="mr-1.5 inline size-4 text-primary" />{t.workflowItem3}</p>
              <p><ArrowRight className="mr-1.5 inline size-4 text-primary" />{t.workflowItem4}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
