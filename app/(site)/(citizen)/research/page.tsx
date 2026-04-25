"use client"

import { useEffect, useState } from "react"
import { Bank, Briefcase, CalendarCheck, GraduationCap, Flask, MagnifyingGlass } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

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
  const t = useT().research
  const [problems, setProblems] = useState<ResearchProblem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "Open" | "UnderReview" | "Funded">("all")
  const [search, setSearch] = useState("")
  const [applying, setApplying] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 8

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
    if (!session?.user) { alert(t.signInToApply); return }
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
      alert(t.applicationSubmitted)
    } finally {
      setApplying(null)
    }
  }

  const filtered = problems.filter((p) => {
    const matchStatus = filter === "all" || p.status === filter
    const matchSearch = !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.ministry.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)

  const openCount = problems.filter((p) => p.status === "Open").length

  useEffect(() => {
    setPage(1)
  }, [filter, search])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const filterOptions = [
    { key: "all" as const,          label: t.filterAll },
    { key: "Open" as const,         label: "Open" },
    { key: "UnderReview" as const,  label: "UnderReview" },
    { key: "Funded" as const,       label: "Funded" },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.description}</p>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700">
          <Flask className="size-4" />
          {openCount} {t.openProblems}
        </div>
        <div className="flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm text-muted-foreground">
          <GraduationCap className="size-4" />
          {problems.length} {t.totalProblems}
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="w-full rounded-xl border border-border/60 bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            placeholder={t.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {filterOptions.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                filter === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
        <div>
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                {t.noResults}
              </CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {paginated.map((problem) => (
                <li key={problem.id} className="group rounded-lg border-b border-border/60 px-1 py-4 transition-colors hover:bg-muted/40 last:border-b-0">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="rounded-full">{problem.ministry}</Badge>
                      <Badge className={statusStyles[problem.status]}>{problem.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <CalendarCheck className="mr-1 inline size-3.5" />
                      {problem.deadline}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight transition-colors group-hover:text-primary">{problem.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    <Bank className="mr-1 inline size-3.5" />
                    {t.grant} {problem.grant}
                    {problem.applicants != null && ` · ${problem.applicants} ${t.applicants}`}
                  </p>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/90">{problem.summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="rounded-full"
                      disabled={problem.status !== "Open" || applying === problem.id}
                      onClick={() => void applyToResearch(problem.id)}
                    >
                      <Briefcase className="mr-1.5 size-4" />
                      {applying === problem.id ? t.submitting : problem.status === "Open" ? t.applyNow : t.closed}
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <CalendarCheck className="mr-1.5 size-4" />
                      {t.milestonePlan}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!loading && filtered.length > 0 && (
            <div className="mt-6 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Page {safePage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <CardTitle className="text-base">{t.howItWorksTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm text-muted-foreground">
              <p><GraduationCap className="mr-1.5 inline size-4 text-primary" />{t.howItWorksP1}</p>
              <p><Bank className="mr-1.5 inline size-4 text-primary" />{t.howItWorksP2}</p>
              <p><CalendarCheck className="mr-1.5 inline size-4 text-primary" />{t.howItWorksP3}</p>
              <p>{t.howItWorksP4}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base">{t.publicOutcomesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t.publicOutcomesP1}</p>
              <p>{t.publicOutcomesP2}</p>
              <p>{t.publicOutcomesP3}</p>
              <p>{t.publicOutcomesP4}</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl bg-linear-to-br from-primary/10 to-transparent">
            <CardContent className="pt-5">
              <p className="text-sm font-medium">{t.researcherTitle}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t.researcherDesc}</p>
              <Button size="sm" variant="outline" className="mt-3 rounded-full w-full">
                {t.registerInstitution}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
