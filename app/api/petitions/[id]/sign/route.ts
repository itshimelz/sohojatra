import { NextResponse } from "next/server"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const district: string | undefined = body.district

    const petition = await prisma.petition.findUnique({ where: { id } })
    if (!petition) return NextResponse.json({ message: "Petition not found" }, { status: 404 })
    if (petition.status !== "Active") return NextResponse.json({ message: "Petition is no longer active" }, { status: 400 })
    if (petition.expiresAt && petition.expiresAt < new Date()) {
      return NextResponse.json({ message: "Petition has expired" }, { status: 400 })
    }

    const existing = await prisma.petitionSignature.findUnique({
      where: { petitionId_userId: { petitionId: id, userId: session.userId } },
    })
    if (existing) return NextResponse.json({ message: "You have already signed this petition" }, { status: 409 })

    const [signature] = await prisma.$transaction([
      prisma.petitionSignature.create({
        data: {
          petitionId: id,
          userId: session.userId,
          userName: session.userName,
          district: district ?? null,
        },
      }),
      prisma.petition.update({
        where: { id },
        data: { signatureCount: { increment: 1 } },
      }),
    ])

    const updated = await prisma.petition.findUnique({ where: { id }, select: { signatureCount: true } })

    return NextResponse.json({ signed: true, signatureCount: updated?.signatureCount ?? 0 })
  } catch (error) {
    console.error("[PETITION_SIGN_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
