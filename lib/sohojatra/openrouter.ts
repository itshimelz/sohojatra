import type { ChatMessage, LlmChatOptions } from "./llm-chat-types"
import { RightsChatConfigError } from "./rights-chat-config-error"

const OPENROUTER_URL =
  process.env.OPENROUTER_API_BASE?.replace(/\/$/, "") ??
  "https://openrouter.ai/api/v1/chat/completions"

/** Default: Gemma 4 31B free tier on OpenRouter (slug may change — override with OPENROUTER_MODEL). */
const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL ?? "google/gemma-4-31b-it:free"

function requireApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY
  if (!key?.trim()) {
    throw new RightsChatConfigError(
      "OPENROUTER_API_KEY is not set. Add it to .env.local to use OpenRouter for the rights chatbot.",
    )
  }
  return key.trim()
}

function openrouterHeaders(apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }
  const ref = process.env.OPENROUTER_HTTP_REFERER?.trim()
  if (ref) headers["HTTP-Referer"] = ref
  const title = process.env.OPENROUTER_APP_TITLE?.trim()
  if (title) headers["X-Title"] = title
  return headers
}

export async function openrouterComplete(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): Promise<string> {
  const apiKey = requireApiKey()
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openrouterHeaders(apiKey),
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.25,
      max_tokens: opts.maxTokens ?? 1024,
      top_p: opts.topP ?? 1,
      stream: false,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`OpenRouter request failed (${response.status}): ${detail}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  return json.choices?.[0]?.message?.content ?? ""
}

export async function* openrouterStream(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
): AsyncGenerator<string, void, void> {
  const apiKey = requireApiKey()
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openrouterHeaders(apiKey),
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.25,
      max_tokens: opts.maxTokens ?? 1024,
      top_p: opts.topP ?? 1,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new Error(`OpenRouter stream failed (${response.status}): ${detail}`)
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
        if (payload === "[DONE]") return
        try {
          const json = JSON.parse(payload) as {
            choices?: Array<{ delta?: { content?: string | null } }>
          }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta
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
