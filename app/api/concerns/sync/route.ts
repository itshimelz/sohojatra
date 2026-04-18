/**
 * POST /api/concerns/sync — Sync offline concern drafts from mobile devices.
 *
 * SECURITY:
 *   - Requires authenticated session (401 if missing).
 *   - The deviceId is informational only; the user is identified by session.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"

export async function POST(request: Request) {
  // ── Auth Guard: Only logged-in users can sync drafts ─────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    deviceId?: string
    concerns?: unknown[]
    videos?: Array<{ id: string; url: string }>
    voiceNotes?: Array<{ id: string; url: string }>
  }

  if (!body.deviceId || !Array.isArray(body.concerns)) {
    return NextResponse.json(
      { error: "deviceId and concerns[] are required" },
      { status: 400 }
    )
  }

  return NextResponse.json({
    synced: body.concerns.length,
    voiceNotes: Array.isArray(body.voiceNotes) ? body.voiceNotes.length : 0,
    videos: Array.isArray(body.videos) ? body.videos.length : 0,
    status: "ok",
  })
}
