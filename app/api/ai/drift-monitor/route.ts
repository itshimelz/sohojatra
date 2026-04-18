/**
 * GET/POST /api/ai/drift-monitor — AI model drift monitoring.
 *
 * SECURITY: Requires admin+ role (system diagnostics endpoint).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { listDriftMetrics, logDriftMetric } from "@/lib/sohojatra/advanced"

export async function GET(request: Request) {
  // ── RBAC: Admin+ only for system metrics ─────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  return NextResponse.json({ metrics: listDriftMetrics() })
}

export async function POST(request: Request) {
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    model?: string
    baseline?: number
    current?: number
  }

  if (!body.model || body.baseline === undefined || body.current === undefined) {
    return NextResponse.json(
      { error: "model, baseline, current are required" },
      { status: 400 }
    )
  }

  return NextResponse.json(
    {
      metric: logDriftMetric({
        model: body.model,
        baseline: body.baseline,
        current: body.current,
      }),
    },
    { status: 201 }
  )
}
