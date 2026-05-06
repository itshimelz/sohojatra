import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")
  const zone = searchParams.get("zone")
  const district = searchParams.get("district")

  const where: Record<string, unknown> = { isActive: true }
  if (zone) where.zone = zone
  if (district) where.district = district
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { factoryCode: { contains: q, mode: "insensitive" } },
    ]
  }

  const factories = await prisma.garmentFactory.findMany({
    where,
    orderBy: { complianceScore: "asc" },
    include: { _count: { select: { reports: true } } },
  })

  return NextResponse.json({ factories })
}
