/**
 * GET/POST /api/ai/rag-ingest — Ingest documents into the RAG index.
 *
 * SECURITY: Requires admin+ role (data ingestion is an admin action).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { ragRetrieve, registerVector } from "@/lib/sohojatra/advanced"

export async function GET(request: Request) {
  // ── RBAC: Admin+ for RAG retrieval debugging ─────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const { searchParams } = new URL(request.url)
  const question = searchParams.get("question")
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 })
  }

  return NextResponse.json(ragRetrieve(question))
}

export async function POST(request: Request) {
  // ── RBAC: Admin+ for document ingestion ──────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    docs?: Array<{ id?: string; text: string }>
  }
  if (!Array.isArray(body.docs) || body.docs.length === 0) {
    return NextResponse.json({ error: "docs[] is required" }, { status: 400 })
  }

  const indexed = body.docs.map((doc) =>
    registerVector({
      id: doc.id,
      text: doc.text,
      metadata: { source: "rag-ingest" },
    })
  )
  return NextResponse.json({ indexed: indexed.length }, { status: 201 })
}
