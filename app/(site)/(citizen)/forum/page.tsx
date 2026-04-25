"use client"

import { useEffect, useState } from "react"
import { ArrowFatUp, ArrowFatDown, ChatCircle, Quotes, Star, Plus, X } from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"

type ProposalComment = {
  id: string
  author: string
  body: string
  quoted?: string
  points?: number
  awards?: string[]
}

type Proposal = {
  id: string
  title: string
  body: string
  author: string
  category: string
  votes: number
  downvotes: number
  sortLabel?: string
  comments: ProposalComment[]
}

const SORTS = ["Hot", "Best", "Top", "New"] as const
type Sort = typeof SORTS[number]

const CATEGORIES = ["Infrastructure", "Health", "Education", "Environment", "Corruption", "Safety", "Rights", "Economy"]

export default function ForumPage() {
  const { session } = useAuth()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<Sort>("Best")
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ title: "", body: "", category: "Infrastructure" })

  async function loadProposals() {
    try {
      const res = await fetch("/api/forum/proposals")
      const data = (await res.json()) as { proposals?: Proposal[] }
      setProposals(data.proposals ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadProposals() }, [])

  async function submitProposal() {
    if (!form.title.trim() || !form.body.trim()) return
    setSubmitting(true)
    try {
      await fetch("/api/forum/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          author: session?.user?.name ?? "Anonymous Citizen",
        }),
      })
      setForm({ title: "", body: "", category: "Infrastructure" })
      setShowForm(false)
      await loadProposals()
    } finally {
      setSubmitting(false)
    }
  }

  async function vote(id: string, direction: "up" | "down") {
    const userId = session?.user?.id ?? "anonymous"
    await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, targetType: "proposal", targetId: id, value: direction === "up" ? 1 : -1 }),
    })
    await loadProposals()
  }

  const sorted = [...proposals].sort((a, b) => {
    if (sort === "Top") return b.votes - a.votes
    if (sort === "New") return 0
    if (sort === "Hot") return (b.votes - b.downvotes + b.comments.length * 2) - (a.votes - a.downvotes + a.comments.length * 2)
    return (b.votes - b.downvotes) - (a.votes - a.downvotes)
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Civic</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Voice Forum</h1>
        </div>
        <Button
          className="w-fit rounded-full"
          onClick={() => setShowForm(true)}
        >
          <Plus className="mr-1.5 size-4" />
          New Proposal
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <input
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Proposal title…"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="sm:col-span-2">
              <textarea
                className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                rows={5}
                placeholder="Describe your proposal in detail…"
                value={form.body}
                onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              />
            </div>
            <Select
              value={form.category}
              onValueChange={(value) =>
                setForm((f) => ({ ...f, category: value ?? "Infrastructure" }))
              }
            >
              <SelectTrigger className="rounded-xl border-border/60 bg-background">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              <X className="mr-1.5 size-4" />
              Cancel
            </Button>
            <Button onClick={() => void submitProposal()} disabled={submitting || !form.title.trim()}>
              {submitting ? "Submitting…" : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sort === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-5">
          {loading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />)
          ) : sorted.length === 0 ? (
            <Card className="rounded-2xl">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No proposals yet. Be the first to submit one!
              </CardContent>
            </Card>
          ) : (
            sorted.map((proposal) => (
              <Card key={proposal.id} className="rounded-3xl border-border/60 transition-all hover:border-primary/30 hover:shadow-sm">
                <CardHeader className="space-y-3 pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Badge variant="secondary" className="rounded-full">{proposal.category}</Badge>
                    {proposal.sortLabel && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Star className="size-3.5" weight="fill" />
                        {proposal.sortLabel}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight">{proposal.title}</h2>
                  <p className="text-sm text-muted-foreground">by {proposal.author}</p>
                  <p className="leading-relaxed text-foreground/90 text-sm">{proposal.body}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-full gap-1.5"
                      onClick={() => void vote(proposal.id, "up")}
                    >
                      <ArrowFatUp className="size-4" />
                      {proposal.votes}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                      onClick={() => void vote(proposal.id, "down")}
                    >
                      <ArrowFatDown className="size-4" />
                      {proposal.downvotes ?? 0}
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-1.5 text-muted-foreground">
                      <ChatCircle className="size-4" />
                      {proposal.comments.length} comments
                    </Button>
                  </div>

                  {proposal.comments.length > 0 && (
                    <div className="space-y-2 border-t border-border/50 pt-4">
                      {proposal.comments.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="rounded-2xl border border-border/60 bg-muted/30 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium">{comment.author}</p>
                            {comment.points != null && (
                              <p className="text-xs text-muted-foreground">{comment.points} AI pts</p>
                            )}
                          </div>
                          {comment.quoted && (
                            <div className="mt-2 rounded-xl border-l-2 border-primary/40 bg-background p-2.5 text-xs text-muted-foreground">
                              <Quotes className="mr-1 inline size-3" />
                              {comment.quoted}
                            </div>
                          )}
                          <p className="mt-2 text-sm leading-relaxed text-foreground/90">{comment.body}</p>
                          {comment.awards?.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {comment.awards.map((award) => (
                                <Badge key={award} variant="outline" className="rounded-full text-xs">{award}</Badge>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
      </div>
    </div>
  )
}
