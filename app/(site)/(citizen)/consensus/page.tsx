"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ChatsCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Plus,
  Users,
  ChartBar,
  ArrowLeft,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Consultation {
  id: string
  title: string
  description: string
  category: string
  status: string
  createdAt: string
  _count?: { statements: number }
}

interface Statement {
  id: string
  text: string
  authorName: string
  agreeCount: number
  disagreeCount: number
  passCount: number
  _count?: { votes: number }
}

interface ConsultationDetail {
  consultation: Consultation & { statements: Statement[] }
  userVotes: Record<string, string>
  totalParticipants: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function consensusScore(s: Statement) {
  const total = s.agreeCount + s.disagreeCount
  if (total === 0) return 0
  return Math.round((s.agreeCount / total) * 100)
}

function statusColor(status: string) {
  return status === "Open"
    ? "bg-green-500/10 text-green-600 border-green-200"
    : "bg-muted text-muted-foreground"
}

// ─── Statement card ────────────────────────────────────────────────────────────

function StatementCard({
  statement,
  myVote,
  onVote,
  loading,
  consultationId,
}: {
  statement: Statement
  myVote: string | undefined
  onVote: (statementId: string, vote: "agree" | "disagree" | "pass") => void
  loading: boolean
  consultationId: string
}) {
  const total = statement.agreeCount + statement.disagreeCount + statement.passCount
  const score = consensusScore(statement)
  const agreeW = total > 0 ? Math.round((statement.agreeCount / total) * 100) : 0
  const disagreeW = total > 0 ? Math.round((statement.disagreeCount / total) * 100) : 0
  const passW = total > 0 ? Math.round((statement.passCount / total) * 100) : 0

  return (
    <Card className={myVote ? "border-primary/30" : ""}>
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-4 leading-relaxed">{statement.text}</p>

        {/* Vote bar */}
        <div className="mb-4">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="bg-green-500/80 transition-all"
              style={{ width: `${agreeW}%` }}
              title={`Agree: ${agreeW}%`}
            />
            <div
              className="bg-muted-foreground/30 transition-all"
              style={{ width: `${passW}%` }}
              title={`Pass: ${passW}%`}
            />
            <div
              className="bg-red-500/60 transition-all"
              style={{ width: `${disagreeW}%` }}
              title={`Disagree: ${disagreeW}%`}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span className="text-green-600 font-medium">{agreeW}% agree</span>
            <span>{total} votes</span>
            <span className="text-red-500 font-medium">{disagreeW}% disagree</span>
          </div>
        </div>

        {/* Consensus meter */}
        {total > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Consensus:</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/70"
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-primary">{score}%</span>
          </div>
        )}

        {/* Vote buttons */}
        <div className="flex items-center gap-2">
          {([
            { vote: "agree" as const, label: "Agree", icon: <ThumbsUp className="size-3.5" />, active: "bg-green-500/10 text-green-600 border-green-300" },
            { vote: "disagree" as const, label: "Disagree", icon: <ThumbsDown className="size-3.5" />, active: "bg-red-500/10 text-red-600 border-red-300" },
            { vote: "pass" as const, label: "Pass", icon: <Minus className="size-3.5" />, active: "bg-muted text-muted-foreground border-border" },
          ]).map(({ vote, label, icon, active }) => (
            <button
              key={vote}
              disabled={loading}
              onClick={() => onVote(statement.id, vote)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                myVote === vote
                  ? active
                  : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
          <span className="ml-auto text-xs text-muted-foreground">by {statement.authorName}</span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ConsensusPage() {
  const { session } = useAuth()
  const t = useT()

  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selected, setSelected] = useState<ConsultationDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [voteLoading, setVoteLoading] = useState(false)
  const [showStatementForm, setShowStatementForm] = useState(false)
  const [statementText, setStatementText] = useState("")
  const [statementError, setStatementError] = useState("")

  const fetchConsultations = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/consensus/consultations")
      const data = await r.json()
      setConsultations(data.consultations ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/consensus/consultations/${id}`)
      const data = await r.json()
      setSelected(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConsultations()
  }, [fetchConsultations])

  const handleVote = async (statementId: string, vote: "agree" | "disagree" | "pass") => {
    if (!session || !selected) return
    setVoteLoading(true)
    try {
      await fetch(`/api/consensus/consultations/${selected.consultation.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementId, vote }),
      })
      fetchDetail(selected.consultation.id)
    } finally {
      setVoteLoading(false)
    }
  }

  const handleAddStatement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selected || !session) return
    setStatementError("")
    const r = await fetch(`/api/consensus/consultations/${selected.consultation.id}/statements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: statementText }),
    })
    if (!r.ok) {
      const data = await r.json()
      setStatementError(JSON.stringify(data.error))
      return
    }
    setStatementText("")
    setShowStatementForm(false)
    fetchDetail(selected.consultation.id)
  }

  // Opinion clusters: group statements by consensus score
  const clusters = selected
    ? {
        highConsensus: selected.consultation.statements.filter(
          (s) => consensusScore(s) >= 70 && s.agreeCount + s.disagreeCount >= 3
        ),
        contested: selected.consultation.statements.filter(
          (s) => consensusScore(s) >= 40 && consensusScore(s) < 70 && s.agreeCount + s.disagreeCount >= 3
        ),
        rejected: selected.consultation.statements.filter(
          (s) => consensusScore(s) < 40 && s.agreeCount + s.disagreeCount >= 3
        ),
        unvoted: selected.consultation.statements.filter(
          (s) => s.agreeCount + s.disagreeCount < 3
        ),
      }
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ChatsCircle className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.nav.consensus}</h1>
            <p className="text-sm text-muted-foreground">{t.nav.consensusDesc}</p>
          </div>
        </div>
      </div>

      {/* Detail view */}
      {selected ? (
        <div>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="size-4" /> Back to consultations
          </button>

          {/* Consultation header */}
          <div className="mb-6 rounded-xl border border-border bg-muted/30 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={`text-xs ${statusColor(selected.consultation.status)}`}>
                    {selected.consultation.status}
                  </Badge>
                  <Badge variant="outline" className="text-xs">{selected.consultation.category}</Badge>
                </div>
                <h2 className="font-bold text-lg">{selected.consultation.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selected.consultation.description}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0 text-sm">
                <div className="text-center">
                  <p className="font-bold text-primary">{selected.totalParticipants}</p>
                  <p className="text-xs text-muted-foreground">Participants</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{selected.consultation.statements.length}</p>
                  <p className="text-xs text-muted-foreground">Statements</p>
                </div>
              </div>
            </div>
          </div>

          {/* Opinion clusters */}
          {clusters && (
            <div className="mb-8 grid gap-3 sm:grid-cols-3">
              {[
                { label: "High Consensus", count: clusters.highConsensus.length, color: "text-green-600", bg: "bg-green-500/10" },
                { label: "Contested", count: clusters.contested.length, color: "text-orange-600", bg: "bg-orange-500/10" },
                { label: "Rejected", count: clusters.rejected.length, color: "text-red-600", bg: "bg-red-500/10" },
              ].map((c) => (
                <div key={c.label} className={`rounded-xl p-4 ${c.bg}`}>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.count}</p>
                  <p className="text-sm font-medium mt-0.5">{c.label}</p>
                  <p className="text-xs text-muted-foreground">statements</p>
                </div>
              ))}
            </div>
          )}

          {/* Add statement */}
          {session && selected.consultation.status === "Open" && (
            <div className="mb-6">
              {showStatementForm ? (
                <Card className="border-primary/30">
                  <CardContent className="p-4">
                    <form onSubmit={handleAddStatement}>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">
                        Add a statement for others to vote on
                      </label>
                      <textarea
                        required
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                        value={statementText}
                        onChange={(e) => setStatementText(e.target.value)}
                        placeholder="State a clear, specific opinion or fact that others can agree or disagree with..."
                        maxLength={500}
                      />
                      <p className="text-xs text-muted-foreground mb-2">{statementText.length}/500</p>
                      {statementError && <p className="text-xs text-red-600 mb-2">{statementError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm">Submit Statement</Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowStatementForm(false)}>Cancel</Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowStatementForm(true)}>
                  <Plus className="size-3.5 mr-1" /> Add Statement
                </Button>
              )}
            </div>
          )}

          {/* Statements */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : selected.consultation.statements.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <ChatsCircle className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No statements yet</p>
              <p className="text-sm text-muted-foreground mt-1">Be the first to add a statement</p>
            </div>
          ) : (
            <>
              {clusters && clusters.highConsensus.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-green-500 inline-block" /> High Consensus
                  </h3>
                  <div className="space-y-3">
                    {clusters.highConsensus.map((s) => (
                      <StatementCard
                        key={s.id}
                        statement={s}
                        myVote={selected.userVotes[s.id]}
                        onVote={handleVote}
                        loading={voteLoading}
                        consultationId={selected.consultation.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {clusters && clusters.contested.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-orange-600 mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-orange-500 inline-block" /> Contested
                  </h3>
                  <div className="space-y-3">
                    {clusters.contested.map((s) => (
                      <StatementCard
                        key={s.id}
                        statement={s}
                        myVote={selected.userVotes[s.id]}
                        onVote={handleVote}
                        loading={voteLoading}
                        consultationId={selected.consultation.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {clusters && clusters.unvoted.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Needs More Votes</h3>
                  <div className="space-y-3">
                    {clusters.unvoted.map((s) => (
                      <StatementCard
                        key={s.id}
                        statement={s}
                        myVote={selected.userVotes[s.id]}
                        onVote={handleVote}
                        loading={voteLoading}
                        consultationId={selected.consultation.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {clusters && clusters.rejected.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-red-500 mb-2 flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-red-500 inline-block" /> Rejected by Majority
                  </h3>
                  <div className="space-y-3 opacity-70">
                    {clusters.rejected.map((s) => (
                      <StatementCard
                        key={s.id}
                        statement={s}
                        myVote={selected.userVotes[s.id]}
                        onVote={handleVote}
                        loading={voteLoading}
                        consultationId={selected.consultation.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Consultation list */
        <div>
          <p className="text-sm text-muted-foreground mb-4">{consultations.length} consultation{consultations.length !== 1 ? "s" : ""} open</p>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : consultations.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <ChatsCircle className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No consultations yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Consultations will appear here when opened by authorities
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {consultations.map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => fetchDetail(c.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className={`text-xs ${statusColor(c.status)}`}>
                            {c.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{c.category}</Badge>
                        </div>
                        <h3 className="font-semibold text-sm leading-snug line-clamp-2">{c.title}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ChatsCircle className="size-3.5" />
                        {c._count?.statements ?? 0} statements
                      </div>
                      <span className="text-xs text-primary font-medium">Participate →</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
