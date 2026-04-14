import { NextResponse } from "next/server"
import { sentiment } from "@/lib/sohojatra/ai"
import { getServerSession } from "@/lib/auth-session"
import { z } from "zod"

const sentimentSchema = z.object({
  text: z.string().min(1, "Text is required for sentiment analysis."),
})

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const validated = sentimentSchema.parse(body)

    return NextResponse.json(sentiment(validated.text))
  } catch (error) {
    if (error instanceof z.ZodError) {
       return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[API_AI_SENTIMENT]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}