import { NextResponse } from "next/server"
import { z } from "zod"
import { requireSession, optionalSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  targetMinistry: z.string().min(3),
  informationRequested: z.string().min(20),
  legalBasis: z.string().optional(),
  concernId: z.string().optional(),
  isPublic: z.boolean().optional(),
})

export async function GET(request: Request) {
  try {
    const session = await optionalSession()
    const { searchParams } = new URL(request.url)
    const isLibrary = searchParams.get("library") === "1"

    if (isLibrary) {
      const requests = await prisma.rtiRequest.findMany({
        where: { isPublic: true, status: { in: ["Responded", "Resolved"] } },
        orderBy: { respondedAt: "desc" },
        take: 50,
        select: {
          id: true, targetMinistry: true, informationRequested: true,
          responseText: true, respondedAt: true, status: true,
        },
      })
      return NextResponse.json({ requests })
    }

    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 })
    }

    const requests = await prisma.rtiRequest.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("[RTI_REQUESTS_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const body = await request.json()
    const data = createSchema.parse(body)

    const now = new Date()
    const deadline = new Date(now.getTime() + 30 * 24 * 3600000)

    const rti = await prisma.rtiRequest.create({
      data: {
        userId: session.userId,
        userName: session.userName,
        targetMinistry: data.targetMinistry,
        informationRequested: data.informationRequested,
        legalBasis: data.legalBasis ?? "Right to Information Act, 2009",
        status: "Submitted",
        submittedAt: now,
        deadline,
        concernId: data.concernId ?? null,
        isPublic: data.isPublic ?? false,
      },
    })

    return NextResponse.json({ rti }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[RTI_REQUESTS_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
