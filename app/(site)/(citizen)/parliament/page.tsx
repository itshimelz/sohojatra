"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Scroll,
  MagnifyingGlass,
  ChatCircle,
  Users,
  CheckCircle,
  XCircle,
  MinusCircle,
  ArrowRight,
  CaretLeft,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type Bill = {
  id: string
  billNumber: string
  title: string
  ministry: string
  category: string
  status: string
  introducedDate: string
  summary: string
  plainSummary?: string
  tags: string[]
  _count: { comments: number; mpVotes: number }
}

type Mp = {
  id: string
  name: string
  constituency: string
  party: string
  division?: string
  _count: { billVotes: number }
}

type MpVote = {
  id: string
  vote: string
  mp: Mp
}

type Comment = {
  id: string
  authorName: string
  clauseRef?: string
  text: string
  createdAt: string
}

type BillDetail = Bill & {
  mpVotes: MpVote[]
  comments: Comment[]
}

const STATUS_COLORS: Record<string, string> = {
  Introduced: "bg-blue-100 text-blue-800",
  "In Committee": "bg-yellow-100 text-yellow-800",
  Passed: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
  Withdrawn: "bg-gray-100 text-gray-700",
}

const VOTE_ICON: Record<string, React.ReactNode> = {
  Aye: <CheckCircle className="size-4 text-green-500" weight="fill" />,
  Nay: <XCircle className="size-4 text-red-500" weight="fill" />,
  Abstain: <MinusCircle className="size-4 text-gray-400" weight="fill" />,
}

const CATEGORIES = ["All", "Finance", "Education", "Health", "Environment", "Agriculture", "ICT", "General"]
const STATUSES = ["All", "Introduced", "In Committee", "Passed", "Rejected", "Withdrawn"]

export default function ParliamentPage() {
  const [tab, setTab] = useState<"bills" | "mps">("bills")
  const [bills, setBills] = useState<Bill[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [mps, setMps] = useState<Mp[]>([])
  const [selectedBill, setSelectedBill] = useState<BillDetail | null>(null)
  const [commentText, setCommentText] = useState("")
  const [clauseRef, setClauseRef] = useState("")
  const [submittingComment, setSubmittingComment] = useState(false)

  const [billFilter, setBillFilter] = useState({ q: "", category: "All", status: "All" })
  const [mpFilter, setMpFilter] = useState({ q: "", party: "", division: "" })

  const fetchBills = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page) })
    if (billFilter.q) params.set("q", billFilter.q)
    if (billFilter.category !== "All") params.set("category", billFilter.category)
    if (billFilter.status !== "All") params.set("status", billFilter.status)
    const res = await fetch(`/api/parliament/bills?${params}`)
    const data = await res.json()
    setBills(data.bills ?? [])
    setTotal(data.total ?? 0)
  }, [page, billFilter])

  const fetchMps = useCallback(async () => {
    const params = new URLSearchParams()
    if (mpFilter.q) params.set("q", mpFilter.q)
    if (mpFilter.party) params.set("party", mpFilter.party)
    if (mpFilter.division) params.set("division", mpFilter.division)
    const res = await fetch(`/api/parliament/mps?${params}`)
    const data = await res.json()
    setMps(data.mps ?? [])
  }, [mpFilter])

  const fetchBillDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/parliament/bills/${id}`)
    const data = await res.json()
    setSelectedBill(data.bill ?? null)
  }, [])

  useEffect(() => {
    if (tab === "bills" && !selectedBill) fetchBills()
  }, [tab, fetchBills, selectedBill])

  useEffect(() => {
    if (tab === "mps") fetchMps()
  }, [tab, fetchMps])

  const submitComment = async () => {
    if (!selectedBill || !commentText.trim()) return
    setSubmittingComment(true)
    try {
      const res = await fetch(`/api/parliament/bills/${selectedBill.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText, clauseRef: clauseRef || undefined }),
      })
      if (res.ok) {
        setCommentText("")
        setClauseRef("")
        fetchBillDetail(selectedBill.id)
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  const passedCount = bills.filter((b) => b.status === "Passed").length
  const inCommitteeCount = bills.filter((b) => b.status === "In Committee").length

  if (selectedBill) {
    const ayeCount = selectedBill.mpVotes.filter((v) => v.vote === "Aye").length
    const nayCount = selectedBill.mpVotes.filter((v) => v.vote === "Nay").length
    const abstainCount = selectedBill.mpVotes.filter((v) => v.vote === "Abstain").length
    const totalVotes = selectedBill.mpVotes.length
    const passRate = totalVotes > 0 ? Math.round((ayeCount / totalVotes) * 100) : 0

    return (
      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" onClick={() => setSelectedBill(null)}>
          <CaretLeft className="mr-1 size-4" />
          Back to Bills
        </Button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">{selectedBill.billNumber}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_COLORS[selectedBill.status] ?? "bg-gray-100 text-gray-700"
              }`}
            >
              {selectedBill.status}
            </span>
            <Badge variant="outline">{selectedBill.category}</Badge>
          </div>
          <h1 className="text-2xl font-bold">{selectedBill.title}</h1>
          <p className="text-sm text-muted-foreground">{selectedBill.ministry}</p>
        </div>

        {selectedBill.plainSummary && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-blue-800">Plain Language Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-blue-900">{selectedBill.plainSummary}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Full Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{selectedBill.summary}</p>
          </CardContent>
        </Card>

        {selectedBill.mpVotes.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="size-4" />
                MP Voting Record ({totalVotes} votes)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-700">
                  <CheckCircle className="size-4" weight="fill" />
                  Aye: {ayeCount}
                </span>
                <span className="flex items-center gap-1 text-red-700">
                  <XCircle className="size-4" weight="fill" />
                  Nay: {nayCount}
                </span>
                <span className="flex items-center gap-1 text-gray-500">
                  <MinusCircle className="size-4" weight="fill" />
                  Abstain: {abstainCount}
                </span>
              </div>
              <div className="h-3 rounded-full overflow-hidden bg-muted flex">
                {ayeCount > 0 && (
                  <div
                    className="bg-green-500 h-full transition-all"
                    style={{ width: `${(ayeCount / totalVotes) * 100}%` }}
                  />
                )}
                {nayCount > 0 && (
                  <div
                    className="bg-red-500 h-full transition-all"
                    style={{ width: `${(nayCount / totalVotes) * 100}%` }}
                  />
                )}
                {abstainCount > 0 && (
                  <div
                    className="bg-gray-300 h-full transition-all"
                    style={{ width: `${(abstainCount / totalVotes) * 100}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{passRate}% voted Aye</p>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {selectedBill.mpVotes.map((v) => (
                  <div key={v.id} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                    <span className="font-medium">{v.mp.name}</span>
                    <span className="text-muted-foreground">{v.mp.constituency} · {v.mp.party}</span>
                    <span className="flex items-center gap-1">
                      {VOTE_ICON[v.vote]}
                      {v.vote}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ChatCircle className="size-4" />
              Citizen Comments ({selectedBill.comments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {selectedBill.comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>
              ) : (
                selectedBill.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border p-3 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{c.authorName}</span>
                      {c.clauseRef && <Badge variant="outline" className="text-xs">{c.clauseRef}</Badge>}
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm">{c.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="border-t pt-3 space-y-2">
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="Clause reference (e.g. Section 4.2) — optional"
                value={clauseRef}
                onChange={(e) => setClauseRef(e.target.value)}
              />
              <textarea
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="Share your view on this bill or a specific clause…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button size="sm" onClick={submitComment} disabled={submittingComment || !commentText.trim()}>
                {submittingComment ? "Posting…" : "Post Comment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Scroll className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Legislative Tracker</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Track bills, MP voting records, and participate in CrowdLaw consultations.
        </p>
      </div>

      <div className="flex gap-2 border-b pb-1">
        {(["bills", "mps"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "bills" ? "Bills & Acts" : "MP Directory"}
          </button>
        ))}
      </div>

      {tab === "bills" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Total Bills</p>
              <p className="text-2xl font-bold">{total}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">Passed</p>
              <p className="text-2xl font-bold text-green-600">{passedCount}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-muted-foreground">In Committee</p>
              <p className="text-2xl font-bold text-yellow-600">{inCommitteeCount}</p>
            </Card>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border pl-9 pr-3 py-1.5 text-sm"
                placeholder="Search bills…"
                value={billFilter.q}
                onChange={(e) => { setBillFilter((f) => ({ ...f, q: e.target.value })); setPage(1) }}
              />
            </div>
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={billFilter.category}
              onChange={(e) => { setBillFilter((f) => ({ ...f, category: e.target.value })); setPage(1) }}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={billFilter.status}
              onChange={(e) => { setBillFilter((f) => ({ ...f, status: e.target.value })); setPage(1) }}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          {bills.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No bills found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {bills.map((bill) => (
                <Card
                  key={bill.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fetchBillDetail(bill.id)}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-mono">{bill.billNumber}</p>
                        <p className="text-sm font-semibold leading-snug line-clamp-2">{bill.title}</p>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[bill.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {bill.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{bill.ministry}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{bill.summary}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ChatCircle className="size-3" />
                          {bill._count.comments}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="size-3" />
                          {bill._count.mpVotes}
                        </span>
                      </div>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page} · {total} bills
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page * 12 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {tab === "mps" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-md border pl-9 pr-3 py-1.5 text-sm"
                placeholder="Search by name or constituency…"
                value={mpFilter.q}
                onChange={(e) => setMpFilter((f) => ({ ...f, q: e.target.value }))}
              />
            </div>
            <input
              className="rounded-md border px-3 py-1.5 text-sm w-36"
              placeholder="Party filter"
              value={mpFilter.party}
              onChange={(e) => setMpFilter((f) => ({ ...f, party: e.target.value }))}
            />
            <input
              className="rounded-md border px-3 py-1.5 text-sm w-36"
              placeholder="Division filter"
              value={mpFilter.division}
              onChange={(e) => setMpFilter((f) => ({ ...f, division: e.target.value }))}
            />
          </div>

          {mps.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No MPs found.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mps.map((mp) => (
                <Card key={mp.id}>
                  <CardContent className="p-4 space-y-1">
                    <p className="font-semibold text-sm">{mp.name}</p>
                    <p className="text-xs text-muted-foreground">{mp.constituency}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="secondary" className="text-xs">{mp.party}</Badge>
                      <span className="text-xs text-muted-foreground">{mp._count.billVotes} votes recorded</span>
                    </div>
                    {mp.division && (
                      <p className="text-xs text-muted-foreground">{mp.division} Division</p>
                    )}
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
