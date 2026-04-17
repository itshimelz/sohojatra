"use client"

import { useEffect, useState } from "react"
import { Bank, Briefcase, CalendarCheck, GraduationCap, Flask, MagnifyingGlass } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"

type ResearchProblem = {
  id: string
  title: string
  summary: string
  ministry: string
  deadline: string
  grant: string
  status: "Open" | "UnderReview" | "Funded" | "Closed"
  applicants?: number
}

const statusStyles: Record<string, string> = {
  Open: "bg-green-100 text-green-700",
  UnderReview: "bg-yellow-100 text-yellow-700",
  Funded: "bg-blue-100 text-blue-700",
  Closed: "bg-gray-100 text-gray-600",
}

export default function ResearchPage() {
  const { session } = useAuth()
  const [problems, setProblems] = useState<ResearchProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "Open" | "UnderReview" | "Funded">("all")
  const [search, setSearch] = useState("")
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/research/problems")
        const data = (await res.json()) as { problems?: ResearchProblem[] }
        setProblems(data.problems ?? [])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function applyToResearch(problemId: string) {
    if (!session?.user) {
      alert("Please sign in to apply.")
      return
    }
    setApplying(problemId)
    try {
      await fetch("/api/research/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemId,
          applicantId: session.user.id,
          applicantName: session.user.name,
          institution: (session.user as { institution?: string }).institution ?? "Independent",
        }),
      })
      alert("Application submitted! You will be notified of the decision.")
    } finally {
      setApplying(null)
    }
  }

  const filtered = problems.filter((p) => {
    const matchStatus = filter === "all" || p.status === filter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.ministry.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const openCount = problems.filter((p) => p.status === "Open").length

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Knowledge</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Research Lab</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Open civic problems posted by government ministries with grant-backed funding.
          Universities and experts can apply to solve them with phased milestone disbursements.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
          <Flask className="size-4" />
          {openCount} open problems
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <GraduationCap className="size-4" />
          {problems.length} total problems
        </div>
      </div>

      {/* Search + filter */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Search by title or ministry…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "Open", "UnderReview", "Funded"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {key === "all" ? "All" : key}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
        {/* Problem cards */}
        <div className="space-y-4">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />)
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No research problems found.
              </CardContent>
            </Card>
          ) : (
            filtered.map((problem) => (
              <Card key={problem.id} className="rounded-3xl border-border/60 transition-all hover:border-primary/30 hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="outline" className="rounded-full">{problem.ministry}</Badge>
                    <div className="flex items-center gap-2">
                      <Badge className={statusStyles[problem.status]}>{problem.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        <CalendarCheck className="mr-1 inline size-3.5" />
                        {problem.deadline}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-xl">{problem.title}</CardTitle>
                  <CardDescription>
                    <Bank className="mr-1 inline size-3.5" />
                    Grant: {problem.grant}
                    {problem.applicants != null && ` · ${problem.applicants} applicants`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground/90">{problem.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={problem.status !== "Open" || applying === problem.id}
                      onClick={() => void applyToResearch(problem.id)}
                    >
                      <Briefcase className="mr-1.5 size-4" />
                      {applying === problem.id ? "Submitting…" : problem.status === "Open" ? "Apply Now" : "Closed"}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <CalendarCheck className="mr-1.5 size-4" />
                      Milestone Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <CardTitle className="text-base">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p><GraduationCap className="mr-1.5 inline size-4 text-primary" />Expert and university review panel</p>
              <p><Bank className="mr-1.5 inline size-4 text-primary" />Phased bKash or bank transfer disbursement</p>
              <p><CalendarCheck className="mr-1.5 inline size-4 text-primary" />Milestone verification before next tranche</p>
              <p>Public progress feed for citizens</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">Public outcomes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Project progress feed</p>
              <p>University contribution leaderboard</p>
              <p>Citizen-facing impact summaries</p>
              <p>Open data results under CC BY 4.0</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-gradient-to-br from-primary/10 to-transparent">
            <CardContent className="pt-5">
              <p className="text-sm font-medium">Are you a researcher?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Register your institution and get notified when new problems matching your expertise are posted.
              </p>
              <Button size="sm" variant="outline" className="mt-3 rounded-full w-full">
                Register Institution
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
