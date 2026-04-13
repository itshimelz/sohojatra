import { NextResponse } from "next/server"

import { verifyNid } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { nid?: string }
  if (!body.nid) {
    return NextResponse.json({ error: "nid is required" }, { status: 400 })
  }

  return NextResponse.json({ verification: verifyNid(body.nid) })
}
