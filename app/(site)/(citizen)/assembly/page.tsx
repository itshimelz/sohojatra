"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, Clock, MapPin, Users, ArrowRight, FileText } from "@phosphor-icons/react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"

interface AssemblyEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  organizer: string
  topic: string
  agenda?: string
  minutesUrl?: string
  status: "Upcoming" | "Ongoing" | "Completed"
  rsvps: string[]
}

const statusStyles: Record<string, string> = {
  Upcoming: "bg-blue-100 text-blue-700",
  Ongoing: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
}

export default function AssemblyEventsPage() {
  const t = useT().assembly
  const [events, setEvents] = useState<AssemblyEvent[]>([])
  const [filter, setFilter] = useState<"all" | "Upcoming" | "Ongoing" | "Completed">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 8

  const userId = useMemo(() => {
    if (typeof window === "undefined") return "anonymous"
    const existing = window.localStorage.getItem("sohojatra_user_id")
    if (existing) return existing
    const next = `citizen-${Math.random().toString(36).slice(2, 10)}`
    window.localStorage.setItem("sohojatra_user_id", next)
    return next
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/assembly/events", { cache: "no-store" })
        const data = (await res.json()) as { events?: AssemblyEvent[] }
        if (!cancelled) setEvents(Array.isArray(data.events) ? data.events : [])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const toggleRsvp = async (eventId: string) => {
    const res = await fetch(`/api/assembly/events/${eventId}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rsvp", userId }),
    })
    if (!res.ok) return
    const result = (await res.json()) as { rsvps?: string[] }
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === eventId && Array.isArray(result.rsvps)
          ? { ...ev, rsvps: result.rsvps }
          : ev
      )
    )
  }

  const filtered = filter === "all" ? events : events.filter((e) => e.status === filter)
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const counts = {
    Upcoming: events.filter((e) => e.status === "Upcoming").length,
    Ongoing: events.filter((e) => e.status === "Ongoing").length,
    Completed: events.filter((e) => e.status === "Completed").length,
  }

  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const filterOptions = [
    ["all", t.filterAll, events.length],
    ["Upcoming", t.filterUpcoming, counts.Upcoming],
    ["Ongoing", t.filterLive, counts.Ongoing],
    ["Completed", t.filterCompleted, counts.Completed],
  ] as const

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t.label}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.description}</p>
      </div>

      {/* Stats + filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filterOptions.map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {label} {(count as number) > 0 && <span className="ml-1 opacity-70">({count})</span>}
          </button>
        ))}
      </div>

      {/* Event list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t.noEvents}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {paginated.map((event) => {
            const isAttending = event.rsvps.includes(userId)
            return (
              <li key={event.id} className="group rounded-lg border-b border-border/60 px-1 py-4 transition-colors hover:bg-muted/40 last:border-b-0">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div>
                    <Badge className={statusStyles[event.status]}>{event.status}</Badge>
                    <h3 className="mt-2 text-base font-semibold leading-snug transition-colors group-hover:text-primary">{event.title}</h3>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{event.topic}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{event.organizer}</p>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <CalendarCheck className="size-3.5 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="size-3.5 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5 shrink-0" />
                      <span>{event.rsvps.length} {t.registered}</span>
                    </div>
                  </div>

                  {event.agenda && (
                    <div className="rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <p className="font-medium text-foreground/80">{t.agenda}</p>
                      <p className="text-muted-foreground">{event.agenda}</p>
                    </div>
                  )}

                  <div className="mt-auto flex gap-2">
                    {event.status === "Completed" && event.minutesUrl ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-full"
                        onClick={() => window.open(event.minutesUrl, "_blank", "noopener,noreferrer")}
                      >
                        <FileText className="mr-1.5 size-4" />
                        {t.viewMinutes}
                      </Button>
                    ) : event.status !== "Completed" ? (
                      <Button
                        size="sm"
                        variant={isAttending ? "outline" : "default"}
                        className="flex-1 rounded-full"
                        onClick={() => void toggleRsvp(event.id)}
                      >
                        {isAttending ? t.cancelRsvp : t.registerRsvp}
                      </Button>
                    ) : (
                      <p className="text-xs text-muted-foreground">{t.minutesNotPublished}</p>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {!isLoading && filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {safePage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
