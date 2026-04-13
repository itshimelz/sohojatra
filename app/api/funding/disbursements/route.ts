import { NextResponse } from "next/server"

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

export async function GET() {
  return NextResponse.json({ disbursements })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    project?: string
    ministry?: string
    amountBdt?: number
  }

  if (!body.project || !body.ministry || body.amountBdt === undefined) {
    return NextResponse.json({ error: "project, ministry, amountBdt are required" }, { status: 400 })
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
