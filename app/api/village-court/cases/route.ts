import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const DISPUTE_TYPES = [
  "Land Dispute", "Family Dispute", "Money Recovery", "Assault",
  "Property Damage", "Marriage/Divorce", "Inheritance", "Water Rights", "Other",
]

const CaseSchema = z.object({
  courtId: z.string().min(1),
  caseNumber: z.string().min(3),
  disputeType: z.string().min(2),
  claimantName: z.string().min(2),
  respondentName: z.string().min(2),
  description: z.string().min(10),
  filedDate: z.string(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const courtId = searchParams.get("courtId")
  const disputeType = searchParams.get("disputeType")
  const status = searchParams.get("status")
  const q = searchParams.get("q")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = {}
  if (courtId) where.courtId = courtId
  if (disputeType) where.disputeType = disputeType
  if (status) where.status = status
  if (q) {
    where.OR = [
      { claimantName: { contains: q, mode: "insensitive" } },
      { respondentName: { contains: q, mode: "insensitive" } },
      { caseNumber: { contains: q, mode: "insensitive" } },
    ]
  }

  const [cases, total] = await Promise.all([
    prisma.villageCase.findMany({
      where,
      orderBy: { filedDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { court: { select: { name: true, upazila: true, district: true } } },
    }),
    prisma.villageCase.count({ where }),
  ])

  return NextResponse.json({ cases, total, page, pageSize, disputeTypes: DISPUTE_TYPES })
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const existing = await prisma.villageCase.findUnique({
    where: { caseNumber: parsed.data.caseNumber },
  })
  if (existing) {
    return NextResponse.json({ error: "Case number already exists" }, { status: 409 })
  }

  const villageCase = await prisma.villageCase.create({
    data: { ...parsed.data, filedDate: new Date(parsed.data.filedDate) },
  })

  return NextResponse.json({ case: villageCase }, { status: 201 })
}
