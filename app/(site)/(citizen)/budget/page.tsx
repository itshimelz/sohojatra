"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Coins,
  ChartBar,
  ThumbsUp,
  ThumbsDown,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  SlidersHorizontal,
  Trophy,
  Users,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface BudgetCycle {
  id: string
  title: string
  description: string
  fiscalYear: string
  totalBudgetBdt: string
  category: string
  district?: string
  upazila?: string
  status: string
  proposalDeadline: string
  votingDeadline: string
  createdBy: string
  createdAt: string
  _count?: { proposals: number }
}

interface BudgetProposal {
  id: string
  cycleId: string
  title: string
  description: string
  costEstimateBdt: string
  category: string
  authorName: string
  beneficiaries?: string
  rationale?: string
  upvotes: number
  downvotes: number
  status: string
  funded?: boolean
  netScore?: number
  voteShare?: number
}

type Tab = "cycles" | "proposals" | "results" | "simulator"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBDT(value: string | number) {
  const n = typeof value === "string" ? parseInt(value) : value
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(1)} Cr`
  if (n >= 100_000) return `৳${(n / 100_000).toFixed(1)} Lac`
  return `৳${n.toLocaleString()}`
}

function statusColor(status: string) {
  switch (status) {
    case "Open": return "bg-green-500/10 text-green-600 border-green-200"
    case "Voting": return "bg-blue-500/10 text-blue-600 border-blue-200"
    case "Closed": return "bg-muted text-muted-foreground border-border"
    case "Funded": return "bg-primary/10 text-primary border-primary/20"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

const CATEGORIES = ["Education", "Health", "Infrastructure", "Environment", "Safety", "Economy", "General"]

// ─── Simulator categories with benchmark allocations ──────────────────────────
const SIM_CATEGORIES = [
  { key: "Education", benchmark: 20, color: "bg-blue-500" },
  { key: "Health", benchmark: 15, color: "bg-red-500" },
  { key: "Infrastructure", benchmark: 25, color: "bg-orange-500" },
  { key: "Environment", benchmark: 10, color: "bg-green-500" },
  { key: "Safety", benchmark: 10, color: "bg-yellow-500" },
  { key: "Economy", benchmark: 20, color: "bg-purple-500" },
]

// ─── CycleCard ────────────────────────────────────────────────────────────────

function CycleCard({ cycle, onSelect }: { cycle: BudgetCycle; onSelect: (c: BudgetCycle) => void }) {
  const proposalDeadline = new Date(cycle.proposalDeadline)
  const votingDeadline = new Date(cycle.votingDeadline)
  const now = new Date()
  const daysToVote = Math.max(0, Math.ceil((votingDeadline.getTime() - now.getTime()) / 86400000))

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
      onClick={() => onSelect(cycle)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className={`text-xs ${statusColor(cycle.status)}`}>
                {cycle.status}
              </Badge>
              <Badge variant="outline" className="text-xs">{cycle.fiscalYear}</Badge>
              {cycle.district && (
                <Badge variant="outline" className="text-xs">{cycle.district}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{cycle.title}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-primary">{formatBDT(cycle.totalBudgetBdt)}</p>
            <p className="text-xs text-muted-foreground">Total Budget</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{cycle.description}</p>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-sm font-semibold">{cycle._count?.proposals ?? 0}</p>
            <p className="text-xs text-muted-foreground">Proposals</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-sm font-semibold">
              {now < proposalDeadline ? `${Math.ceil((proposalDeadline.getTime() - now.getTime()) / 86400000)}d` : "Closed"}
            </p>
            <p className="text-xs text-muted-foreground">Submit</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2">
            <p className="text-sm font-semibold">{daysToVote > 0 ? `${daysToVote}d` : "Ended"}</p>
            <p className="text-xs text-muted-foreground">Vote</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1 text-xs text-primary font-medium">
          <span>View proposals</span>
          <ArrowRight className="size-3" />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  totalBudget,
  onVote,
  loading,
}: {
  proposal: BudgetProposal
  totalBudget: number
  onVote: (id: string, type: "up" | "down") => void
  loading: boolean
}) {
  const cost = parseInt(proposal.costEstimateBdt)
  const pct = totalBudget > 0 ? Math.round((cost / totalBudget) * 100) : 0

  return (
    <Card className={proposal.funded ? "border-primary/30 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">{proposal.category}</Badge>
              {proposal.funded !== undefined && (
                <Badge
                  variant="outline"
                  className={`text-xs ${proposal.funded ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground"}`}
                >
                  {proposal.funded ? "Funded" : "Not funded"}
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm leading-snug">{proposal.title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">by {proposal.authorName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-base font-bold text-primary">{formatBDT(proposal.costEstimateBdt)}</p>
            <p className="text-xs text-muted-foreground">{pct}% of budget</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{proposal.description}</p>

        {/* Budget bar */}
        <div className="mb-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all"
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onVote(proposal.id, "up")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-green-500/10 hover:text-green-600 hover:border-green-200 disabled:opacity-50"
          >
            <ThumbsUp className="size-3.5" />
            {proposal.upvotes}
          </button>
          <button
            onClick={() => onVote(proposal.id, "down")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-500/10 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
          >
            <ThumbsDown className="size-3.5" />
            {proposal.downvotes}
          </button>
          {proposal.voteShare !== undefined && (
            <span className="ml-auto text-xs text-muted-foreground">{proposal.voteShare}% support</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { session } = useAuth()
  const t = useT()

  const [tab, setTab] = useState<Tab>("cycles")
  const [cycles, setCycles] = useState<BudgetCycle[]>([])
  const [selectedCycle, setSelectedCycle] = useState<BudgetCycle | null>(null)
  const [proposals, setProposals] = useState<BudgetProposal[]>([])
  const [results, setResults] = useState<{ ranked: BudgetProposal[]; summary: Record<string, number> } | null>(null)
  const [totalBudget, setTotalBudget] = useState(0)
  const [loadingCycles, setLoadingCycles] = useState(false)
  const [loadingProposals, setLoadingProposals] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [submitError, setSubmitError] = useState("")

  // Simulator state
  const [simTotal, setSimTotal] = useState(100_000_000)
  const [simAllocations, setSimAllocations] = useState<Record<string, number>>(
    Object.fromEntries(SIM_CATEGORIES.map((c) => [c.key, 0]))
  )
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null)

  // Proposal form state
  const [pForm, setPForm] = useState({
    title: "",
    description: "",
    costEstimateBdt: "",
    category: "Infrastructure",
    beneficiaries: "",
    rationale: "",
  })

  const fetchCycles = useCallback(async () => {
    setLoadingCycles(true)
    try {
      const r = await fetch("/api/budget/cycles")
      const data = await r.json()
      setCycles(data.cycles ?? [])
    } finally {
      setLoadingCycles(false)
    }
  }, [])

  const fetchProposals = useCallback(async (cycle: BudgetCycle) => {
    setLoadingProposals(true)
    try {
      const r = await fetch(`/api/budget/cycles/${cycle.id}`)
      const data = await r.json()
      setProposals(data.cycle?.proposals ?? [])
      setTotalBudget(parseInt(cycle.totalBudgetBdt))
    } finally {
      setLoadingProposals(false)
    }
  }, [])

  const fetchResults = useCallback(async (cycle: BudgetCycle) => {
    const r = await fetch(`/api/budget/cycles/${cycle.id}/results`)
    const data = await r.json()
    setResults({ ranked: data.ranked ?? [], summary: data.summary ?? {} })
    setTotalBudget(parseInt(cycle.totalBudgetBdt))
  }, [])

  useEffect(() => {
    fetchCycles()
  }, [fetchCycles])

  const handleSelectCycle = (cycle: BudgetCycle) => {
    setSelectedCycle(cycle)
    setTab("proposals")
    fetchProposals(cycle)
  }

  const handleVote = async (proposalId: string, voteType: "up" | "down") => {
    if (!session || !selectedCycle) return
    setVoteLoading(true)
    try {
      await fetch(`/api/budget/cycles/${selectedCycle.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, voteType }),
      })
      fetchProposals(selectedCycle)
    } finally {
      setVoteLoading(false)
    }
  }

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCycle || !session) return
    setSubmitError("")
    const r = await fetch(`/api/budget/cycles/${selectedCycle.id}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pForm,
        costEstimateBdt: parseInt(pForm.costEstimateBdt),
      }),
    })
    if (!r.ok) {
      const data = await r.json()
      setSubmitError(data.error ?? "Failed to submit proposal")
      return
    }
    setShowProposalForm(false)
    setPForm({ title: "", description: "", costEstimateBdt: "", category: "Infrastructure", beneficiaries: "", rationale: "" })
    fetchProposals(selectedCycle)
  }

  const handleViewResults = () => {
    if (!selectedCycle) return
    setTab("results")
    fetchResults(selectedCycle)
  }

  const handleSimulate = async () => {
    const r = await fetch("/api/budget/simulator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        totalBudgetBdt: simTotal,
        allocations: Object.entries(simAllocations).map(([category, amountBdt]) => ({ category, amountBdt })),
      }),
    })
    const data = await r.json()
    setSimResult(data)
  }

  const simAllocatedTotal = Object.values(simAllocations).reduce((s, v) => s + v, 0)

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "cycles", label: "Budget Cycles", icon: <Coins className="size-4" /> },
    { key: "proposals", label: selectedCycle ? `Proposals — ${selectedCycle.title.slice(0, 30)}` : "Proposals", icon: <ChartBar className="size-4" /> },
    { key: "results", label: "Results", icon: <Trophy className="size-4" /> },
    { key: "simulator", label: "Budget Simulator", icon: <SlidersHorizontal className="size-4" /> },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Coins className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.nav.participatoryBudget}</h1>
            <p className="text-sm text-muted-foreground">{t.nav.participatoryBudgetDesc}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              tab === tb.key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Cycles tab */}
      {tab === "cycles" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{cycles.length} active budget cycle{cycles.length !== 1 ? "s" : ""}</p>
          </div>
          {loadingCycles ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : cycles.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Coins className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No budget cycles available</p>
              <p className="text-sm text-muted-foreground mt-1">New cycles will appear here when opened by authorities</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cycles.map((cycle) => (
                <CycleCard key={cycle.id} cycle={cycle} onSelect={handleSelectCycle} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proposals tab */}
      {tab === "proposals" && (
        <div>
          {!selectedCycle ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <ChartBar className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">Select a budget cycle first</p>
              <Button variant="outline" className="mt-4" onClick={() => setTab("cycles")}>
                Browse cycles
              </Button>
            </div>
          ) : (
            <>
              {/* Cycle summary bar */}
              <div className="mb-6 rounded-xl border border-border bg-muted/30 p-4 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{selectedCycle.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedCycle.fiscalYear} · {selectedCycle.category}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-primary">{formatBDT(selectedCycle.totalBudgetBdt)}</p>
                    <p className="text-xs text-muted-foreground">Total Budget</p>
                  </div>
                  <Badge variant="outline" className={statusColor(selectedCycle.status)}>
                    {selectedCycle.status}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {session && selectedCycle.status === "Open" && (
                    <Button size="sm" onClick={() => setShowProposalForm((v) => !v)}>
                      <Plus className="size-3.5 mr-1" /> Submit Proposal
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleViewResults}>
                    View Results
                  </Button>
                </div>
              </div>

              {/* Proposal form */}
              {showProposalForm && (
                <Card className="mb-6 border-primary/30">
                  <CardHeader className="pb-2">
                    <h3 className="font-semibold text-sm">Submit a Budget Proposal</h3>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitProposal} className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
                          <input
                            required
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={pForm.title}
                            onChange={(e) => setPForm((f) => ({ ...f, title: e.target.value }))}
                            placeholder="Proposal title"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Cost Estimate (BDT) *</label>
                          <input
                            required
                            type="number"
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={pForm.costEstimateBdt}
                            onChange={(e) => setPForm((f) => ({ ...f, costEstimateBdt: e.target.value }))}
                            placeholder="e.g. 5000000"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                          <select
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={pForm.category}
                            onChange={(e) => setPForm((f) => ({ ...f, category: e.target.value }))}
                          >
                            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">Beneficiaries</label>
                          <input
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={pForm.beneficiaries}
                            onChange={(e) => setPForm((f) => ({ ...f, beneficiaries: e.target.value }))}
                            placeholder="Who benefits from this?"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                        <textarea
                          required
                          rows={3}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          value={pForm.description}
                          onChange={(e) => setPForm((f) => ({ ...f, description: e.target.value }))}
                          placeholder="Describe the proposal in detail..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Rationale</label>
                        <textarea
                          rows={2}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                          value={pForm.rationale}
                          onChange={(e) => setPForm((f) => ({ ...f, rationale: e.target.value }))}
                          placeholder="Why is this the best use of funds?"
                        />
                      </div>
                      {submitError && (
                        <p className="text-xs text-red-600">{typeof submitError === "string" ? submitError : "Validation error"}</p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Submit Proposal</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowProposalForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Proposals list */}
              {loadingProposals ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}
                </div>
              ) : proposals.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-16 text-center">
                  <ChartBar className="size-10 text-muted-foreground/40 mb-3" />
                  <p className="font-medium text-sm">No proposals yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to submit a proposal for this cycle</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {proposals.map((p) => (
                    <ProposalCard
                      key={p.id}
                      proposal={p}
                      totalBudget={totalBudget}
                      onVote={handleVote}
                      loading={voteLoading}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Results tab */}
      {tab === "results" && (
        <div>
          {!selectedCycle || !results ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Trophy className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">Select a cycle and view its proposals first</p>
              <Button variant="outline" className="mt-4" onClick={() => setTab("cycles")}>
                Browse cycles
              </Button>
            </div>
          ) : (
            <>
              {/* Summary cards */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Proposals", value: results.summary.totalProposals ?? 0, icon: <ChartBar className="size-4" /> },
                  { label: "Total Votes Cast", value: results.summary.totalVotes ?? 0, icon: <Users className="size-4" /> },
                  { label: "Funded Proposals", value: results.summary.fundedCount ?? 0, icon: <CheckCircle className="size-4" /> },
                  { label: "Remaining Budget", value: formatBDT(results.summary.remainingBudget ?? 0), icon: <Coins className="size-4" /> },
                ].map((card, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {card.icon}
                      </span>
                      <div>
                        <p className="text-lg font-bold">{card.value}</p>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Ranked proposals */}
              <h3 className="font-semibold text-sm mb-3">Ranked Proposals</h3>
              <div className="space-y-3">
                {results.ranked.map((p, idx) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    totalBudget={totalBudget}
                    onVote={() => {}}
                    loading={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Simulator tab */}
      {tab === "simulator" && (
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground mb-6">
            Simulate budget allocation across sectors and see how your distribution compares to recommended benchmarks.
          </p>

          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="mb-4">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Total Budget (BDT)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  value={simTotal}
                  onChange={(e) => setSimTotal(parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-4">
                {SIM_CATEGORIES.map((cat) => {
                  const pct = simTotal > 0 ? Math.round(((simAllocations[cat.key] ?? 0) / simTotal) * 100) : 0
                  return (
                    <div key={cat.key}>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium">{cat.key}</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Benchmark: {cat.benchmark}%</span>
                          <span className="text-sm font-semibold text-primary">{pct}%</span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={simTotal}
                        step={100000}
                        value={simAllocations[cat.key] ?? 0}
                        onChange={(e) =>
                          setSimAllocations((a) => ({ ...a, [cat.key]: parseInt(e.target.value) }))
                        }
                        className="w-full accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                        <span>{formatBDT(simAllocations[cat.key] ?? 0)}</span>
                        <span
                          className={
                            pct > cat.benchmark ? "text-orange-500" : pct < cat.benchmark ? "text-blue-500" : "text-green-600"
                          }
                        >
                          {pct > cat.benchmark ? `+${pct - cat.benchmark}%` : pct < cat.benchmark ? `-${cat.benchmark - pct}%` : "On target"}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
                <span className="text-sm font-medium">Total Allocated</span>
                <div className="text-right">
                  <span
                    className={`font-bold text-sm ${simAllocatedTotal > simTotal ? "text-red-600" : "text-primary"}`}
                  >
                    {formatBDT(simAllocatedTotal)}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    / {formatBDT(simTotal)}
                  </span>
                  {simAllocatedTotal > simTotal && (
                    <p className="text-xs text-red-600 mt-0.5">Over budget by {formatBDT(simAllocatedTotal - simTotal)}</p>
                  )}
                </div>
              </div>

              <Button className="mt-4 w-full" onClick={handleSimulate}>
                <SlidersHorizontal className="size-4 mr-2" /> Run Simulation
              </Button>
            </CardContent>
          </Card>

          {simResult && (
            <Card>
              <CardContent className="p-5">
                <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                  <ChartBar className="size-4 text-primary" /> Simulation Insights
                </h4>
                {Array.isArray((simResult as Record<string, unknown>).insights) &&
                ((simResult as Record<string, unknown>).insights as unknown[]).length === 0 ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="size-4" /> All allocations are within recommended ranges
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(((simResult as Record<string, unknown>).insights) as Array<{ category: string; message: string; severity: string }>).map(
                      (insight, i: number) => (
                        <div
                          key={i}
                          className={`rounded-lg p-3 text-sm ${
                            insight.severity === "high"
                              ? "bg-red-500/10 text-red-700 border border-red-200"
                              : "bg-yellow-500/10 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {insight.message}
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
