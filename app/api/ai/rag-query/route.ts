import { NextResponse } from "next/server"

import { ragQuery } from "@/lib/nagarik/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json(ragQuery(String(body.question ?? "")))
}