/**
 * POST /api/concerns/sync — Sync offline concern drafts from mobile devices.
 *
 * SECURITY:
 *   - Requires authenticated session (401 if missing).
 *   - The deviceId is informational only; the user is identified by session.
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireSession } from "@/lib/api-guard"
import { createConcern } from "@/lib/sohojatra/store"

const concernDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  locationLat: z.number(),
  locationLng: z.number(),
  location: z.string().optional(),
  photos: z.array(z.string()).optional().default([]),
})

const syncSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  concerns: z.array(z.unknown()),
  videos: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
  voiceNotes: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
})

export async function POST(request: Request) {
  try {
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

    let persisted = 0
    let failed = 0
    const errors: string[] = []

    for (const rawConcern of validatedBody.concerns) {
      const parsed = concernDraftSchema.safeParse(rawConcern)
      if (!parsed.success) {
        failed++
        errors.push(parsed.error.issues[0]?.message ?? "invalid concern")
        continue
      }

      try {
        await createConcern({
          title: parsed.data.title,
          description: parsed.data.description,
          authorName: session.userName,
          authorId: session.userId,
          locationLat: parsed.data.locationLat,
          locationLng: parsed.data.locationLng,
          location: parsed.data.location,
          photos: parsed.data.photos,
        })
        persisted++
      } catch {
        failed++
        errors.push(`Failed to persist concern: ${parsed.data.title}`)
      }
    }

    return NextResponse.json({
      synced: persisted,
      failed,
      voiceNotes: validatedBody.voiceNotes?.length ?? 0,
      videos: validatedBody.videos?.length ?? 0,
      status: failed === 0 ? "ok" : "partial",
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[API_CONCERNS_SYNC]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
