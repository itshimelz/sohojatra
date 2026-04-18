/**
 * POST /api/ai/bangla-nlp — Bangla text NLP analysis.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { banglaNlpAnalyze } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const session = await requireRole(request, ["moderator", "admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as { text?: string }
  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  return NextResponse.json({ analysis: banglaNlpAnalyze(body.text) })
}
