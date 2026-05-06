import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const focusArea = searchParams.get("focusArea")
  const sortBy = searchParams.get("sortBy") ?? "impactScore"
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = { status: "Active" }
  if (district) where.district = district

  const orderBy =
    sortBy === "totalAdoptions"
      ? { totalAdoptions: "desc" as const }
      : { impactScore: "desc" as const }

  const [ngos, total] = await Promise.all([
    prisma.ngoProfile.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { adoptions: true } } },
    }),
    prisma.ngoProfile.count({ where }),
  ])

  const filtered = focusArea
    ? ngos.filter((n) => (n.focusAreas as string[]).includes(focusArea))
    : ngos

  return NextResponse.json({ ngos: filtered, total, page, pageSize })
}
