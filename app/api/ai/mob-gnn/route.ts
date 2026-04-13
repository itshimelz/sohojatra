import { NextResponse } from "next/server"

import { detectMobGraph } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
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
