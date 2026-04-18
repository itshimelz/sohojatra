/**
 * POST /api/ai/sentiment — Analyze text sentiment.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { sentiment } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const session = await requireRole(request, ["moderator", "admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  return NextResponse.json(sentiment(String(body.text ?? "")))
}