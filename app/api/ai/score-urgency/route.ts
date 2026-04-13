import { NextResponse } from "next/server"

import { scoreUrgency } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ urgencyScore: scoreUrgency(String(body.text ?? "")) })
}