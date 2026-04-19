"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarCheck, Clock, MapPin, Users, ArrowRight, FileText } from "@phosphor-icons/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
  const counts = {
    Upcoming: events.filter((e) => e.status === "Upcoming").length,
    Ongoing: events.filter((e) => e.status === "Ongoing").length,
    Completed: events.filter((e) => e.status === "Completed").length,
  }

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
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t.noEvents}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => {
            const isAttending = event.rsvps.includes(userId)
            return (
              <Card key={event.id} className="rounded-2xl flex flex-col transition-all hover:border-primary/30 hover:shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <Badge className={statusStyles[event.status]}>{event.status}</Badge>
                    <p className="text-xs text-muted-foreground">{event.organizer}</p>
                  </div>
                  <CardTitle className="mt-2 text-base leading-snug">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.topic}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
