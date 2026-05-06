import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const BillSchema = z.object({
  billNumber: z.string().min(3),
  title: z.string().min(5).max(300),
  ministry: z.string().min(2),
  category: z.string().optional(),
  status: z.string().optional(),
  introducedDate: z.string(),
  passedDate: z.string().optional(),
  summary: z.string().min(20),
  plainSummary: z.string().optional(),
  fullTextUrl: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const category = searchParams.get("category")
  const ministry = searchParams.get("ministry")
  const q = searchParams.get("q")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 12

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (category) where.category = category
  if (ministry) where.ministry = ministry
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
    ]
  }

  const [bills, total] = await Promise.all([
    prisma.parliamentBill.findMany({
      where,
      orderBy: { introducedDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { comments: true, mpVotes: true } },
      },
    }),
    prisma.parliamentBill.count({ where }),
  ])

  return NextResponse.json({ bills, total, page, pageSize })
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = BillSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const { introducedDate, passedDate, tags, ...rest } = parsed.data

  const bill = await prisma.parliamentBill.create({
    data: {
      ...rest,
      introducedDate: new Date(introducedDate),
      passedDate: passedDate ? new Date(passedDate) : undefined,
      tags: tags ?? [],
    },
  })

  return NextResponse.json({ bill }, { status: 201 })
}
