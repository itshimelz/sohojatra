/**
 * GET /api/ai/warm — Server-side ping to the external AI service `/health`.
 * Used to wake Render (or similar) free-tier instances before heavier routes like POST /api/analyze.
 * The upstream base URL stays server-only (`RAILWAY_AI_URL`).
 */
import { NextResponse } from "next/server"

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL ?? ""
/** Render cold starts can exceed 15s; keep this generous for free tier */
const WARM_TIMEOUT_MS = 45_000

export async function GET() {
  if (!RAILWAY_AI_URL) {
    return NextResponse.json(
      { ok: false, message: "AI service not configured (RAILWAY_AI_URL missing)" },
      { status: 503 }
    )
  }

  const base = RAILWAY_AI_URL.replace(/\/$/, "")

  try {
    const upstream = await fetch(`${base}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
      cache: "no-store",
    })

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "")
      return NextResponse.json(
        { ok: false, message: "AI health check failed", status: upstream.status, detail },
        { status: 502 }
      )
    }

    const body = await upstream.json().catch(() => ({}))
    return NextResponse.json({ ok: true, upstream: body })
  } catch {
    return NextResponse.json(
      { ok: false, message: "AI service unreachable (cold start may still be in progress)" },
      { status: 502 }
    )
  }
}
