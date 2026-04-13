import { NextResponse } from "next/server"

import { sentiment } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json(sentiment(String(body.text ?? "")))
}