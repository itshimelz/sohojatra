import { NextResponse } from "next/server"

import { detectMob } from "@/lib/nagarik/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json(detectMob(String(body.signal ?? body.text ?? "")))
}