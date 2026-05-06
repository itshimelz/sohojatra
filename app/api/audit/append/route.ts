import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/api-guard"

const AppendSchema = z.object({
  eventType: z.string().min(2),
  entityType: z.string().min(2),
  entityId: z.string().min(1),
  actorId: z.string().optional(),
  actorName: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
})

function computeHash(blockIndex: number, prevHash: string, timestamp: string, data: unknown): string {
  const content = `${blockIndex}${prevHash}${timestamp}${JSON.stringify(data)}`
  return createHash("sha256").update(content).digest("hex")
}

export async function POST(req: NextRequest) {
  const session = await requireRole(req, ["admin", "superadmin", "moderator"])
  if (session instanceof Response) return session

  const body = await req.json()
  const parsed = AppendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const latest = await prisma.auditBlock.findFirst({ orderBy: { blockIndex: "desc" } })
  const blockIndex = (latest?.blockIndex ?? -1) + 1
  const prevHash = latest?.hash ?? "0".repeat(64)
  const timestamp = new Date().toISOString()
  const hash = computeHash(blockIndex, prevHash, timestamp, parsed.data.data)

  const block = await prisma.auditBlock.create({
    data: {
      blockIndex,
      hash,
      prevHash,
      eventType: parsed.data.eventType,
      entityType: parsed.data.entityType,
      entityId: parsed.data.entityId,
      actorId: parsed.data.actorId ?? session.userId,
      actorName: parsed.data.actorName ?? session.userName,
      data: JSON.parse(JSON.stringify(parsed.data.data)),
      timestamp: new Date(timestamp),
    },
  })

  return NextResponse.json({ block }, { status: 201 })
}
