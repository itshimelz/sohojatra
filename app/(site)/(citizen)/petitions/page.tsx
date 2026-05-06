"use client"

import { useEffect, useState } from "react"
import {
  HandFist,
  PlusCircle,
  Users,
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

const THRESHOLDS = [
  { count: 500, label: "Formal Acknowledgment", color: "bg-blue-500" },
  { count: 5_000, label: "Official Response", color: "bg-amber-500" },
  { count: 50_000, label: "Legislative Debate", color: "bg-orange-500" },
  { count: 500_000, label: "National Policy Review", color: "bg-red-500" },
]

const AUTHORITIES = [
  "Dhaka City Corporation (DNCC/DSCC)",
  "Union Parishad",
  "Upazila Parishad",
  "Zila Parishad",
  "Jatiya Sangsad (Parliament)",
  "Ministry of Local Government",
  "Ministry of Health",
  "Ministry of Education",
  "Ministry of Environment",
  "Anti-Corruption Commission",
]

type Petition = {
  id: string
  title: string
  body: string
  authorName: string
  targetAuthority: string
  category: string
  status: string
  signatureCount: number
  createdAt: string
  expiresAt: string | null
}

function ProgressBar({ count }: { count: number }) {
  const next = THRESHOLDS.find((t) => count < t.count)
  const prev = [...THRESHOLDS].reverse().find((t) => count >= t.count)
  const pct = next ? Math.min(100, Math.round((count / next.count) * 100)) : 100
  const color = next?.color ?? "bg-green-500"

  return (
    <div className="mt-2">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{count.toLocaleString()} signatures</span>
        {next && <span>Next: {next.count.toLocaleString()} → {next.label}</span>}
        {!next && <span className="text-green-600 dark:text-green-400">All thresholds reached!</span>}
      </div>
    </div>
  )
}

export default function PetitionsPage() {
  const { session } = useAuth()
  const [petitions, setPetitions] = useState<Petition[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<"recent" | "signatures">("signatures")
  const [showForm, setShowForm] = useState(false)
  const [signing, setSigning] = useState<string | null>(null)
  const [signed, setSigned] = useState<Set<string>>(new Set())

  // Form state
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [authority, setAuthority] = useState(AUTHORITIES[0])
  const [category, setCategory] = useState("Governance")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/petitions?sort=${sort}`)
      .then((r) => r.json())
      .then((d) => setPetitions(d.petitions ?? []))
      .finally(() => setLoading(false))
  }, [sort])

  async function handleSign(id: string) {
    if (!session) { toast.error("Please sign in to sign petitions"); return }
    setSigning(id)
    try {
      const res = await fetch(`/api/petitions/${id}/sign`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSigned((s) => new Set([...s, id]))
      setPetitions((ps) => ps.map((p) => p.id === id ? { ...p, signatureCount: data.signatureCount } : p))
      toast.success("Petition signed!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign")
    } finally {
      setSigning(null)
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!session) { toast.error("Sign in required"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/petitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, targetAuthority: authority, category }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setPetitions((ps) => [data.petition, ...ps])
      setTitle(""); setBody(""); setShowForm(false)
      toast.success("Petition created!")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create petition")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 text-xs">
              <HandFist className="size-3" />
              Binding Thresholds
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Citizen Petitions</h1>
          <p className="mt-1 max-w-lg text-muted-foreground">
            Cross a signature threshold and government must respond. From formal acknowledgment at
            500 signatures to national policy review at 500,000.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={buttonVariants({ variant: "default" })}
        >
          <PlusCircle className="mr-2 size-4" />
          Start a Petition
        </button>
      </div>

      {/* Threshold legend */}
      <div className="mb-6 grid gap-2 sm:grid-cols-4">
        {THRESHOLDS.map((t) => (
          <div key={t.count} className="rounded-lg border border-border bg-card p-3 text-center">
            <p className={`text-lg font-bold ${t.color.replace("bg-", "text-")}`}>
              {t.count >= 1000 ? `${t.count / 1000}K` : t.count}
            </p>
            <p className="text-xs text-muted-foreground">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Create a New Petition</h2>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={10} maxLength={200}
              placeholder="Clear, specific petition title…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Body / Reasoning</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} required minLength={50} rows={5}
              placeholder="Explain why this petition matters and what specific action you are demanding…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Target Authority</label>
              <select value={authority} onChange={(e) => setAuthority(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                {AUTHORITIES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Infrastructure, Rights, Environment…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className={buttonVariants({ variant: "default" })}>
              {submitting ? "Creating…" : "Publish Petition"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className={buttonVariants({ variant: "outline" })}>Cancel</button>
          </div>
        </form>
      )}

      {/* Sort controls */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sort:</span>
        {(["signatures", "recent"] as const).map((s) => (
          <button key={s} onClick={() => setSort(s)}
            className={buttonVariants({ variant: sort === s ? "secondary" : "ghost", size: "sm" })}>
            {s === "signatures" ? "Most Signed" : "Most Recent"}
          </button>
        ))}
      </div>

      {/* Petition list */}
      {loading ? (
        <p className="py-8 text-center text-muted-foreground animate-pulse">Loading petitions…</p>
      ) : petitions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <HandFist className="mx-auto mb-3 size-10 text-muted-foreground/40" />
          <p className="font-medium">No petitions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to start a petition for change.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {petitions.map((petition) => {
            const isSigned = signed.has(petition.id)
            const isExpired = petition.expiresAt && new Date(petition.expiresAt) < new Date()
            const currentThreshold = [...THRESHOLDS].reverse().find((t) => petition.signatureCount >= t.count)

            return (
              <li key={petition.id} className="rounded-xl border border-border bg-card p-5 hover:bg-muted/20 transition-colors">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">{petition.category}</Badge>
                      {currentThreshold && (
                        <Badge className={`text-xs text-white ${currentThreshold.color}`}>
                          <CheckCircle className="mr-1 size-3" weight="fill" />
                          {currentThreshold.label} Triggered
                        </Badge>
                      )}
                      {isExpired && <Badge variant="secondary" className="text-xs">Expired</Badge>}
                    </div>
                    <Link
                      href={`/petitions/${petition.id}`}
                      className="block text-lg font-semibold hover:text-primary transition-colors"
                    >
                      {petition.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{petition.body}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="size-3.5" />
                        {petition.targetAuthority}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {new Date(petition.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <ProgressBar count={petition.signatureCount} />
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2 sm:ml-4">
                    <p className="text-2xl font-bold">{petition.signatureCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">signatures</p>
                    {!isSigned && !isExpired && petition.status === "Active" ? (
                      <button
                        onClick={() => handleSign(petition.id)}
                        disabled={signing === petition.id}
                        className={buttonVariants({ variant: "default", size: "sm" })}
                      >
                        {signing === petition.id ? "Signing…" : "Sign Petition"}
                      </button>
                    ) : isSigned ? (
                      <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400 font-medium">
                        <CheckCircle className="size-4" weight="fill" />
                        Signed
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
