/**
 * GET/POST /api/funding/disbursements — Government funding disbursements.
 *
 * SECURITY:
 *   - GET: Public (financial transparency).
 *   - POST: Requires admin or superadmin role (RBAC).
 */
import { NextResponse } from "next/server"

import { requireRole } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const db = prisma as unknown as Record<string, any>

function uid() {
  return `d-${crypto.randomUUID().slice(0, 8)}`
}

export async function GET() {
  try {
    const rows = await db.disbursement.findMany({
      orderBy: { releasedAt: "desc" },
    })

    const disbursements = rows.map((row: any) => ({
      id: row.id,
      project: row.project,
      ministry: row.ministry,
      amountBdt: Number(row.amountBdt),
      releasedAt: new Date(row.releasedAt).toISOString(),
      status: row.status,
    }))

    return NextResponse.json({ disbursements })
  } catch (error) {
    console.error("[API_DISBURSEMENTS_GET]", error)
    return NextResponse.json({ disbursements: [] })
  }
}

export async function POST(request: Request) {
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = (await request.json().catch(() => ({}))) as {
    project?: string
    ministry?: string
    amountBdt?: number
    status?: string
  }

  if (!body.project || !body.ministry || body.amountBdt === undefined) {
    return NextResponse.json(
      { error: "project, ministry, amountBdt are required" },
      { status: 400 }
    )
  }

  try {
    const row = await db.disbursement.create({
      data: {
        id: uid(),
        project: body.project.trim(),
        ministry: body.ministry.trim(),
        amountBdt: BigInt(Math.round(body.amountBdt)),
        status: body.status ?? "pending",
      },
    })

    return NextResponse.json(
      {
        disbursement: {
          id: row.id,
          project: row.project,
          ministry: row.ministry,
          amountBdt: Number(row.amountBdt),
          releasedAt: new Date(row.releasedAt).toISOString(),
          status: row.status,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("[API_DISBURSEMENTS_POST]", error)
    return NextResponse.json({ error: "Failed to record disbursement" }, { status: 500 })
  }
}
