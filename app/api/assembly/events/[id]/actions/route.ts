/**
 * POST /api/assembly/events/[id]/actions — RSVP or publish minutes.
 *
 * SECURITY:
 *   - rsvp: Requires authenticated session. userId from session.
 *   - publishMinutes: Requires admin+ role (RBAC).
 *     actorName from session.
 */
import { NextResponse } from "next/server"

import { requireSession, requireRole } from "@/lib/api-guard"
import {
  publishAssemblyMinutes,
  rsvpAssemblyEvent,
} from "@/lib/sohojatra/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    action?: "rsvp" | "publishMinutes"
    minutesUrl?: string
  }

  if (body.action === "rsvp") {
    // ── Auth: Any citizen can RSVP ─────────────────────────
    const session = await requireSession(request)
    if (session instanceof Response) return session

    // userId from session, not body
    const result = await rsvpAssemblyEvent({
      eventId,
      userId: session.userId,
    })
    if (!result)
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    return NextResponse.json(result)
  }

  if (body.action === "publishMinutes") {
    // ── RBAC: Only admin+ can publish minutes ──────────────
    const session = await requireRole(request, ["admin", "superadmin"])
    if (session instanceof Response) return session

    if (!body.minutesUrl) {
      return NextResponse.json(
        { error: "minutesUrl is required" },
        { status: 400 }
      )
    }
    // actorName from session
    const updated = await publishAssemblyMinutes({
      eventId,
      minutesUrl: body.minutesUrl,
      actorName: session.userName,
    })
    if (!updated)
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
