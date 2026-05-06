import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/api-guard"

const StatementSchema = z.object({
  text: z.string().min(10).max(500),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await requireSession(req)
  if (session instanceof Response) return session

  const consultation = await prisma.consultation.findUnique({ where: { id } })
  if (!consultation) {
    return NextResponse.json({ error: "Consultation not found" }, { status: 404 })
  }
  if (consultation.status !== "Open") {
    return NextResponse.json({ error: "Consultation is closed" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = StatementSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const statement = await prisma.consultationStatement.create({
    data: {
      consultationId: id,
      text: parsed.data.text,
      authorId: session.userId,
      authorName: session.userName,
    },
  })

  return NextResponse.json({ statement }, { status: 201 })
}
