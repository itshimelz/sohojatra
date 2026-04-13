import { NextResponse } from "next/server"

import { queryVectors, registerVector } from "@/lib/sohojatra/advanced"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")
  const topK = Number(searchParams.get("topK") ?? 5)
  if (!q) {
    return NextResponse.json({ error: "q is required" }, { status: 400 })
  }

  return NextResponse.json({ results: queryVectors(q, topK) })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    id?: string
    text?: string
    metadata?: Record<string, string>
  }

  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  return NextResponse.json({ point: registerVector({ id: body.id, text: body.text, metadata: body.metadata }) }, { status: 201 })
}
