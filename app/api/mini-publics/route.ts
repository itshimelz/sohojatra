import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const CreateSchema = z.object({
  title: z.string().min(5),
  topic: z.string().min(10),
  summary: z.string().min(20),
  concernId: z.string().optional(),
  panelSize: z.number().int().min(3).max(50).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = {}
  if (status) where.status = status

  const [miniPublics, total] = await Promise.all([
    prisma.miniPublic.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { members: true, rounds: true } },
      },
    }),
    prisma.miniPublic.count({ where }),
  ])

  return NextResponse.json({ miniPublics, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const miniPublic = await prisma.miniPublic.create({
    data: {
      title: parsed.data.title,
      topic: parsed.data.topic,
      summary: parsed.data.summary,
      concernId: parsed.data.concernId,
      panelSize: parsed.data.panelSize ?? 12,
    },
  })

  return NextResponse.json({ miniPublic }, { status: 201 })
}
