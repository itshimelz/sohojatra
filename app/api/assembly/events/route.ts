/**
 * GET/POST /api/assembly/events — List or create assembly events.
 *
 * SECURITY:
 *   - GET: Public (transparency).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only government authorities can schedule assembly events.
 *     organizer defaults to the session user's name.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { createAssemblyEvent, listAssemblyEvents } from "@/lib/sohojatra/store"

// GET is public — assembly events are public knowledge
export async function GET() {
  return NextResponse.json({ events: await listAssemblyEvents() })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can create events ──────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    title?: string
    date?: string
    time?: string
    location?: string
    topic?: string
    agenda?: string
    linkedConcernIds?: string[]
  }

  if (
    !body.title ||
    !body.date ||
    !body.time ||
    !body.location ||
    !body.topic
  ) {
    return NextResponse.json(
      {
        error: "title, date, time, location, topic are required",
      },
      { status: 400 }
    )
  }

  // ── organizer from session, not body ─────────────────────
  const event = await createAssemblyEvent({
    title: body.title,
    date: body.date,
    time: body.time,
    location: body.location,
    organizer: session.userName,
    topic: body.topic,
    agenda: body.agenda,
    linkedConcernIds: body.linkedConcernIds,
  })

  return NextResponse.json({ event }, { status: 201 })
}
