import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const CreateTenderSchema = z.object({
  title: z.string().min(5).max(300),
  ministry: z.string().min(1),
  department: z.string().optional(),
  contractorName: z.string().optional(),
  estimatedValueBdt: z.number().positive(),
  awardedValueBdt: z.number().positive().optional(),
  category: z.string().default("General"),
  district: z.string().optional(),
  status: z.string().default("Open"),
  deadlineAt: z.string().datetime().optional(),
  awardedAt: z.string().datetime().optional(),
  sourceUrl: z.string().url().optional(),
})

function computeRedFlags(data: {
  contractorName?: string
  estimatedValueBdt: number
  awardedValueBdt?: number
  deadlineAt?: string
}) {
  const flags: string[] = []
  let score = 0

  if (!data.contractorName) {
    flags.push("no_contractor")
    score += 10
  }

  if (data.awardedValueBdt && data.estimatedValueBdt > 0) {
    const inflation = (data.awardedValueBdt - data.estimatedValueBdt) / data.estimatedValueBdt
    if (inflation > 0.3) {
      flags.push("price_inflation_30pct")
      score += 30
    } else if (inflation > 0.15) {
      flags.push("price_inflation_15pct")
      score += 15
    }
  }

  if (data.deadlineAt) {
    const daysOpen = Math.ceil(
      (new Date(data.deadlineAt).getTime() - Date.now()) / 86400000
    )
    if (daysOpen < 7 && daysOpen >= 0) {
      flags.push("short_bidding_window")
      score += 20
    }
  }

  return { flags, score: Math.min(score, 100) }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ministry = searchParams.get("ministry")
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const flagged = searchParams.get("flagged") === "true"
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (ministry) where.ministry = ministry
  if (status) where.status = status
  if (category) where.category = category
  if (flagged) where.redFlagScore = { gt: 20 }

  const [tenders, total] = await Promise.all([
    prisma.procurementTender.findMany({
      where,
      orderBy: [{ redFlagScore: "desc" }, { publishedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.procurementTender.count({ where }),
  ])

  return NextResponse.json({
    tenders: tenders.map((t) => ({
      ...t,
      estimatedValueBdt: t.estimatedValueBdt.toString(),
      awardedValueBdt: t.awardedValueBdt?.toString() ?? null,
    })),
    total,
    page,
    pageSize,
  })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CreateTenderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const { flags, score } = computeRedFlags({
    contractorName: data.contractorName,
    estimatedValueBdt: data.estimatedValueBdt,
    awardedValueBdt: data.awardedValueBdt,
    deadlineAt: data.deadlineAt,
  })

  const tender = await prisma.procurementTender.create({
    data: {
      title: data.title,
      ministry: data.ministry,
      department: data.department,
      contractorName: data.contractorName,
      estimatedValueBdt: BigInt(data.estimatedValueBdt),
      awardedValueBdt: data.awardedValueBdt ? BigInt(data.awardedValueBdt) : undefined,
      category: data.category,
      district: data.district,
      status: data.status,
      deadlineAt: data.deadlineAt ? new Date(data.deadlineAt) : undefined,
      awardedAt: data.awardedAt ? new Date(data.awardedAt) : undefined,
      sourceUrl: data.sourceUrl,
      redFlagScore: score,
      redFlags: flags,
    },
  })

  return NextResponse.json(
    {
      tender: {
        ...tender,
        estimatedValueBdt: tender.estimatedValueBdt.toString(),
        awardedValueBdt: tender.awardedValueBdt?.toString() ?? null,
      },
    },
    { status: 201 }
  )
}
