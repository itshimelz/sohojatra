"use client"

import { useEffect, useState, useCallback } from "react"
import { LinkSimple, ShieldCheck, ShieldWarning, MagnifyingGlass, ArrowClockwise } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

type AuditBlock = {
  id: string
  blockIndex: number
  hash: string
  prevHash: string
  eventType: string
  entityType: string
  entityId: string
  actorName?: string
  data: Record<string, unknown>
  timestamp: string
}

type VerifyResult = {
  valid: boolean
  chainLength: number
  issues: string[]
  verifiedAt: string
}

const EVENT_COLORS: Record<string, string> = {
  concern_submitted: "bg-blue-100 text-blue-800",
  concern_resolved: "bg-green-100 text-green-800",
  concern_rejected: "bg-red-100 text-red-800",
  vote_cast: "bg-purple-100 text-purple-800",
  proposal_approved: "bg-green-100 text-green-800",
  user_banned: "bg-red-100 text-red-800",
  budget_allocated: "bg-yellow-100 text-yellow-800",
  admin_action: "bg-orange-100 text-orange-800",
}

export default function AuditPage() {
  const [tab, setTab] = useState<"explorer" | "verify">("explorer")
  const [blocks, setBlocks] = useState<AuditBlock[]>([])
  const [total, setTotal] = useState(0)
  const [chainLength, setChainLength] = useState(0)
  const [page, setPage] = useState(1)
  const [filterEvent, setFilterEvent] = useState("All")
  const [filterEntity, setFilterEntity] = useState("All")
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchChain = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page) })
      if (filterEvent !== "All") params.set("eventType", filterEvent)
      if (filterEntity !== "All") params.set("entityType", filterEntity)
      const res = await fetch(`/api/audit/chain?${params}`)
      const data = await res.json()
      setBlocks(data.blocks ?? [])
      setTotal(data.total ?? 0)
      setChainLength(data.chainLength ?? 0)
    } finally {
      setLoading(false)
    }
  }, [page, filterEvent, filterEntity])

  const runVerify = async () => {
    setVerifying(true)
    try {
      const res = await fetch("/api/audit/verify")
      const data = await res.json()
      setVerifyResult(data)
    } finally {
      setVerifying(false)
    }
  }

  useEffect(() => { fetchChain() }, [fetchChain])

  const EVENT_TYPES = ["All", "concern_submitted", "concern_resolved", "concern_rejected",
    "vote_cast", "proposal_approved", "user_banned", "budget_allocated", "admin_action"]
  const ENTITY_TYPES = ["All", "concern", "proposal", "user", "budget", "project"]

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <LinkSimple className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Blockchain Audit Trail</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Tamper-proof SHA-256 hash-chained log of all civic events. Every action is immutably recorded and verifiable.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Chain Length</p>
          <p className="text-2xl font-bold">{chainLength + 1}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total Events</p>
          <p className="text-2xl font-bold">{total}</p>
        </Card>
        <Card className={`p-4 ${verifyResult ? (verifyResult.valid ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : ""}`}>
          <p className="text-xs text-muted-foreground">Chain Integrity</p>
          <p className={`text-lg font-bold ${verifyResult ? (verifyResult.valid ? "text-green-700" : "text-red-700") : "text-muted-foreground"}`}>
            {verifyResult ? (verifyResult.valid ? "Verified ✓" : "Tampered!") : "Not checked"}
          </p>
        </Card>
      </div>

      <div className="flex gap-2 border-b pb-1">
        {(["explorer", "verify"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "explorer" ? "Block Explorer" : "Verify Chain"}
          </button>
        ))}
      </div>

      {tab === "explorer" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <select className="rounded-md border px-3 py-1.5 text-sm" value={filterEvent} onChange={(e) => { setFilterEvent(e.target.value); setPage(1) }}>
              {EVENT_TYPES.map((e) => <option key={e}>{e}</option>)}
            </select>
            <select className="rounded-md border px-3 py-1.5 text-sm" value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }}>
              {ENTITY_TYPES.map((e) => <option key={e}>{e}</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={fetchChain} disabled={loading}>
              <ArrowClockwise className={`size-3 mr-1 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>

          {blocks.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground text-sm">No audit blocks yet. Events will appear here as they are recorded.</p>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <Card key={block.id} className="font-mono text-xs">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">#{block.blockIndex}</span>
                        <span className={`rounded-full px-2 py-0.5 font-sans text-xs ${EVENT_COLORS[block.eventType] ?? "bg-gray-100 text-gray-700"}`}>
                          {block.eventType}
                        </span>
                        <Badge variant="outline" className="font-sans text-xs">{block.entityType}</Badge>
                      </div>
                      <span className="text-muted-foreground font-sans">{new Date(block.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="space-y-1 text-muted-foreground">
                      <div className="flex gap-2">
                        <span className="shrink-0 text-green-600">hash:</span>
                        <span className="truncate">{block.hash}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="shrink-0">prev:</span>
                        <span className="truncate opacity-60">{block.prevHash}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between font-sans text-xs text-muted-foreground">
                      <span>Entity: <span className="font-medium text-foreground">{block.entityId}</span></span>
                      {block.actorName && <span>By: <span className="font-medium text-foreground">{block.actorName}</span></span>}
                    </div>

                    {Object.keys(block.data).length > 0 && (
                      <details className="text-muted-foreground">
                        <summary className="cursor-pointer font-sans text-xs hover:text-foreground">Payload</summary>
                        <pre className="mt-1 overflow-x-auto rounded bg-muted p-2 text-xs">{JSON.stringify(block.data, null, 2)}</pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-xs text-muted-foreground">Page {page} · {total} events</span>
            <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {tab === "verify" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                Chain Integrity Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recomputes every block's SHA-256 hash from scratch and validates the hash chain. Any tampered record will be detected.
              </p>

              <div className="rounded-lg bg-muted p-3 font-mono text-xs space-y-1">
                <p>Algorithm: <span className="text-green-600">SHA-256</span></p>
                <p>Input: <span className="text-muted-foreground">blockIndex + prevHash + timestamp + JSON(data)</span></p>
                <p>Genesis prevHash: <span className="text-muted-foreground">{"0".repeat(64)}</span></p>
              </div>

              <Button onClick={runVerify} disabled={verifying}>
                {verifying ? "Verifying…" : "Run Full Verification"}
              </Button>

              {verifyResult && (
                <div className={`rounded-lg border p-4 space-y-2 ${verifyResult.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-center gap-2">
                    {verifyResult.valid
                      ? <ShieldCheck className="size-5 text-green-600" weight="fill" />
                      : <ShieldWarning className="size-5 text-red-600" weight="fill" />}
                    <p className={`font-semibold ${verifyResult.valid ? "text-green-800" : "text-red-800"}`}>
                      {verifyResult.valid ? "Chain is valid — no tampering detected" : `Chain integrity FAILED — ${verifyResult.issues.length} issue(s) found`}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {verifyResult.chainLength} blocks verified · {new Date(verifyResult.verifiedAt).toLocaleString()}
                  </p>
                  {verifyResult.issues.length > 0 && (
                    <ul className="space-y-1">
                      {verifyResult.issues.map((issue, i) => (
                        <li key={i} className="text-xs text-red-700 font-mono">{issue}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
