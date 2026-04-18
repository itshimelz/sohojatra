/**
 * POST /api/ai/detect-mob — Detect mob/astroturfing signals.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { detectMob } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const session = await requireRole(request, ["moderator", "admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  return NextResponse.json(detectMob(String(body.signal ?? body.text ?? "")))
}