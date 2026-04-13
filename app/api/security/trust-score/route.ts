import { NextResponse } from "next/server"

import { trustFromFingerprint } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    fingerprint?: string
    ip?: string
    recentFailures?: number
    velocity?: number
  }

  if (!body.fingerprint) {
    return NextResponse.json({ error: "fingerprint is required" }, { status: 400 })
  }

  return NextResponse.json({ result: trustFromFingerprint({
    fingerprint: body.fingerprint,
    ip: body.ip,
    recentFailures: body.recentFailures,
    velocity: body.velocity,
  }) })
}
