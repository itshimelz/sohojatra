"use client"

import { useEffect, useState, useCallback } from "react"
import {
  CloudRain,
  House,
  Warning,
  MapPin,
  CheckCircle,
  SealWarning,
  ArrowRight,
  Plus,
} from "@phosphor-icons/react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { useT } from "@/lib/i18n/context"

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloodReport {
  id: string
  reporterName: string
  locationLat: number
  locationLng: number
  division: string
  district: string
  upazila?: string
  depthCm: number
  description?: string
  isVerified: boolean
  createdAt: string
}

interface DistrictAggregate {
  district: string
  reportCount: number
  avgDepthCm: number
  maxDepthCm: number
}

interface Shelter {
  id: string
  name: string
  division: string
  district: string
  upazila?: string
  locationLat: number
  locationLng: number
  capacity: number
  currentOccupied: number
  contactPhone?: string
  facilities: string[]
  isOpen: boolean
}

interface EmbankmentReport {
  id: string
  reporterName: string
  division: string
  district: string
  upazila?: string
  damageType: string
  severity: string
  description: string
  status: string
  createdAt: string
}

type Tab = "flood" | "shelters" | "embankment"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BD_DISTRICTS = [
  "Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh",
  "Gazipur", "Narayanganj", "Comilla", "Noakhali", "Jessore", "Bogra", "Dinajpur",
]

const BD_DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"]

function depthColor(cm: number) {
  if (cm >= 150) return "bg-red-500/10 text-red-600 border-red-200"
  if (cm >= 60) return "bg-orange-500/10 text-orange-600 border-orange-200"
  if (cm >= 20) return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
  return "bg-blue-500/10 text-blue-600 border-blue-200"
}

function severityColor(s: string) {
  switch (s) {
    case "Critical": return "bg-red-500/10 text-red-600 border-red-200"
    case "High": return "bg-orange-500/10 text-orange-600 border-orange-200"
    case "Medium": return "bg-yellow-500/10 text-yellow-700 border-yellow-200"
    default: return "bg-green-500/10 text-green-600 border-green-200"
  }
}

function occupancyPct(shelter: Shelter) {
  if (shelter.capacity === 0) return 0
  return Math.round((shelter.currentOccupied / shelter.capacity) * 100)
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClimatePage() {
  const { session } = useAuth()
  const t = useT()

  const [tab, setTab] = useState<Tab>("flood")
  const [floodReports, setFloodReports] = useState<FloodReport[]>([])
  const [districtAgg, setDistrictAgg] = useState<DistrictAggregate[]>([])
  const [shelters, setShelters] = useState<Shelter[]>([])
  const [embReports, setEmbReports] = useState<EmbankmentReport[]>([])
  const [loading, setLoading] = useState(false)
  const [filterDistrict, setFilterDistrict] = useState("")

  // Flood form
  const [showFloodForm, setShowFloodForm] = useState(false)
  const [floodForm, setFloodForm] = useState({
    locationLat: "",
    locationLng: "",
    division: "Dhaka",
    district: "Dhaka",
    upazila: "",
    depthCm: "",
    description: "",
    reporterName: session?.user?.name ?? "",
  })
  const [floodError, setFloodError] = useState("")

  // Embankment form
  const [showEmbForm, setShowEmbForm] = useState(false)
  const [embForm, setEmbForm] = useState({
    locationLat: "",
    locationLng: "",
    division: "Dhaka",
    district: "Dhaka",
    upazila: "",
    damageType: "Erosion",
    severity: "Medium",
    description: "",
    reporterName: session?.user?.name ?? "",
  })
  const [embError, setEmbError] = useState("")

  const fetchFlood = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterDistrict ? `?district=${filterDistrict}` : ""
      const r = await fetch(`/api/climate/flood-map${params}`)
      const data = await r.json()
      setFloodReports(data.reports ?? [])
      setDistrictAgg(data.districtAggregates ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterDistrict])

  const fetchShelters = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterDistrict ? `?district=${filterDistrict}` : ""
      const r = await fetch(`/api/climate/shelters${params}`)
      const data = await r.json()
      setShelters(data.shelters ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterDistrict])

  const fetchEmb = useCallback(async () => {
    setLoading(true)
    try {
      const params = filterDistrict ? `?district=${filterDistrict}` : ""
      const r = await fetch(`/api/climate/embankment/report${params}`)
      const data = await r.json()
      setEmbReports(data.reports ?? [])
    } finally {
      setLoading(false)
    }
  }, [filterDistrict])

  useEffect(() => {
    if (tab === "flood") fetchFlood()
    else if (tab === "shelters") fetchShelters()
    else fetchEmb()
  }, [tab, fetchFlood, fetchShelters, fetchEmb])

  const handleFloodSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFloodError("")
    const r = await fetch("/api/climate/flood-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...floodForm,
        locationLat: parseFloat(floodForm.locationLat),
        locationLng: parseFloat(floodForm.locationLng),
        depthCm: parseInt(floodForm.depthCm),
      }),
    })
    if (!r.ok) {
      const data = await r.json()
      setFloodError(JSON.stringify(data.error))
      return
    }
    setShowFloodForm(false)
    setFloodForm({ locationLat: "", locationLng: "", division: "Dhaka", district: "Dhaka", upazila: "", depthCm: "", description: "", reporterName: "" })
    fetchFlood()
  }

  const handleEmbSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmbError("")
    const r = await fetch("/api/climate/embankment/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...embForm,
        locationLat: parseFloat(embForm.locationLat),
        locationLng: parseFloat(embForm.locationLng),
      }),
    })
    if (!r.ok) {
      const data = await r.json()
      setEmbError(JSON.stringify(data.error))
      return
    }
    setShowEmbForm(false)
    fetchEmb()
  }

  const detectFloodLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setFloodForm((f) => ({
        ...f,
        locationLat: pos.coords.latitude.toFixed(6),
        locationLng: pos.coords.longitude.toFixed(6),
      }))
    })
  }

  const detectEmbLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
      setEmbForm((f) => ({
        ...f,
        locationLat: pos.coords.latitude.toFixed(6),
        locationLng: pos.coords.longitude.toFixed(6),
      }))
    })
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "flood", label: "Flood Depth Map", icon: <CloudRain className="size-4" /> },
    { key: "shelters", label: "Cyclone Shelters", icon: <House className="size-4" /> },
    { key: "embankment", label: "Embankment Damage", icon: <Warning className="size-4" /> },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CloudRain className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t.nav.climate}</h1>
            <p className="text-sm text-muted-foreground">{t.nav.climateDesc}</p>
          </div>
        </div>
      </div>

      {/* District filter + tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          value={filterDistrict}
          onChange={(e) => setFilterDistrict(e.target.value)}
        >
          <option value="">All Districts</option>
          {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
        </select>
      </div>

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

      {/* Flood tab */}
      {tab === "flood" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{floodReports.length} reports in the last 72 hours</p>
            <Button size="sm" onClick={() => setShowFloodForm((v) => !v)}>
              <Plus className="size-3.5 mr-1" /> Report Flooding
            </Button>
          </div>

          {showFloodForm && (
            <Card className="mb-6 border-blue-200">
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CloudRain className="size-4 text-primary" /> Submit Flood Depth Report
                </h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFloodSubmit} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Division</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={floodForm.division}
                        onChange={(e) => setFloodForm((f) => ({ ...f, division: e.target.value }))}
                      >
                        {BD_DIVISIONS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={floodForm.district}
                        onChange={(e) => setFloodForm((f) => ({ ...f, district: e.target.value }))}
                      >
                        {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={floodForm.locationLat}
                        onChange={(e) => setFloodForm((f) => ({ ...f, locationLat: e.target.value }))}
                        placeholder="23.8103"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={floodForm.locationLng}
                        onChange={(e) => setFloodForm((f) => ({ ...f, locationLng: e.target.value }))}
                        placeholder="90.4125"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => detectFloodLocation()}
                      >
                        <MapPin className="size-3.5 mr-1" /> Detect
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Flood Depth (cm) *</label>
                      <input
                        required
                        type="number"
                        min={1}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={floodForm.depthCm}
                        onChange={(e) => setFloodForm((f) => ({ ...f, depthCm: e.target.value }))}
                        placeholder="e.g. 45"
                      />
                    </div>
                    {!session && (
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name *</label>
                        <input
                          required
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          value={floodForm.reporterName}
                          onChange={(e) => setFloodForm((f) => ({ ...f, reporterName: e.target.value }))}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                      value={floodForm.description}
                      onChange={(e) => setFloodForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the flood situation..."
                    />
                  </div>
                  {floodError && <p className="text-xs text-red-600">{floodError}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Submit Report</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowFloodForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* District aggregates */}
          {districtAgg.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3">District Flood Summary</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {districtAgg.slice(0, 6).map((d) => (
                  <Card key={d.district} className={d.maxDepthCm >= 100 ? "border-red-200" : ""}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm">{d.district}</p>
                        <p className="text-xs text-muted-foreground">{d.reportCount} reports</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`text-xs ${depthColor(d.maxDepthCm)}`}>
                          Max {d.maxDepthCm}cm
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">Avg {d.avgDepthCm}cm</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Reports list */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : floodReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <CloudRain className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No flood reports in the last 72 hours</p>
            </div>
          ) : (
            <div className="space-y-2">
              {floodReports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${depthColor(r.depthCm)}`}>
                      {r.depthCm}cm
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{r.district}{r.upazila ? ` · ${r.upazila}` : ""}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {r.description ?? `Flood depth reported by ${r.reporterName}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {r.isVerified && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="size-3" /> Verified
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shelters tab */}
      {tab === "shelters" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">{shelters.length} shelters found</p>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : shelters.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <House className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No shelters found for this district</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shelters.map((s) => {
                const pct = occupancyPct(s)
                return (
                  <Card key={s.id} className={!s.isOpen ? "opacity-60" : ""}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm leading-snug">{s.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.district}{s.upazila ? ` · ${s.upazila}` : ""}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${s.isOpen ? "bg-green-500/10 text-green-600 border-green-200" : "bg-muted text-muted-foreground"}`}
                        >
                          {s.isOpen ? "Open" : "Closed"}
                        </Badge>
                      </div>

                      {/* Occupancy bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Occupancy</span>
                          <span>{s.currentOccupied}/{s.capacity} ({pct}%)</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>

                      {s.contactPhone && (
                        <p className="text-xs text-muted-foreground">
                          <span className="font-medium">Contact:</span> {s.contactPhone}
                        </p>
                      )}

                      {Array.isArray(s.facilities) && s.facilities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(s.facilities as string[]).map((f: string) => (
                            <span key={f} className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                              {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Embankment tab */}
      {tab === "embankment" && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{embReports.length} damage reports</p>
            <Button size="sm" variant="destructive" onClick={() => setShowEmbForm((v) => !v)}>
              <Plus className="size-3.5 mr-1" /> Report Damage
            </Button>
          </div>

          {showEmbForm && (
            <Card className="mb-6 border-orange-200">
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Warning className="size-4 text-orange-600" /> Report Embankment Damage
                </h3>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmbSubmit} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Damage Type *</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={embForm.damageType}
                        onChange={(e) => setEmbForm((f) => ({ ...f, damageType: e.target.value }))}
                      >
                        {["Erosion", "Breach", "Seepage", "Overtopping", "Subsidence", "Other"].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Severity *</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={embForm.severity}
                        onChange={(e) => setEmbForm((f) => ({ ...f, severity: e.target.value }))}
                      >
                        {["Low", "Medium", "High", "Critical"].map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Division</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        value={embForm.division}
                        onChange={(e) => setEmbForm((f) => ({ ...f, division: e.target.value }))}
                      >
                        {BD_DIVISIONS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">District</label>
                      <select
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                        value={embForm.district}
                        onChange={(e) => setEmbForm((f) => ({ ...f, district: e.target.value }))}
                      >
                        {BD_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Latitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        value={embForm.locationLat}
                        onChange={(e) => setEmbForm((f) => ({ ...f, locationLat: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Longitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        value={embForm.locationLng}
                        onChange={(e) => setEmbForm((f) => ({ ...f, locationLng: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => detectEmbLocation()}
                      >
                        <MapPin className="size-3.5 mr-1" /> Detect
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none resize-none"
                      value={embForm.description}
                      onChange={(e) => setEmbForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe the damage in detail..."
                    />
                  </div>
                  {!session && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Your Name *</label>
                      <input
                        required
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none"
                        value={embForm.reporterName}
                        onChange={(e) => setEmbForm((f) => ({ ...f, reporterName: e.target.value }))}
                      />
                    </div>
                  )}
                  {embError && <p className="text-xs text-red-600">{embError}</p>}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Submit Report</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowEmbForm(false)}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />)}
            </div>
          ) : embReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border py-20 text-center">
              <Warning className="size-12 text-muted-foreground/40 mb-4" />
              <p className="font-medium">No embankment damage reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {embReports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <Badge variant="outline" className={`text-xs ${severityColor(r.severity)}`}>
                            {r.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{r.damageType}</Badge>
                          <Badge variant="outline" className="text-xs">{r.status}</Badge>
                        </div>
                        <p className="text-sm font-medium">{r.district}{r.upazila ? ` · ${r.upazila}` : ""}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">by {r.reporterName}</p>
                      </div>
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
