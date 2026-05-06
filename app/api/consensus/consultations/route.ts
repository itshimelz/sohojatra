import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession, requireRole } from "@/lib/api-guard"

const CreateSchema = z.object({
  title: z.string().min(5).max(300),
  description: z.string().min(10),
  category: z.string().default("General"),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where = status ? { status } : {}
  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { statements: true } } },
    }),
    prisma.consultation.count({ where }),
  ])

  return NextResponse.json({ consultations, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin", "moderator"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const consultation = await prisma.consultation.create({
    data: { ...parsed.data, createdBy: session.userId },
  })

  return NextResponse.json({ consultation }, { status: 201 })
}
