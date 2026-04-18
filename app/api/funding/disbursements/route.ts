/**
 * GET/POST /api/funding/disbursements — Government funding disbursements.
 *
 * SECURITY:
 *   - GET: Public (financial transparency).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only government administrators can record funding disbursements.
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"

type Disbursement = {
  id: string
  project: string
  ministry: string
  amountBdt: number
  releasedAt: string
  status: "released" | "pending" | "audit"
}

const disbursements: Disbursement[] = [
  {
    id: "d-001",
    project: "Mirpur drainage rehabilitation",
    ministry: "Ministry of Local Government",
    amountBdt: 2500000,
    releasedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    status: "released",
  },
]

// GET is public — financial transparency
export async function GET() {
  return NextResponse.json({ disbursements })
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can record disbursements ───────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    project?: string
    ministry?: string
    amountBdt?: number
  }

  if (!body.project || !body.ministry || body.amountBdt === undefined) {
    return NextResponse.json(
      { error: "project, ministry, amountBdt are required" },
      { status: 400 }
    )
  }

  const record: Disbursement = {
    id: `d-${Date.now()}`,
    project: body.project,
    ministry: body.ministry,
    amountBdt: body.amountBdt,
    releasedAt: new Date().toISOString(),
    status: "pending",
  }

  disbursements.unshift(record)
  return NextResponse.json({ disbursement: record }, { status: 201 })
}
