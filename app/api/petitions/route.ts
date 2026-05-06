import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, optionalSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  title: z.string().min(10).max(200),
  body: z.string().min(50),
  targetAuthority: z.string().min(3),
  category: z.string().min(2),
  expiresInDays: z.number().int().min(7).max(365).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status") ?? "Active"
  const sort = searchParams.get("sort") ?? "recent"

  try {
    const petitions = await prisma.petition.findMany({
      where: status === "all" ? {} : { status },
      orderBy: sort === "signatures" ? { signatureCount: "desc" } : { createdAt: "desc" },
      take: 30,
      include: { _count: { select: { signatures: true } } },
    })
    return NextResponse.json({ petitions })
  } catch (error) {
    console.error("[PETITIONS_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const body = await request.json()
    const data = createSchema.parse(body)

    const expiresAt = data.expiresInDays
      ? new Date(Date.now() + data.expiresInDays * 86400000)
      : new Date(Date.now() + 180 * 86400000)

    const petition = await prisma.petition.create({
      data: {
        title: data.title,
        body: data.body,
        authorId: session.userId,
        authorName: session.userName,
        targetAuthority: data.targetAuthority,
        category: data.category,
        expiresAt,
      },
    })

    return NextResponse.json({ petition }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[PETITIONS_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
