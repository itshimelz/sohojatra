import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    deviceId?: string
    concerns?: unknown[]
    videos?: Array<{ id: string; url: string }>
    voiceNotes?: Array<{ id: string; url: string }>
  }

  if (!body.deviceId || !Array.isArray(body.concerns)) {
    return NextResponse.json({ error: "deviceId and concerns[] are required" }, { status: 400 })
  }

  return NextResponse.json({
    synced: body.concerns.length,
    voiceNotes: Array.isArray(body.voiceNotes) ? body.voiceNotes.length : 0,
    videos: Array.isArray(body.videos) ? body.videos.length : 0,
    status: "ok",
  })
}
