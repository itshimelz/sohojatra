import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

const ISSUE_TYPES = [
  "Wage Theft", "Unpaid Overtime", "Physical Abuse", "Verbal Abuse",
  "Fire Safety Violation", "Structural Hazard", "Forced Overtime",
  "Maternity Rights Violation", "Child Labour", "Discrimination",
  "Illegal Deduction", "Denied Leave", "Other",
]

const ReportSchema = z.object({
  factoryCode: z.string().optional(),
  issueType: z.string().min(2),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).optional(),
  description: z.string().min(10).max(3000),
  incidentDate: z.string().optional(),
  isAnonymous: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const issueType = searchParams.get("issueType")
  const severity = searchParams.get("severity")
  const factoryCode = searchParams.get("factoryCode")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 15

  const where: Record<string, unknown> = {}
  if (issueType) where.issueType = issueType
  if (severity) where.severity = severity
  if (factoryCode) where.factoryCode = factoryCode

  const [reports, total] = await Promise.all([
    prisma.workerReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { factory: { select: { name: true, zone: true } } },
    }),
    prisma.workerReport.count({ where }),
  ])

  const masked = reports.map((r) => ({
    ...r,
    reporterId: undefined,
  }))

  return NextResponse.json({ reports: masked, total, page, pageSize, issueTypes: ISSUE_TYPES })
}

export async function POST(req: NextRequest) {
  const session = await optionalSession()

  const body = await req.json()
  const parsed = ReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { factoryCode, incidentDate, isAnonymous, ...rest } = parsed.data

  let factoryId: string | undefined
  if (factoryCode) {
    const factory = await prisma.garmentFactory.findUnique({ where: { factoryCode } })
    if (factory) factoryId = factory.id
  }

  const report = await prisma.workerReport.create({
    data: {
      ...rest,
      factoryCode,
      factoryId,
      incidentDate: incidentDate ? new Date(incidentDate) : undefined,
      isAnonymous: isAnonymous ?? true,
      reporterId: !isAnonymous && session ? session.userId : undefined,
      severity: rest.severity ?? "Medium",
    },
  })

  return NextResponse.json({ report: { ...report, reporterId: undefined } }, { status: 201 })
}
