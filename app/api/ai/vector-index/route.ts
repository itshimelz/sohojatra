/**
 * GET/POST /api/ai/vector-index — Query or register vector embeddings.
 *
 * SECURITY: Requires admin+ role (vector index management is admin-only).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { queryVectors, registerVector } from "@/lib/sohojatra/advanced"

export async function GET(request: Request) {
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const topK = Number(searchParams.get("topK") ?? 5)
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 })
  }

  return NextResponse.json({ results: queryVectors(q, topK) })
}

export async function POST(request: Request) {
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    id?: string
    text?: string
    metadata?: Record<string, string>
  }

  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  return NextResponse.json(
    {
      point: registerVector({
        id: body.id,
        text: body.text,
        metadata: body.metadata,
      }),
    },
    { status: 201 }
  )
}
