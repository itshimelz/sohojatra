/**
 * POST /api/ai/classify-crime — Classify text for crime flags.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { classifyCrime } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const session = await requireRole(request, ["moderator", "admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ flags: classifyCrime(String(body.text ?? "")) })
}