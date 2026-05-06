import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventType = searchParams.get("eventType")
  const entityType = searchParams.get("entityType")
  const page = parseInt(searchParams.get("page") ?? "1")
  const pageSize = 20

  const where: Record<string, unknown> = {}
  if (eventType) where.eventType = eventType
  if (entityType) where.entityType = entityType

  const [blocks, total] = await Promise.all([
    prisma.auditBlock.findMany({
      where,
      orderBy: { blockIndex: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditBlock.count({ where }),
  ])

  const latest = await prisma.auditBlock.findFirst({ orderBy: { blockIndex: "desc" } })

  return NextResponse.json({ blocks, total, page, pageSize, chainLength: latest?.blockIndex ?? 0 })
}
