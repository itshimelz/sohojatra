/**
 * POST /api/concerns/sync — Sync offline concern drafts from mobile devices.
 *
 * SECURITY:
 *   - Requires authenticated session (401 if missing).
 *   - The deviceId is informational only; the user is identified by session.
 */
import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-session"
import { z } from "zod"

const syncSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  concerns: z.array(z.unknown()),
  videos: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
  voiceNotes: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
})

import { requireSession } from "@/lib/api-guard"

export async function POST(request: Request) {
  try {
    // ── Auth Guard: Only logged-in users can sync drafts ─────
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const body = await request.json()
    const validatedBody = syncSchema.parse(body)

    if (!validatedBody.deviceId || !Array.isArray(validatedBody.concerns)) {
      return NextResponse.json(
        { error: "deviceId and concerns[] are required" },
        { status: 400 }
      )
    }

    // TODO: Actually persist synced data here.
    return NextResponse.json({
      synced: validatedBody.concerns.length,
      voiceNotes: validatedBody.voiceNotes?.length ?? 0,
      videos: validatedBody.videos?.length ?? 0,
      status: "ok",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[API_CONCERNS_SYNC]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
