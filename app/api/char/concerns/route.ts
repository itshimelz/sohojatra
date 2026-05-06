import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

const ConcernSchema = z.object({
  charId: z.string().min(1),
  title: z.string().min(5).max(200),
  description: z.string().min(10),
  category: z.string().min(2),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  reporterName: z.string().min(2).optional(),
})

const CHAR_CATEGORIES = [
  "River Erosion",
  "Seasonal Flooding",
  "Boat Access",
  "Healthcare Access",
  "Education Access",
  "Food Security",
  "Drinking Water",
  "Electricity",
  "Mobile Connectivity",
  "Embankment Damage",
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const charId = searchParams.get("charId")
  const category = searchParams.get("category")
  const status = searchParams.get("status")
  const severity = searchParams.get("severity")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = {}
  if (charId) where.charId = charId
  if (category) where.category = category
  if (status) where.status = status
  if (severity) where.severity = severity

  const [concerns, total] = await Promise.all([
    prisma.charConcern.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { char: { select: { name: true, district: true, floodRisk: true } } },
    }),
    prisma.charConcern.count({ where }),
  ])

  return NextResponse.json({ concerns, total, page, pageSize, categories: CHAR_CATEGORIES })
}

export async function POST(req: NextRequest) {
  const session = await optionalSession()

  const body = await req.json()
  const parsed = ConcernSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const island = await prisma.charIsland.findUnique({ where: { id: parsed.data.charId } })
  if (!island) {
    return NextResponse.json({ error: "Char island not found" }, { status: 404 })
  }

  const concern = await prisma.charConcern.create({
    data: {
      charId: parsed.data.charId,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      severity: parsed.data.severity ?? "Medium",
      reporterName: session ? session.userName : (parsed.data.reporterName ?? "Anonymous"),
      reporterId: session ? session.userId : undefined,
    },
  })

  return NextResponse.json({ concern }, { status: 201 })
}
