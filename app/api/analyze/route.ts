/**
 * POST /api/analyze — Proxy to the Railway AI microservice /analyze endpoint.
 *
 * Forwards {text, user_id} to the FastAPI service and returns
 * {sentiment, urgency, language}. Falls back to 503 if `RAILWAY_AI_URL` is missing.
 * Public pages may call this route; cache keys use the session user id when present.
 */
import { NextResponse } from "next/server"
import { createHash } from "node:crypto"
import { z } from "zod"

import { optionalSession } from "@/lib/api-guard"

const schema = z.object({
  text: z.string().trim().min(1).max(4096),
  user_id: z.string().min(1),
})

const RAILWAY_AI_URL = process.env.RAILWAY_AI_URL ?? ""
const AI_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const AI_CACHE_MAX_ITEMS = 1000
const aiAnalyzeCache = new Map<string, { expiresAt: number; data: unknown }>()

function makeCacheKey(userId: string, text: string) {
  const digest = createHash("sha256").update(text).digest("hex")
  return `${userId}:${digest}`
}

function getCachedAnalyze(key: string) {
  const entry = aiAnalyzeCache.get(key)
  if (!entry) return null
  if (Date.now() >= entry.expiresAt) {
    aiAnalyzeCache.delete(key)
    return null
  }
  return entry.data
}

function setCachedAnalyze(key: string, data: unknown) {
  if (aiAnalyzeCache.size >= AI_CACHE_MAX_ITEMS) {
    const oldestKey = aiAnalyzeCache.keys().next().value as string | undefined
    if (oldestKey) aiAnalyzeCache.delete(oldestKey)
  }
  aiAnalyzeCache.set(key, {
    expiresAt: Date.now() + AI_CACHE_TTL_MS,
    data,
  })
}

export async function POST(request: Request) {
  // Public concern pages call this from the browser; guests must be allowed to
  // proxy analyze so Render sees traffic. Identity is only used for server cache partitioning.
  const session = await optionalSession()
  const userIdForCache = session?.userId ?? "anonymous"

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

  const cacheKey = makeCacheKey(userIdForCache, parsed.data.text)
  const cached = getCachedAnalyze(cacheKey)
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-AI-Cache": "HIT" },
    })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${RAILWAY_AI_URL.replace(/\/$/, "")}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(45_000),
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
  setCachedAnalyze(cacheKey, data)
  return NextResponse.json(data, {
    headers: { "X-AI-Cache": "MISS" },
  })
}
