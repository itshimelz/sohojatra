import { NextResponse } from "next/server"

import { classifyCrime } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ flags: classifyCrime(String(body.text ?? "")) })
}