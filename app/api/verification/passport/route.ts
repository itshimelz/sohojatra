import { NextResponse } from "next/server"

import { verifyPassport } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as { passport?: string; country?: string }
  if (!body.passport) {
    return NextResponse.json({ error: "passport is required" }, { status: 400 })
  }

  return NextResponse.json({ verification: verifyPassport(body.passport, body.country ?? "BD") })
}
