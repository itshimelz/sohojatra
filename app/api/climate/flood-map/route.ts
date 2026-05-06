import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const hours = parseInt(searchParams.get("hours") ?? "72")

  const since = new Date(Date.now() - hours * 3600 * 1000)

  const reports = await prisma.floodReport.findMany({
    where: {
      createdAt: { gte: since },
      ...(district ? { district } : {}),
    },
    select: {
      id: true,
      locationLat: true,
      locationLng: true,
      depthCm: true,
      division: true,
      district: true,
      upazila: true,
      isVerified: true,
      createdAt: true,
    },
    orderBy: { depthCm: "desc" },
    take: 500,
  })

  const districtAggregates = await prisma.floodReport.groupBy({
    by: ["district"],
    _avg: { depthCm: true },
    _count: { id: true },
    _max: { depthCm: true },
    where: { createdAt: { gte: since } },
    orderBy: { _avg: { depthCm: "desc" } },
  })

  return NextResponse.json({
    reports,
    districtAggregates: districtAggregates.map((d) => ({
      district: d.district,
      reportCount: d._count.id,
      avgDepthCm: Math.round(d._avg.depthCm ?? 0),
      maxDepthCm: d._max.depthCm ?? 0,
    })),
    generatedAt: new Date().toISOString(),
  })
}
