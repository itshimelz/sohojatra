/**
 * POST /api/ai/mob-gnn — Graph Neural Network mob detection.
 *
 * SECURITY: Requires moderator+ role (internal AI system endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { detectMobGraph } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const session = await requireRole(request, ["moderator", "admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    nodes?: number
    edges?: number
    burstVotes?: number
    repeatedTextRatio?: number
  }

  return NextResponse.json({
    result: detectMobGraph({
      nodes: body.nodes ?? 1,
      edges: body.edges ?? 0,
      burstVotes: body.burstVotes ?? 0,
      repeatedTextRatio: body.repeatedTextRatio ?? 0,
    }),
  })
}
