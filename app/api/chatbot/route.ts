/**
 * POST /api/chatbot — Constitutional RAG chatbot.
 *
 * PUBLIC endpoint — read-only, no data mutation.
 * Rate-limiting enforced at proxy/middleware layer.
 */
import { NextResponse } from "next/server"

import {
  GroqConfigError,
  groqComplete,
  groqStream,
  retrieveAndPrompt,
  type ChatMessage,
} from "@/lib/sohojatra/groq"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  question?: string
  messages?: ChatMessage[]
  stream?: boolean
}

function normaliseHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        (m as ChatMessage).role !== undefined &&
        typeof (m as ChatMessage).content === "string",
    )
    .slice(-10)
}

export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const question = String(body.question ?? "").trim()
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 })
  }

  const history = normaliseHistory(body.messages)

  let prompt: Awaited<ReturnType<typeof retrieveAndPrompt>>
  try {
    prompt = await retrieveAndPrompt(history, question)
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load constitution index", detail: String(error) },
      { status: 500 },
    )
  }

  // ── Streaming SSE ─────────────────────────────────────────────────────────
  if (body.stream) {
    const encoder = new TextEncoder()

    // Guard flag: once the stream is closed or cancelled we must not call
    // controller.enqueue() again — that throws a TypeError which becomes
    // the unhandledRejection "[object Event]" in the browser.
    let streamDone = false

    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          if (streamDone) return
          try {
            controller.enqueue(
              encoder.encode(
                `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
              ),
            )
          } catch {
            // controller already closed (client disconnected)
            streamDone = true
          }
        }

        const closeStream = () => {
          if (streamDone) return
          streamDone = true
          try {
            controller.close()
          } catch {
            // already closed — safe to ignore
          }
        }

        send("citations", { citations: prompt.citations })

        try {
          for await (const delta of groqStream(prompt.messages)) {
            if (streamDone) break
            send("delta", { text: delta })
          }
          send("done", { ok: true })
        } catch (error) {
          const message =
            error instanceof GroqConfigError
              ? error.message
              : error instanceof Error
                ? error.message
                : "Groq API error — please try again."
          send("error", { message })
        } finally {
          closeStream()
        }
      },

      // Called when the browser cancels the fetch (navigation, abort signal).
      // Set the flag so in-flight enqueue calls are silently skipped.
      cancel() {
        streamDone = true
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  }

  // ── Non-streaming JSON ────────────────────────────────────────────────────
  try {
    const text = await groqComplete(prompt.messages)
    return NextResponse.json({
      question,
      answer: {
        id: `reply-${Date.now()}`,
        role: "assistant",
        text,
        citations: prompt.citations,
      },
    })
  } catch (error) {
    const status = error instanceof GroqConfigError ? 503 : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    )
  }
}
