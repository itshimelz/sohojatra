import { NextResponse } from "next/server"

import { banglaNlpAnalyze } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { text?: string }
  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  return NextResponse.json({ analysis: banglaNlpAnalyze(body.text) })
}
