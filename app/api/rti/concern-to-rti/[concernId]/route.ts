import { NextResponse } from "next/server"
import { requireSession } from "@/lib/api-guard"
import { prisma } from "@/lib/prisma"

const CATEGORY_MINISTRY: Record<string, string> = {
  Infrastructure: "Ministry of Local Government, Rural Development and Co-operatives",
  Health: "Ministry of Health and Family Welfare",
  Education: "Ministry of Education",
  Environment: "Ministry of Environment, Forest and Climate Change",
  Corruption: "Anti-Corruption Commission (ACC)",
  Safety: "Ministry of Home Affairs",
  Rights: "Ministry of Law, Justice and Parliamentary Affairs",
  Economy: "Ministry of Finance",
}

export async function POST(request: Request, { params }: { params: Promise<{ concernId: string }> }) {
  try {
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const { concernId } = await params
    const concern = await prisma.concern.findUnique({
      where: { id: concernId },
      select: { id: true, title: true, description: true, category: true, location: true },
    })

    if (!concern) return NextResponse.json({ message: "Concern not found" }, { status: 404 })

    const ministry = CATEGORY_MINISTRY[concern.category] ?? "Ministry of Local Government, Rural Development and Co-operatives"
    const now = new Date()
    const deadline = new Date(now.getTime() + 30 * 24 * 3600000)

    const rti = await prisma.rtiRequest.create({
      data: {
        userId: session.userId,
        userName: session.userName,
        targetMinistry: ministry,
        informationRequested: `Under the Right to Information Act 2009, I request information regarding the following civic concern:\n\nTitle: ${concern.title}\n\nDescription: ${concern.description}\n\nLocation: ${concern.location ?? "Not specified"}\n\nSpecifically, I request:\n1. What actions, if any, have been taken to address this concern?\n2. Which department or office is responsible?\n3. What is the expected timeline for resolution?\n4. What budget (if any) has been allocated?`,
        legalBasis: "Right to Information Act, 2009",
        status: "Submitted",
        submittedAt: now,
        deadline,
        concernId,
        isPublic: false,
      },
    })

    return NextResponse.json({ rti, suggestedMinistry: ministry }, { status: 201 })
  } catch (error) {
    console.error("[RTI_CONCERN_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
