/**
 * POST /api/ai/sentiment — Analyze text sentiment.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { sentiment } from "@/lib/sohojatra/ai"
import { z } from "zod"

const sentimentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Text is required for sentiment analysis.")
    .max(2000),
})

export async function POST(request: Request) {
  const session = await requireRole(request, [
    "moderator",
    "admin",
    "superadmin",
  ])
  if (session instanceof Response) return session

  const body = await request.json().catch(() => ({}))
  const parsedBody = sentimentSchema.safeParse(body)

  if (!parsedBody.success) {
    return NextResponse.json(
      { message: "Validation error", errors: parsedBody.error.issues },
      { status: 400 }
    )
  }

  return NextResponse.json(sentiment(parsedBody.data.text))
}
