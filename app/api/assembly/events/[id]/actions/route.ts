import { NextResponse } from "next/server"

import { publishAssemblyMinutes, rsvpAssemblyEvent } from "@/lib/sohojatra/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "rsvp" | "publishMinutes"
    userId?: string
    minutesUrl?: string
    actorName?: string
  }

  if (body.action === "rsvp") {
    if (!body.userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }
    const result = await rsvpAssemblyEvent({ eventId, userId: body.userId })
    if (!result) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json(result)
  }

  if (body.action === "publishMinutes") {
    if (!body.minutesUrl) {
      return NextResponse.json({ error: "minutesUrl is required" }, { status: 400 })
    }
    const updated = await publishAssemblyMinutes({
      eventId,
      minutesUrl: body.minutesUrl,
      actorName: body.actorName ?? "Government",
    })
    if (!updated) return NextResponse.json({ error: "Event not found" }, { status: 404 })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
