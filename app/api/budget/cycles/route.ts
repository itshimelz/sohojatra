import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const CreateCycleSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  fiscalYear: z.string().min(4),
  totalBudgetBdt: z.number().positive(),
  category: z.string().default("General"),
  district: z.string().optional(),
  upazila: z.string().optional(),
  proposalDeadline: z.string().datetime(),
  votingDeadline: z.string().datetime(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const fiscalYear = searchParams.get("fiscalYear")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (fiscalYear) where.fiscalYear = fiscalYear

  const [cycles, total] = await Promise.all([
    prisma.budgetCycle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { proposals: true } },
      },
    }),
    prisma.budgetCycle.count({ where }),
  ])

  return NextResponse.json({ cycles, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CreateCycleSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const cycle = await prisma.budgetCycle.create({
    data: {
      title: data.title,
      description: data.description,
      fiscalYear: data.fiscalYear,
      totalBudgetBdt: BigInt(data.totalBudgetBdt),
      category: data.category,
      district: data.district,
      upazila: data.upazila,
      proposalDeadline: new Date(data.proposalDeadline),
      votingDeadline: new Date(data.votingDeadline),
      createdBy: session.userId,
    },
  })

  return NextResponse.json(
    { cycle: { ...cycle, totalBudgetBdt: cycle.totalBudgetBdt.toString() } },
    { status: 201 }
  )
}
