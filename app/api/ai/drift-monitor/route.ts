import { NextResponse } from "next/server"

import { listDriftMetrics, logDriftMetric } from "@/lib/sohojatra/advanced"

export async function GET() {
  return NextResponse.json({ metrics: listDriftMetrics() })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    model?: string
    baseline?: number
    current?: number
  }

  if (!body.model || body.baseline === undefined || body.current === undefined) {
    return NextResponse.json({ error: "model, baseline, current are required" }, { status: 400 })
  }

  return NextResponse.json({ metric: logDriftMetric({ model: body.model, baseline: body.baseline, current: body.current }) }, { status: 201 })
}
