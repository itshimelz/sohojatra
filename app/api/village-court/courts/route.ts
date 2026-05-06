import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const CourtSchema = z.object({
  name: z.string().min(3),
  upazila: z.string().min(2),
  district: z.string().min(2),
  division: z.string().min(2),
  arbitrators: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const district = searchParams.get("district")
  const division = searchParams.get("division")

  const where: Record<string, unknown> = { isActive: true }
  if (district) where.district = district
  if (division) where.division = division

  const courts = await prisma.villageCourt.findMany({
    where,
    orderBy: [{ district: "asc" }, { upazila: "asc" }],
    include: { _count: { select: { cases: true } } },
  })

  return NextResponse.json({ courts })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CourtSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const court = await prisma.villageCourt.create({
    data: { ...parsed.data, arbitrators: parsed.data.arbitrators ?? [] },
  })
  return NextResponse.json({ court }, { status: 201 })
}
