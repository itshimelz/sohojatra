import { NextResponse } from "next/server"

import { ner } from "@/lib/sohojatra/ai"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json(ner(String(body.text ?? "")))
}