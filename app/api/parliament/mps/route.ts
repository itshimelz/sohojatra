import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const MpSchema = z.object({
  name: z.string().min(2),
  constituency: z.string().min(2),
  party: z.string().min(2),
  division: z.string().optional(),
  photoUrl: z.string().url().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const party = searchParams.get("party")
  const division = searchParams.get("division")
  const q = searchParams.get("q")

  const where: Record<string, unknown> = { isActive: true }
  if (party) where.party = party
  if (division) where.division = division
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { constituency: { contains: q, mode: "insensitive" } },
    ]
  }

  const mps = await prisma.parliamentMp.findMany({
    where,
    orderBy: { name: "asc" },
    include: { _count: { select: { billVotes: true } } },
  })

  return NextResponse.json({ mps })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = MpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const mp = await prisma.parliamentMp.create({ data: parsed.data })
  return NextResponse.json({ mp }, { status: 201 })
}
