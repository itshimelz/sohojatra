/**
 * POST /api/concerns — Create a new civic concern.
 *
 * SECURITY:
 *   - Requires authenticated session (401 if missing).
 *   - Author identity is extracted from the session, NOT the request body.
 *   - Prevents identity spoofing by ignoring client-supplied authorName.
 *
 * GET /api/concerns — List all concerns (public, no auth required).
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { createConcern, listConcerns } from "@/lib/sohojatra/store"

// GET is public — anyone can view concerns
export async function GET() {
  return NextResponse.json({ concerns: await listConcerns() })
}

export async function POST(request: Request) {
  // ── Auth Guard: Reject unauthenticated users ─────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = await request.json()

  // ── Identity from session, NOT body ──────────────────────
  // The authorName comes from the verified session, preventing
  // any client from faking who submitted the concern.
  const concern = await createConcern({
    title: body.title,
    description: body.description,
    authorName: session.userName,
    locationLat: Number(body.locationLat),
    locationLng: Number(body.locationLng),
    location: body.location,
    photos: Array.isArray(body.photos) ? body.photos : [],
  })

  return NextResponse.json({ concern }, { status: 201 })
}