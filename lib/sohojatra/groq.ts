import { formatCitation, retrieve, type ConstitutionArticle } from "./constitution"
import type { ChatMessage, LlmChatOptions } from "./llm-chat-types"
import { RightsChatConfigError } from "./rights-chat-config-error"

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"

// The chatbot covers these 21 articles from the Bangladesh Constitution.
// Articles: 7, 11, 26–44, 102
const COVERED_ARTICLES = [
  "7 (Supremacy of the Constitution)",
  "11 (Democracy and human rights)",
  "26 (Laws inconsistent with fundamental rights to be void)",
  "27 (Equality before law)",
  "28 (Discrimination on grounds of religion, race, sex etc.)",
  "29 (Equality of opportunity in public employment)",
  "31 (Right to protection of law)",
  "32 (Protection of right to life and personal liberty)",
  "33 (Safeguards as to arrest and detention)",
  "34 (Prohibition of forced labour)",
  "35 (Protection in respect of trial and punishment)",
  "36 (Freedom of movement)",
  "37 (Freedom of assembly)",
  "38 (Freedom of association)",
  "39 (Freedom of thought, conscience and speech)",
  "40 (Freedom of profession or occupation)",
  "41 (Freedom of religion)",
  "42 (Rights to property)",
  "43 (Protection of home and correspondence)",
  "44 (Enforcement of fundamental rights)",
  "102 (Powers of High Court Division)",
].join(", ")

const SYSTEM_PROMPT = `You are the Sohojatra Rights Assistant — a knowledgeable civic advisor on the Constitution of the People's Republic of Bangladesh.

You have access to these 21 constitutional articles: ${COVERED_ARTICLES}.

Rules:
1. Use ONLY the constitutional articles provided in <context> to answer.
2. Every factual claim must have an inline citation: [Article 33].
3. Reply in the same language as the user — if they write in Bangla, reply in Bangla; if English, reply in English.
4. Be clear, direct, and practical. Citizens need to understand their rights in plain language.
5. Do NOT add a "Citations:" block at the end. Inline citations within your answer are enough.
6. If the question is about something NOT covered by the 21 articles above, clearly say: "This topic is not in the constitutional articles I have loaded (Articles 7, 11, 26–44, 102). For this, consult a legal professional or visit the Bangladesh Supreme Court website."
7. Never invent article numbers, procedures, or case law not present in <context>.`

export type { ChatRole, ChatMessage, LlmChatOptions as GroqChatOptions } from "./llm-chat-types"

/** @deprecated Use RightsChatConfigError from ./rights-chat-config-error */
export { RightsChatConfigError as GroqConfigError } from "./rights-chat-config-error"

function requireApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    throw new RightsChatConfigError(
      "GROQ_API_KEY is not set. Add it to .env.local for the Groq provider (or use Gemini / OpenRouter with their keys).",
    )
  }
  return key
}

export function buildContext(articles: ConstitutionArticle[]): string {
  if (articles.length === 0) return "<context>\n(no matching articles found)\n</context>"
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
  const citations = hits
    .filter((h) => h.score > 0)
    .map((h) => formatCitation(h.article))

  const messages: ChatMessage[] = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${context}` },
    ...history.filter((m) => m.role !== "system"),
    { role: "user", content: query },
  ]

  return { messages, citations }
}

/** One-shot completion for the non-streaming JSON route. */
export async function groqComplete(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
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
      temperature: opts.temperature ?? 0.25,
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

/**
 * Streaming SSE completion — yields text deltas as they arrive from Groq.
 * The reader is always released in the finally block to prevent stream leaks
 * that cause unhandledRejection errors.
 */
export async function* groqStream(
  messages: ChatMessage[],
  opts: LlmChatOptions = {},
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
      temperature: opts.temperature ?? 0.25,
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

  try {
    while (true) {
      let chunk: { value: Uint8Array | undefined; done: boolean }
      try {
        chunk = await reader.read()
      } catch {
        // Network error mid-stream — exit cleanly
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
            choices?: Array<{ delta?: { content?: string } }>
          }
          const delta = json.choices?.[0]?.delta?.content
          if (delta) yield delta
        } catch {
          // ignore malformed keep-alive chunks
        }
      }
    }
  } finally {
    // Always release the reader to prevent "[object Event]" unhandledRejection
    try { await reader.cancel() } catch { /* ignore */ }
    try { reader.releaseLock() } catch { /* ignore */ }
  }
}
