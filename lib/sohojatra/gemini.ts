import type { ChatMessage, LlmChatOptions } from "./llm-chat-types"
import { RightsChatConfigError } from "./rights-chat-config-error"

const GEMINI_BASE =
  process.env.GEMINI_API_BASE?.replace(/\/$/, "") ??
  "https://generativelanguage.googleapis.com/v1beta"

const DEFAULT_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

function requireApiKey(): string {
  const key = process.env.GEMINI_API_KEY
  if (!key?.trim()) {
    throw new RightsChatConfigError(
      "GEMINI_API_KEY is not set. Add it to .env.local to use Google Gemini for the rights chatbot.",
    )
  }
  return key.trim()
}

function buildGeminiBody(messages: ChatMessage[]): Record<string, unknown> {
  const systemChunks: string[] = []
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> =
    []

  for (const m of messages) {
    if (m.role === "system") {
      systemChunks.push(m.content)
    } else if (m.role === "user") {
      contents.push({ role: "user", parts: [{ text: m.content }] })
    } else if (m.role === "assistant") {
      contents.push({ role: "model", parts: [{ text: m.content }] })
    }
  }

  const body: Record<string, unknown> = { contents }
  if (systemChunks.length) {
    body.systemInstruction = {
      parts: [{ text: systemChunks.join("\n\n") }],
    }
  }
  return body
}

function extractTextFromResponse(json: unknown): string {
  const root =
    json && typeof json === "object" && "response" in (json as object)
      ? (json as { response: unknown }).response
      : json
  if (!root || typeof root !== "object") return ""
  const candidates = (root as { candidates?: unknown[] }).candidates
  const first = candidates?.[0]
  if (!first || typeof first !== "object") return ""
  const content = (first as { content?: { parts?: unknown[] } }).content
  const parts = content?.parts
  if (!Array.isArray(parts)) return ""
  let out = ""
  for (const p of parts) {
    if (p && typeof p === "object" && "text" in p && typeof (p as { text: unknown }).text === "string") {
      out += (p as { text: string }).text
    }
  }
  return out
}

/** Non-streaming completion (Google AI Studio / Gemini API key). */
export async function geminiComplete(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): Promise<string> {
  const apiKey = requireApiKey()
  const model = opts.model ?? DEFAULT_MODEL
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`

  const body = {
    ...buildGeminiBody(messages),
    generationConfig: {
      temperature: opts.temperature ?? 0.25,
      maxOutputTokens: opts.maxTokens ?? 1024,
      topP: opts.topP ?? 1,
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Gemini request failed (${response.status}): ${detail}`)
  }

  const json = (await response.json()) as unknown
  return extractTextFromResponse(json)
}

/**
 * Streaming SSE from Gemini (`streamGenerateContent?alt=sse`).
 * Yields text deltas; reader is always released in `finally`.
 */
export async function* geminiStream(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): AsyncGenerator<string, void, void> {
  const apiKey = requireApiKey()
  const model = opts.model ?? DEFAULT_MODEL
  const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`

  const body = {
    ...buildGeminiBody(messages),
    generationConfig: {
      temperature: opts.temperature ?? 0.25,
      maxOutputTokens: opts.maxTokens ?? 1024,
      topP: opts.topP ?? 1,
    },
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Gemini stream failed (${response.status}): ${detail}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  try {
    while (true) {
      let chunk: { value: Uint8Array | undefined; done: boolean }
      try {
        chunk = await reader.read()
      } catch {
        break
      }
      if (chunk.done) break
      buffer += decoder.decode(chunk.value, { stream: true })

      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith("data:")) continue
        const payload = trimmed.slice(5).trim()
        if (!payload || payload === "[DONE]") continue
        try {
          const json = JSON.parse(payload) as unknown
          const text = extractTextFromResponse(json)
          if (text) yield text
        } catch {
          // ignore malformed chunks
        }
      }
    }
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* ignore */
    }
    try {
      reader.releaseLock()
    } catch {
      /* ignore */
    }
  }
}
