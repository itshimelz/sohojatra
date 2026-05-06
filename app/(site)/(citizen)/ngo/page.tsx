"use client"

import { useEffect, useState, useCallback } from "react"
import {
  HandHeart,
  Globe,
  MagnifyingGlass,
  Trophy,
  Plus,
  ArrowRight,
  CheckCircle,
  Buildings,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ngo {
  id: string
  name: string
  description: string
  focusAreas: string[]
  district?: string
  division?: string
  website?: string
  contactEmail?: string
  status: string
  verifiedAt?: string
  totalAdoptions: number
  impactScore: number
  _count?: { adoptions: number }
}

type Tab = "directory" | "leaderboard" | "register"

const BD_DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
  "Gazipur", "Narayanganj", "Comilla", "Noakhali", "Jessore", "Bogra",
]

const FOCUS_AREAS = [
  "Education", "Health", "Environment", "Women Empowerment", "Child Rights",
  "Disaster Relief", "Legal Aid", "Poverty Alleviation", "Agriculture", "Youth Development",
]

// ─── NGO Card ─────────────────────────────────────────────────────────────────

function NgoCard({ ngo }: { ngo: Ngo }) {
  const areas = Array.isArray(ngo.focusAreas) ? ngo.focusAreas as string[] : []

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {ngo.verifiedAt && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <CheckCircle className="size-3" /> Verified
                </span>
              )}
              {ngo.district && (
                <Badge variant="outline" className="text-xs">{ngo.district}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug">{ngo.name}</h3>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-primary">{Math.round(ngo.impactScore)}</p>
            <p className="text-xs text-muted-foreground">Impact</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{ngo.description}</p>

        <div className="flex flex-wrap gap-1 mb-3">
          {areas.slice(0, 3).map((a: string) => (
            <span key={a} className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
              {a}
            </span>
          ))}
          {areas.length > 3 && (
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              +{areas.length - 3}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <HandHeart className="size-3.5" /> {ngo.totalAdoptions} adoptions
          </span>
          {ngo.website && (
            <a
              href={ngo.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <Globe className="size-3" /> Website
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NgoPage() {
  const { session } = useAuth()
  const t = useT()

  const [tab, setTab] = useState<Tab>("directory")
  const [ngos, setNgos] = useState<Ngo[]>([])
  const [leaderboard, setLeaderboard] = useState<Ngo[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [filterDistrict, setFilterDistrict] = useState("")
  const [filterFocus, setFilterFocus] = useState("")

  // Register form
  const [regForm, setRegForm] = useState({
    name: "",
    registrationNo: "",
    description: "",
    focusAreas: [] as string[],
    district: "",
    division: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
  })
  const [regError, setRegError] = useState("")
  const [regSuccess, setRegSuccess] = useState(false)

  const fetchDirectory = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterDistrict) params.set("district", filterDistrict)
      if (filterFocus) params.set("focusArea", filterFocus)
      const r = await fetch(`/api/ngo/directory?${params}`)
      const data = await r.json()
      setNgos(data.ngos ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterDistrict, filterFocus])

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/ngo/directory?sortBy=impactScore")
      const data = await r.json()
      setLeaderboard(data.ngos ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === "directory") fetchDirectory()
    else if (tab === "leaderboard") fetchLeaderboard()
  }, [tab, fetchDirectory, fetchLeaderboard])

  const toggleFocusArea = (area: string) => {
    setRegForm((f) => ({
      ...f,
      focusAreas: f.focusAreas.includes(area)
        ? f.focusAreas.filter((a) => a !== area)
        : f.focusAreas.length < 5
          ? [...f.focusAreas, area]
          : f.focusAreas,
    }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError("")
    const r = await fetch("/api/ngo/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    })
    if (!r.ok) {
      const data = await r.json()
      setRegError(typeof data.error === "string" ? data.error : "Validation error")
      return
    }
    setRegSuccess(true)
    setTab("directory")
    fetchDirectory()
  }

  const filteredNgos = ngos.filter((n) =>
    search
      ? n.name.toLowerCase().includes(search.toLowerCase()) ||
        n.description.toLowerCase().includes(search.toLowerCase())
      : true
  )

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "directory", label: "NGO Directory", icon: <Buildings className="size-4" /> },
    { key: "leaderboard", label: "Impact Leaderboard", icon: <Trophy className="size-4" /> },
    { key: "register", label: "Register NGO", icon: <Plus className="size-4" /> },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HandHeart className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.nav.ngoDirectory}</h1>
            <p className="text-sm text-muted-foreground">{t.nav.ngoDirectoryDesc}</p>
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

      {/* Directory tab */}
      {tab === "directory" && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-48">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Search NGOs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
            >
              <option value="">All Districts</option>
              {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
            <select
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
              value={filterFocus}
              onChange={(e) => setFilterFocus(e.target.value)}
            >
              <option value="">All Focus Areas</option>
              {FOCUS_AREAS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>

          {regSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-500/10 p-3 text-green-700 text-sm">
              <CheckCircle className="size-4 shrink-0" />
              NGO registered successfully! It will appear after verification.
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : filteredNgos.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <HandHeart className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No NGOs found</p>
              <p className="text-sm text-muted-foreground mt-1">Register your NGO to appear here</p>
              <Button className="mt-4" variant="outline" onClick={() => setTab("register")}>
                Register NGO
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredNgos.map((n) => <NgoCard key={n.id} ngo={n} />)}
            </div>
          )}
        </div>
      )}

      {/* Leaderboard tab */}
      {tab === "leaderboard" && (
        <div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Trophy className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No NGOs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((n, idx) => {
                const areas = Array.isArray(n.focusAreas) ? n.focusAreas as string[] : []
                return (
                  <Card key={n.id} className={idx < 3 ? "border-primary/30" : ""}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        idx === 0 ? "bg-yellow-500/20 text-yellow-600" :
                        idx === 1 ? "bg-gray-300/30 text-gray-600" :
                        idx === 2 ? "bg-orange-500/20 text-orange-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        #{idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{n.name}</p>
                          {n.verifiedAt && <CheckCircle className="size-3.5 text-green-600 shrink-0" />}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {areas.slice(0, 2).map((a: string) => (
                            <span key={a} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{a}</span>
                          ))}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xl font-bold text-primary">{Math.round(n.impactScore)}</p>
                        <p className="text-xs text-muted-foreground">{n.totalAdoptions} adoptions</p>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Register tab */}
      {tab === "register" && (
        <div className="max-w-2xl">
          {!session ? (
            <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
              <HandHeart className="size-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="font-medium">Please log in to register an NGO</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <h2 className="font-semibold text-base">Register Your NGO</h2>
                <p className="text-sm text-muted-foreground">
                  Register your organization to connect with citizen concerns and build your impact profile.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Organization Name *</label>
                      <input
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={regForm.name}
                        onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Organization name"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Registration No.</label>
                      <input
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={regForm.registrationNo}
                        onChange={(e) => setRegForm((f) => ({ ...f, registrationNo: e.target.value }))}
                        placeholder="NGO Bureau / Joint Stock number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      value={regForm.description}
                      onChange={(e) => setRegForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your organization's mission and activities..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">
                      Focus Areas * (select up to 5)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {FOCUS_AREAS.map((area) => (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleFocusArea(area)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                            regForm.focusAreas.includes(area)
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {area}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        value={regForm.district}
                        onChange={(e) => setRegForm((f) => ({ ...f, district: e.target.value }))}
                      >
                        <option value="">Select district</option>
                        {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Contact Email</label>
                      <input
                        type="email"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={regForm.contactEmail}
                        onChange={(e) => setRegForm((f) => ({ ...f, contactEmail: e.target.value }))}
                        placeholder="contact@ngo.org"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Website</label>
                    <input
                      type="url"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      value={regForm.website}
                      onChange={(e) => setRegForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://your-ngo.org"
                    />
                  </div>

                  {regError && <p className="text-xs text-red-600">{regError}</p>}

                  <Button type="submit" className="w-full">
                    Register NGO
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
