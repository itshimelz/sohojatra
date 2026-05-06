import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const CommentSchema = z.object({
  text: z.string().min(5).max(2000),
  clauseRef: z.string().max(100).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const bill = await prisma.parliamentBill.findUnique({ where: { id } })
  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = CommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const comment = await prisma.billComment.create({
    data: {
      billId: id,
      authorId: session.userId,
      authorName: session.userName,
      text: parsed.data.text,
      clauseRef: parsed.data.clauseRef,
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
