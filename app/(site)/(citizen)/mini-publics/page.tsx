"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Users, ArrowClockwise, PlusCircle, MagnifyingGlass } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  _count: { members: number; rounds: number }
}

const STATUS_COLOR: Record<string, string> = {
  Forming: "bg-blue-100 text-blue-800",
  Deliberating: "bg-yellow-100 text-yellow-800",
  Complete: "bg-purple-100 text-purple-800",
  Published: "bg-green-100 text-green-800",
}

const STATUSES = ["All", "Forming", "Deliberating", "Complete", "Published"]

export default function MiniPublicsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"list" | "create">("list")
  const [miniPublics, setMiniPublics] = useState<MiniPublic[]>([])
  const [total, setTotal] = useState(0)
  const [filterStatus, setFilterStatus] = useState("All")
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ title: "", topic: "", summary: "", concernId: "", panelSize: 12 })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const fetchList = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterStatus !== "All") params.set("status", filterStatus)
    const res = await fetch(`/api/mini-publics?${params}`)
    const data = await res.json()
    setMiniPublics(data.miniPublics ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [filterStatus])

  useEffect(() => { if (tab === "list") fetchList() }, [tab, fetchList])

  const handleCreate = async () => {
    if (!form.title.trim() || !form.topic.trim() || !form.summary.trim()) return
    setCreating(true)
    setCreateError("")
    try {
      const res = await fetch("/api/mini-publics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          topic: form.topic.trim(),
          summary: form.summary.trim(),
          concernId: form.concernId.trim() || undefined,
          panelSize: form.panelSize,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error ?? "Failed"); return }
      router.push(`/mini-publics/${data.miniPublic.id}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="size-6 text-primary" weight="duotone" />
          <h1 className="text-2xl font-bold">Deliberative Mini-Publics</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Randomly selected citizen panels deliberate on civic topics through structured rounds, producing public recommendations backed by community voice.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-1">
        {(["list", "create"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "list" ? "Browse Panels" : "Create Panel"}
          </button>
        ))}
      </div>

      {tab === "list" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-md border px-3 py-1.5 text-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <Button variant="outline" size="sm" onClick={fetchList} disabled={loading}>
              <ArrowClockwise className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">{total} panels</span>
          </div>

          {miniPublics.length === 0 && !loading ? (
            <div className="text-center py-16 space-y-3">
              <MagnifyingGlass className="size-10 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground text-sm">No mini-publics found. Create the first one.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {miniPublics.map((mp) => (
                <Card
                  key={mp.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/mini-publics/${mp.id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold leading-snug">{mp.title}</CardTitle>
                      <span className={`shrink-0 text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_COLOR[mp.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {mp.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">{mp.summary}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>{mp._count.members}/{mp.panelSize} members</span>
                      <span>{mp._count.rounds} round{mp._count.rounds !== 1 ? "s" : ""}</span>
                      {mp.publishedAt && <span>Published {new Date(mp.publishedAt).toLocaleDateString()}</span>}
                    </div>
                    {mp.recommendation && (
                      <p className="text-xs bg-green-50 border border-green-200 rounded p-2 text-green-800 line-clamp-2">
                        {mp.recommendation}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PlusCircle className="size-4" />
              Create a Mini-Public
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Title</label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="e.g., Water Access Reform Citizens' Panel"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Topic (central question)</label>
              <input
                className="w-full rounded-md border px-3 py-1.5 text-sm"
                placeholder="e.g., How should Dhaka address chronic water shortages in informal settlements?"
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Summary (context for panel members)</label>
              <textarea
                className="w-full rounded-md border px-3 py-1.5 text-sm min-h-[80px] resize-y"
                placeholder="Provide background information, relevant data, and framing for deliberators…"
                value={form.summary}
                onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Panel Size</label>
                <input
                  type="number"
                  min={3}
                  max={50}
                  className="w-full rounded-md border px-3 py-1.5 text-sm"
                  value={form.panelSize}
                  onChange={(e) => setForm((f) => ({ ...f, panelSize: parseInt(e.target.value) || 12 }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Concern ID (optional)</label>
                <input
                  className="w-full rounded-md border px-3 py-1.5 text-sm font-mono"
                  placeholder="clxyz123…"
                  value={form.concernId}
                  onChange={(e) => setForm((f) => ({ ...f, concernId: e.target.value }))}
                />
              </div>
            </div>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
            <Button onClick={handleCreate} disabled={creating || !form.title.trim() || !form.topic.trim() || !form.summary.trim()}>
              {creating ? <ArrowClockwise className="size-4 animate-spin mr-2" /> : null}
              Create Panel
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
