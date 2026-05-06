import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const IslandSchema = z.object({
  name: z.string().min(2),
  district: z.string().min(2),
  division: z.string().min(2),
  population: z.number().int().min(0).optional(),
  floodRisk: z.enum(["Low", "Medium", "High", "Extreme"]).optional(),
  isSeasonallyIsolated: z.boolean().optional(),
  boatHoursToUpazila: z.number().min(0).optional(),
  hasElectricity: z.boolean().optional(),
  hasMobileNetwork: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const division = searchParams.get("division")
  const floodRisk = searchParams.get("floodRisk")

  const where: Record<string, unknown> = {}
  if (district) where.district = district
  if (division) where.division = division
  if (floodRisk) where.floodRisk = floodRisk

  const islands = await prisma.charIsland.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { concerns: true } } },
  })

  return NextResponse.json({ islands })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = IslandSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const island = await prisma.charIsland.create({ data: parsed.data })
  return NextResponse.json({ island }, { status: 201 })
}
