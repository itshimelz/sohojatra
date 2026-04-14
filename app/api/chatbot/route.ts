import { NextResponse } from "next/server"

const defaultReplies = [
  {
    id: "reply-1",
    role: "assistant",
    text: "You can submit a concern using text, photo, or voice. Verified phone numbers are supported now, with NID and diaspora paths planned for higher-trust roles.",
    citation: "Platform workflow",
  },
  {
    id: "reply-2",
    role: "assistant",
    text: "Public concerns are tracked through a visible timeline, and proposal workflows will show review, approval, and funding states.",
    citation: "Co-governance roadmap",
  },
]

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const question = String(body.question ?? "").trim()

  const answer =
    defaultReplies.find(() => question.length > 0) ?? defaultReplies[0]

  return NextResponse.json({
    question,
    answer: {
      ...answer,
      text: question
        ? `You asked: ${question}. ${answer.text}`
        : answer.text,
    },
  })
}