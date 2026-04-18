/**
 * GET/POST /api/collaboration/threads — Collaborative discussion threads.
 *
 * SECURITY:
 *   - GET: Public (threads are viewable by anyone).
 *   - POST: Requires authenticated session.
 *     Author identity comes from the session.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import {
  createThread,
  listThreads,
  postThreadMessage,
} from "@/lib/sohojatra/advanced"

// GET is public — threads are open for reading
export async function GET() {
  return NextResponse.json({ threads: listThreads() })
}

export async function POST(request: Request) {
  // ── Auth Guard: Must be logged in to post ────────────────
  const session = await requireSession(request)
  if (session instanceof Response) return session

  const body = (await request.json()) as {
    action?: "create-thread" | "post-message"
    threadId?: string
    title?: string
    text?: string
  }

  if (body.action === "post-message") {
    if (!body.threadId || !body.text) {
      return NextResponse.json(
        { error: "threadId and text are required" },
        { status: 400 }
      )
    }

    // ── Author from session, not body ──────────────────────
    const message = postThreadMessage(
      body.threadId,
      session.userName,
      body.text
    )
    if (!message) {
      return NextResponse.json(
        { error: "Thread not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ message }, { status: 201 })
  }

  const thread = createThread(body.title ?? "Untitled collaborative thread")
  return NextResponse.json({ thread }, { status: 201 })
}
