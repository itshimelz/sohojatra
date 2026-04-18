import { formatCitation, retrieve, type ConstitutionArticle } from "./constitution"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

// Default to Llama 3.3 70B on Groq — the Unsloth LoRA can later be merged and
// served through a Groq-compatible endpoint (Ollama / vLLM). Override with
// GROQ_MODEL=llama-3.1-8b-instant for a cheaper/faster tier.
const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"

const SYSTEM_PROMPT = `You are the Sohojatra Rights Assistant — a Bangla-first civic advisor grounded in the Constitution of the People's Republic of Bangladesh.

Rules:
- Answer only using the constitutional articles supplied in <context>. If the context does not cover the question, say "I cannot find this in the Constitution I have loaded" and suggest where the citizen should look.
- Every claim must carry an inline citation like [Article 33].
- Prefer short, direct language. If the user writes in Bangla or Banglish, reply in the same register.
- End every answer with a one-line "Citations:" summary listing each cited article once.
- Never invent article numbers, case law, or procedures that are not in the context.`

export type ChatRole = "user" | "assistant" | "system"
export type ChatMessage = { role: ChatRole; content: string }

export type GroqChatOptions = {
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
}

export class GroqConfigError extends Error {}

function requireApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    throw new GroqConfigError(
      "GROQ_API_KEY is not set. Add it to .env to enable the rights chatbot.",
    )
  }
  return key
}

export function buildContext(articles: ConstitutionArticle[]): string {
  if (articles.length === 0) return "<context>\n(no matching articles)\n</context>"
  const blocks = articles.map(
    (a) => `Article ${a.number} — ${a.title} (${a.part})\n${a.text}`,
  )
  return `<context>\n${blocks.join("\n\n")}\n</context>`
}

export async function retrieveAndPrompt(
  history: ChatMessage[],
  query: string,
): Promise<{ messages: ChatMessage[]; citations: string[] }> {
  const hits = await retrieve(query, 4)
  const context = buildContext(hits.map((h) => h.article))
  const citations = hits.map((h) => formatCitation(h.article))

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...history.filter((m) => m.role !== "system"),
    { role: "user", content: query },
  ]

  return { messages, citations }
}

/** One-shot completion. Use this for the non-streaming JSON route. */
export async function groqComplete(
  messages: ChatMessage[],
  opts: GroqChatOptions = {},
): Promise<string> {
  const apiKey = requireApiKey()
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1024,
      top_p: opts.topP ?? 1,
      stream: false,
    }),
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Groq request failed (${response.status}): ${detail}`)
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return json.choices?.[0]?.message?.content ?? ""
}

/** Streaming SSE completion — yields text deltas as they arrive. */
export async function* groqStream(
  messages: ChatMessage[],
  opts: GroqChatOptions = {},
): AsyncGenerator<string, void, void> {
  const apiKey = requireApiKey()
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.maxTokens ?? 1024,
      top_p: opts.topP ?? 1,
      stream: true,
    }),
  })

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Groq stream failed (${response.status}): ${detail}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data:")) continue
      const payload = trimmed.slice(5).trim()
      if (payload === "[DONE]") return
      try {
        const json = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = json.choices?.[0]?.delta?.content
        if (delta) yield delta
      } catch {
        // ignore malformed keep-alive chunks
      }
    }
  }
}
