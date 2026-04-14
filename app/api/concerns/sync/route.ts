import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth-session"
import { z } from "zod"

const syncSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  concerns: z.array(z.unknown()),
  videos: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
  voiceNotes: z.array(z.object({ id: z.string(), url: z.string().url() })).optional().default([]),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedBody = syncSchema.parse(body)

    // TODO: Actually persist synced data here.
    return NextResponse.json({
      synced: validatedBody.concerns.length,
      voiceNotes: validatedBody.voiceNotes.length,
      videos: validatedBody.videos.length,
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
