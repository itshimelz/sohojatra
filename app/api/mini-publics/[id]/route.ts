import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const JoinSchema = z.object({
  citizenName: z.string().min(2),
  district: z.string().optional(),
  occupation: z.string().optional(),
})

const RecommendSchema = z.object({
  recommendation: z.string().min(20),
  status: z.enum(["Complete", "Published"]),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const miniPublic = await prisma.miniPublic.findUnique({
    where: { id },
    include: {
      members: { orderBy: { joinedAt: "asc" } },
      rounds: {
        orderBy: { roundNumber: "asc" },
        include: {
          submissions: { orderBy: { upvotes: "desc" }, take: 50 },
        },
      },
    },
  })

  if (!miniPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ miniPublic })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const { searchParams } = new URL(req.url)
  const action = searchParams.get("action")

  const miniPublic = await prisma.miniPublic.findUnique({ where: { id } })
  if (!miniPublic) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "join") {
    const body = await req.json()
    const parsed = JoinSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

    if (miniPublic.status !== "Forming") {
      return NextResponse.json({ error: "Panel is no longer accepting members" }, { status: 409 })
    }

    const existing = await prisma.panelMember.findFirst({
      where: { miniPublicId: id, citizenId: session.userId },
    })
    if (existing) return NextResponse.json({ error: "Already joined" }, { status: 409 })

    const member = await prisma.panelMember.create({
      data: {
        miniPublicId: id,
        citizenName: parsed.data.citizenName,
        citizenId: session.userId,
        district: parsed.data.district,
        occupation: parsed.data.occupation,
      },
    })

    const memberCount = await prisma.panelMember.count({ where: { miniPublicId: id } })
    if (memberCount >= miniPublic.panelSize) {
      await prisma.miniPublic.update({ where: { id }, data: { status: "Deliberating" } })
    }

    return NextResponse.json({ member }, { status: 201 })
  }

  if (action === "recommend") {
    const body = await req.json()
    const parsed = RecommendSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

    const updated = await prisma.miniPublic.update({
      where: { id },
      data: {
        recommendation: parsed.data.recommendation,
        status: parsed.data.status,
        publishedAt: parsed.data.status === "Published" ? new Date() : undefined,
      },
    })

    return NextResponse.json({ miniPublic: updated })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
