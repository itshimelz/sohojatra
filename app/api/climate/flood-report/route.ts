import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { optionalSession } from "@/lib/api-guard"

const FloodReportSchema = z.object({
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  division: z.string().min(1),
  district: z.string().min(1),
  upazila: z.string().optional(),
  depthCm: z.number().int().min(1).max(2000),
  description: z.string().optional(),
  photos: z.array(z.string()).default([]),
  reporterName: z.string().min(1).max(100),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where = district ? { district } : {}
  const [reports, total] = await Promise.all([
    prisma.floodReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.floodReport.count({ where }),
  ])

  return NextResponse.json({ reports, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await optionalSession()

  const body = await req.json()
  const parsed = FloodReportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const data = parsed.data
  const report = await prisma.floodReport.create({
    data: {
      reporterId: session?.userId ?? null,
      reporterName: session ? session.userName : data.reporterName,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      division: data.division,
      district: data.district,
      upazila: data.upazila,
      depthCm: data.depthCm,
      description: data.description,
      photos: data.photos,
    },
  })

  return NextResponse.json({ report }, { status: 201 })
}
