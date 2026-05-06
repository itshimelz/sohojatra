"use client"

import { useEffect, useState, useCallback } from "react"
import { use } from "react"
import { ArrowClockwise, Users, ChatCircle, Trophy, Plus } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Submission = {
  id: string
  content: string
  stance: string
  authorName: string
  upvotes: number
  createdAt: string
}

type Round = {
  id: string
  roundNumber: number
  title: string
  prompt: string
  status: string
  openedAt: string
  closedAt: string | null
  submissions: Submission[]
}

type Member = {
  id: string
  citizenName: string
  district: string | null
  occupation: string | null
  joinedAt: string
}

type MiniPublic = {
  id: string
  title: string
  topic: string
  summary: string
  status: string
  panelSize: number
  recommendation: string | null
  publishedAt: string | null
  createdAt: string
  members: Member[]
  rounds: Round[]
}

const STATUS_COLOR: Record<string, string> = {
  Forming: "bg-blue-100 text-blue-800",
  Deliberating: "bg-yellow-100 text-yellow-800",
  Complete: "bg-purple-100 text-purple-800",
  Published: "bg-green-100 text-green-800",
}

const STANCE_COLOR: Record<string, string> = {
  Support: "text-green-700",
  Oppose: "text-red-700",
  Neutral: "text-gray-600",
  Conditional: "text-orange-700",
}

export default function MiniPublicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [mp, setMp] = useState<MiniPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"overview" | "rounds" | "members">("overview")

  const [joinForm, setJoinForm] = useState({ citizenName: "", district: "", occupation: "" })
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  const [joinSuccess, setJoinSuccess] = useState(false)

  const [submitForm, setSubmitForm] = useState({ content: "", stance: "Neutral" as string, authorName: "", roundId: "" })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/mini-publics/${id}`)
    if (res.ok) {
      const data = await res.json()
      setMp(data.miniPublic)
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchDetail() }, [fetchDetail])

  const handleJoin = async () => {
    if (!joinForm.citizenName.trim()) return
    setJoining(true)
    setJoinError("")
    try {
      const res = await fetch(`/api/mini-publics/${id}?action=join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(joinForm),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? "Failed"); return }
      setJoinSuccess(true)
      fetchDetail()
    } finally {
      setJoining(false)
    }
  }

  const handleSubmit = async () => {
    if (!submitForm.content.trim() || !submitForm.roundId) return
    setSubmitting(true)
    setSubmitError("")
    setSubmitSuccess(false)
    try {
      const res = await fetch(`/api/mini-publics/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: submitForm.roundId,
          content: submitForm.content.trim(),
          stance: submitForm.stance,
          authorName: submitForm.authorName.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error ?? "Failed"); return }
      setSubmitSuccess(true)
      setSubmitForm((f) => ({ ...f, content: "", stance: "Neutral" }))
      fetchDetail()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <ArrowClockwise className="size-8 animate-spin mx-auto text-muted-foreground" />
      </div>
    )
  }

  if (!mp) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-muted-foreground">Mini-public not found.</p>
      </div>
    )
  }

  const openRound = mp.rounds.find((r) => r.status === "Open")

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold leading-tight">{mp.title}</h1>
          <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[mp.status] ?? "bg-gray-100 text-gray-800"}`}>
            {mp.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground italic">{mp.topic}</p>
        <p className="text-sm">{mp.summary}</p>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{mp.members.length}/{mp.panelSize} panel members</span>
          <span>{mp.rounds.length} deliberation round{mp.rounds.length !== 1 ? "s" : ""}</span>
          <span>Created {new Date(mp.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {mp.recommendation && (
        <Card className="border-green-300 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-900">
              <Trophy className="size-4" weight="fill" />
              Panel Recommendation
              {mp.publishedAt && <span className="text-xs font-normal text-green-700 ml-auto">Published {new Date(mp.publishedAt).toLocaleDateString()}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-900">{mp.recommendation}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {(["overview", "rounds", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "overview" ? "Overview" : t === "rounds" ? `Rounds (${mp.rounds.length})` : `Members (${mp.members.length})`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4">
          {mp.status === "Forming" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Plus className="size-4" />
                  Join this Panel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {joinSuccess ? (
                  <p className="text-sm text-green-700">You have joined the panel. Deliberation will begin when {mp.panelSize} members have signed up.</p>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Your Name *</label>
                        <input className="w-full rounded-md border px-3 py-1.5 text-sm" value={joinForm.citizenName} onChange={(e) => setJoinForm((f) => ({ ...f, citizenName: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">District</label>
                        <input className="w-full rounded-md border px-3 py-1.5 text-sm" placeholder="Optional" value={joinForm.district} onChange={(e) => setJoinForm((f) => ({ ...f, district: e.target.value }))} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Occupation</label>
                        <input className="w-full rounded-md border px-3 py-1.5 text-sm" placeholder="Optional" value={joinForm.occupation} onChange={(e) => setJoinForm((f) => ({ ...f, occupation: e.target.value }))} />
                      </div>
                    </div>
                    {joinError && <p className="text-sm text-red-600">{joinError}</p>}
                    <Button onClick={handleJoin} disabled={joining || !joinForm.citizenName.trim()}>
                      {joining ? <ArrowClockwise className="size-4 animate-spin mr-2" /> : null}
                      Join Panel
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {openRound && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ChatCircle className="size-4" />
                  Active Round: {openRound.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm bg-muted rounded p-3">{openRound.prompt}</p>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Your Submission</label>
                  <textarea
                    className="w-full rounded-md border px-3 py-1.5 text-sm min-h-[80px] resize-y"
                    placeholder="Share your perspective on the question above…"
                    value={submitForm.roundId === openRound.id ? submitForm.content : ""}
                    onChange={(e) => setSubmitForm((f) => ({ ...f, content: e.target.value, roundId: openRound.id }))}
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Stance</label>
                    <select
                      className="rounded-md border px-3 py-1.5 text-sm"
                      value={submitForm.stance}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, stance: e.target.value, roundId: openRound.id }))}
                    >
                      {["Support", "Oppose", "Neutral", "Conditional"].map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Name (if not logged in)</label>
                    <input
                      className="rounded-md border px-3 py-1.5 text-sm w-40"
                      placeholder="Anonymous"
                      value={submitForm.authorName}
                      onChange={(e) => setSubmitForm((f) => ({ ...f, authorName: e.target.value, roundId: openRound.id }))}
                    />
                  </div>
                </div>
                {submitError && <p className="text-sm text-red-600">{submitError}</p>}
                {submitSuccess && <p className="text-sm text-green-700">Submission recorded.</p>}
                <Button onClick={handleSubmit} disabled={submitting || !submitForm.content.trim()}>
                  {submitting ? <ArrowClockwise className="size-4 animate-spin mr-2" /> : null}
                  Submit
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {tab === "rounds" && (
        <div className="space-y-4">
          {mp.rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No deliberation rounds yet.</p>
          ) : (
            mp.rounds.map((round) => (
              <Card key={round.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Round {round.roundNumber}: {round.title}</CardTitle>
                    <Badge variant={round.status === "Open" ? "default" : "secondary"}>{round.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs bg-muted rounded p-2">{round.prompt}</p>
                  <p className="text-xs text-muted-foreground">{round.submissions.length} submission{round.submissions.length !== 1 ? "s" : ""}</p>
                  {round.submissions.length > 0 && (
                    <div className="space-y-2">
                      {round.submissions.slice(0, 5).map((sub) => (
                        <div key={sub.id} className="border rounded p-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium">{sub.authorName}</span>
                            <span className={`text-xs font-medium ${STANCE_COLOR[sub.stance] ?? "text-gray-600"}`}>{sub.stance}</span>
                          </div>
                          <p className="text-sm">{sub.content}</p>
                          <p className="text-xs text-muted-foreground">{new Date(sub.createdAt).toLocaleDateString()}</p>
                        </div>
                      ))}
                      {round.submissions.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">+{round.submissions.length - 5} more</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-2">
          {mp.members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No panel members yet. Be the first to join.</p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {mp.members.map((m, i) => (
                <div key={m.id} className="flex items-center gap-3 border rounded-lg p-3">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.citizenName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.district, m.occupation].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
