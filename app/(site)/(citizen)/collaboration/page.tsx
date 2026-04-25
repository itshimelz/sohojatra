"use client"

import { useEffect, useState } from "react"
import { Users, ChatCircle, ArrowRight, Plus, CheckCircle } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [showForm, setShowForm] = useState(false)

  async function loadData() {
    try {
      const tRes = await fetch("/api/collaboration/threads")
      const tData = (await tRes.json()) as { threads: Thread[] }
      setThreads(tData.threads ?? [])
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

  const statCards = [
    { label: t.activeThreads, value: threads.filter((th) => th.status !== "resolved").length || threads.length, icon: ChatCircle, color: "text-blue-500 bg-blue-50" },
    { label: t.solutionPlans, value: 0,                    icon: Users,       color: "text-violet-500 bg-violet-50" },
    { label: t.approvedPlans, value: 0,                    icon: CheckCircle, color: "text-green-500 bg-green-50" },
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

      <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{t.threads}</h2>
            <Button size="sm" className="rounded-full" onClick={() => setShowForm(true)}>
              <Plus className="mr-1.5 size-4" />
              {t.newThread}
            </Button>
          </div>

          <Dialog open={showForm} onOpenChange={setShowForm}>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>{t.newThread}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <input
                  className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder={t.threadPlaceholder}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void createThread()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowForm(false)} disabled={creating}>
                  {t.cancel}
                </Button>
                <Button onClick={() => void createThread()} disabled={creating || !newTitle.trim()}>
                  {creating ? t.creating : t.createThread}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                {t.noThreads}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {threads.map((thread) => (
                <li key={thread.id} className="group flex items-start justify-between gap-3 rounded-lg border-b border-border/60 px-1 py-4 transition-colors hover:bg-muted/40 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium transition-colors group-hover:text-primary">{thread.title}</p>
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
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  )
}
