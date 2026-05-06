import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

const EmbankmentSchema = z.object({
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  division: z.string().min(1),
  district: z.string().min(1),
  upazila: z.string().optional(),
  damageType: z.enum(["Erosion", "Breach", "Seepage", "Overtopping", "Subsidence", "Other"]),
  severity: z.enum(["Low", "Medium", "High", "Critical"]).default("Medium"),
  description: z.string().min(10),
  photos: z.array(z.string()).default([]),
  reporterName: z.string().min(1).max(100),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const severity = searchParams.get("severity")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (district) where.district = district
  if (severity) where.severity = severity

  const [reports, total] = await Promise.all([
    prisma.embankmentReport.findMany({
      where,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.embankmentReport.count({ where }),
  ])

  return NextResponse.json({ reports, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await optionalSession()

  const body = await req.json()
  const parsed = EmbankmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const report = await prisma.embankmentReport.create({
    data: {
      reporterId: session?.userId ?? null,
      reporterName: session ? session.userName : data.reporterName,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      division: data.division,
      district: data.district,
      upazila: data.upazila,
      damageType: data.damageType,
      severity: data.severity,
      description: data.description,
      photos: data.photos,
    },
  })

  return NextResponse.json({ report }, { status: 201 })
}
