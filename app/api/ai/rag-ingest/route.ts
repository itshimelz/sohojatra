import { NextResponse } from "next/server"

import { ragRetrieve, registerVector } from "@/lib/sohojatra/advanced"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const question = searchParams.get("question")
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 })
  }

  return NextResponse.json(ragRetrieve(question))
}

export async function POST(request: Request) {
  const body = (await request.json()) as { docs?: Array<{ id?: string; text: string }> }
  if (!Array.isArray(body.docs) || body.docs.length === 0) {
    return NextResponse.json({ error: "docs[] is required" }, { status: 400 })
  }

  const indexed = body.docs.map((doc) => registerVector({ id: doc.id, text: doc.text, metadata: { source: "rag-ingest" } }))
  return NextResponse.json({ indexed: indexed.length }, { status: 201 })
}
