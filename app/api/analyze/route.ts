/**
 * POST /api/analyze — Proxy to the Railway AI microservice /analyze endpoint.
 *
 * Forwards {text, user_id} to the FastAPI service and returns
 * {sentiment, urgency, language}.  Falls back to a 503 if the
 * Railway URL is not configured (RAILWAY_AI_URL env var).
 */
import { NextResponse } from "next/server"
import { z } from "zod"

import { requireRole } from "@/lib/api-guard"

const schema = z.object({
  text: z.string().trim().min(1).max(4096),
  user_id: z.string().min(1),
})

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL ?? ""

export async function POST(request: Request) {
  const session = await requireRole(request, [
    "citizen",
    "expert",
    "moderator",
    "admin",
    "superadmin",
  ])
  if (session instanceof Response) return session

  if (!RAILWAY_AI_URL) {
    return NextResponse.json(
      { message: "AI service not configured (RAILWAY_AI_URL missing)" },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsed.error.issues },
      { status: 400 }
    )
  }

  let upstream: Response
  try {
    upstream = await fetch(`${RAILWAY_AI_URL.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(15_000),
    })
  } catch {
    return NextResponse.json(
      { message: "AI service unreachable" },
      { status: 502 }
    )
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "")
    return NextResponse.json(
      { message: "AI service error", detail },
      { status: 502 }
    )
  }

  const data = await upstream.json()
  return NextResponse.json(data)
}
