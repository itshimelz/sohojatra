import { NextResponse } from "next/server"

import { createThread, listThreads, postThreadMessage } from "@/lib/sohojatra/advanced"

export async function GET() {
  return NextResponse.json({ threads: listThreads() })
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "create-thread" | "post-message"
    threadId?: string
    title?: string
    author?: string
    text?: string
  }

  if (body.action === "post-message") {
    if (!body.threadId || !body.text) {
      return NextResponse.json({ error: "threadId and text are required" }, { status: 400 })
    }

    const message = postThreadMessage(body.threadId, body.author ?? "Citizen", body.text)
    if (!message) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 })
    }

    return NextResponse.json({ message }, { status: 201 })
  }

  const thread = createThread(body.title ?? "Untitled collaborative thread")
  return NextResponse.json({ thread }, { status: 201 })
}
