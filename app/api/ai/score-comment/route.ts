import { NextResponse } from "next/server"

import { scoreComment } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ priorityScore: scoreComment(body) })
}