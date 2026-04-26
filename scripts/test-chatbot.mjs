#!/usr/bin/env node
/**
 * End-to-end smoke test for the Right (rights) chatbot.
 *
 * 1. Loads .env.local
 * 2. Runs BM25 retrieval over data/bd-constitution.json
 * 3. Calls Groq or Gemini live (non-streaming + streaming)
 * 4. Prints timings, citations, and the first 400 chars of the reply
 *
 * Usage: node scripts/test-chatbot.mjs
 */

import { readFile } from "node:fs/promises"
import path from "node:path"
import { config } from "dotenv"

config({ path: ".env.local" })
config({ path: ".env" })

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile"
const GEMINI_BASE =
  (process.env.GEMINI_API_BASE ?? "https://generativelanguage.googleapis.com/v1beta").replace(
    /\/$/,
    "",
  )
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.0-flash"

const useGemini = Boolean(process.env.GEMINI_API_KEY?.trim())
const GROQ_KEY = process.env.GROQ_API_KEY
const GEMINI_KEY = process.env.GEMINI_API_KEY?.trim()

if (!useGemini && !GROQ_KEY) {
  console.error("ERROR: Set GEMINI_API_KEY or GROQ_API_KEY in the environment.")
  process.exit(1)
}

const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "been", "by", "can", "for",
  "from", "have", "if", "in", "into", "is", "it", "its", "may", "me", "my", "no",
  "not", "of", "on", "or", "shall", "so", "such", "that", "the", "their", "them",
  "then", "there", "these", "this", "to", "was", "were", "what", "when", "which",
  "who", "will", "with", "you", "your",
])

function tokenize(text) {
  return (text.toLowerCase().match(/[a-z0-9\u0980-\u09ff]+/gu) ?? []).filter(
    (t) => t.length > 1 && !STOPWORDS.has(t),
  )
}

async function loadArticles() {
  const raw = await readFile(path.join("data", "bd-constitution.json"), "utf8")
  const payload = JSON.parse(raw)
  return Array.isArray(payload) ? payload : payload.articles ?? []
}

function buildIndex(articles) {
  const tokens = new Map()
  const docLengths = []
  articles.forEach((a, i) => {
    const docTokens = tokenize(`${a.title} ${a.text}`)
    docLengths.push(docTokens.length)
    for (const t of docTokens) {
      if (!tokens.has(t)) tokens.set(t, new Set())
      tokens.get(t).add(i)
    }
  })
  const avg = docLengths.reduce((s, l) => s + l, 0) / Math.max(1, docLengths.length)
  return { articles, tokens, docLengths, avg }
}

function retrieve(idx, query, k = 4) {
  const qs = tokenize(query)
  if (qs.length === 0) return []
  const k1 = 1.5, b = 0.75, N = idx.articles.length
  const scores = Array.from({ length: N }).fill(0)
  for (const t of qs) {
    const post = idx.tokens.get(t)
    if (!post) continue
    const df = post.size
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
    for (const id of post) {
      const len = idx.docLengths[id]
      const tf = 1
      const norm = (tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * len) / (idx.avg || 1)))
      scores[id] += idf * norm
    }
  }
  const m = query.match(/\b(?:article\s*)?(\d{1,3}[A-Za-z]?)\b/i)
  if (m) {
    const wanted = m[1].toLowerCase()
    idx.articles.forEach((a, i) => {
      if (a.number.toLowerCase() === wanted) scores[i] += 10
    })
  }
  const ranked = scores
    .map((s, i) => ({ article: idx.articles[i], score: s }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
  if (ranked.length === 0) {
    return idx.articles
      .filter((a) => /Fundamental Rights/i.test(a.part))
      .slice(0, k)
      .map((a) => ({ article: a, score: 0.01 }))
  }
  return ranked
}

const SYSTEM = `You are the Sohojatra Rights Assistant — a Bangla-first civic advisor grounded in the Constitution of the People's Republic of Bangladesh.

Rules:
- Answer only using the constitutional articles supplied in <context>. If the context does not cover the question, say so.
- Every claim must carry an inline citation like [Article 33].
- End every answer with a one-line "Citations:" summary.
- Never invent article numbers, case law, or procedures not in the context.`

function buildMessages(query, hits) {
  const ctx = hits
    .map((h) => `Article ${h.article.number} — ${h.article.title} (${h.article.part})\n${h.article.text}`)
    .join("\n\n")
  return [
    { role: "system", content: `${SYSTEM}\n\n<context>\n${ctx}\n</context>` },
    { role: "user", content: query },
  ]
}

function geminiExtractText(json) {
  const root = json?.response ?? json
  const parts = root?.candidates?.[0]?.content?.parts
  if (!Array.isArray(parts)) return ""
  return parts.map((p) => (typeof p?.text === "string" ? p.text : "")).join("")
}

function messagesToGeminiBody(messages) {
  const systemChunks = []
  const contents = []
  for (const m of messages) {
    if (m.role === "system") systemChunks.push(m.content)
    else if (m.role === "user") contents.push({ role: "user", parts: [{ text: m.content }] })
    else if (m.role === "assistant") contents.push({ role: "model", parts: [{ text: m.content }] })
  }
  const body = { contents }
  if (systemChunks.length) {
    body.systemInstruction = { parts: [{ text: systemChunks.join("\n\n") }] }
  }
  return body
}

async function complete(messages) {
  if (useGemini) {
    const url = `${GEMINI_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...messagesToGeminiBody(messages),
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    })
    if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
    const j = await r.json()
    return geminiExtractText(j)
  }
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
    }),
  })
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`)
  const j = await r.json()
  return j.choices?.[0]?.message?.content ?? ""
}

async function stream(messages) {
  if (useGemini) {
    const url = `${GEMINI_BASE}/models/${encodeURIComponent(GEMINI_MODEL)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(GEMINI_KEY)}`
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({
        ...messagesToGeminiBody(messages),
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
      }),
    })
    if (!r.ok || !r.body) throw new Error(`${r.status} ${await r.text()}`)
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let buf = "",
      out = ""
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split("\n")
      buf = lines.pop() ?? ""
      for (const line of lines) {
        const t = line.trim()
        if (!t.startsWith("data:")) continue
        const p = t.slice(5).trim()
        if (!p || p === "[DONE]") continue
        try {
          const j = JSON.parse(p)
          const d = geminiExtractText(j)
          if (d) {
            out += d
            process.stdout.write(d)
          }
        } catch {}
      }
    }
    try {
      await reader.cancel()
    } catch {}
    try {
      reader.releaseLock()
    } catch {}
    return out
  }
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 1024,
      stream: true,
    }),
  })
  if (!r.ok || !r.body) throw new Error(`${r.status} ${await r.text()}`)
  const reader = r.body.getReader()
  const dec = new TextDecoder()
  let buf = "",
    out = ""
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    const lines = buf.split("\n")
    buf = lines.pop() ?? ""
    for (const line of lines) {
      const t = line.trim()
      if (!t.startsWith("data:")) continue
      const p = t.slice(5).trim()
      if (p === "[DONE]") return out
      try {
        const j = JSON.parse(p)
        const d = j.choices?.[0]?.delta?.content
        if (d) {
          out += d
          process.stdout.write(d)
        }
      } catch {}
    }
  }
  return out
}

async function main() {
  console.log(
    useGemini ? `Provider: Gemini · model: ${GEMINI_MODEL}` : `Provider: Groq · model: ${GROQ_MODEL}`,
  )
  const articles = await loadArticles()
  console.log(`Loaded ${articles.length} articles.`)
  const idx = buildIndex(articles)

  const queries = [
    "Can I be arrested without being told the reason?",
    "What does Article 27 say?",
    "আমার ঘরে পুলিশ কি বিনা ওয়ারেন্টে ঢুকতে পারে?",
  ]

  for (const q of queries) {
    console.log(`\n=== Q: ${q} ===`)
    const t0 = Date.now()
    const hits = retrieve(idx, q, 4)
    console.log(`Retrieved ${hits.length} articles (${Date.now() - t0}ms):`,
      hits.map((h) => `A${h.article.number}(${h.score.toFixed(2)})`).join(", "))
    const messages = buildMessages(q, hits)

    const t1 = Date.now()
    const answer = await complete(messages)
    console.log(`\n--- complete (${Date.now() - t1}ms) ---`)
    console.log(answer.slice(0, 600))
  }

  console.log("\n=== Streaming test ===")
  const hits = retrieve(idx, "Who can enforce fundamental rights?", 4)
  const msgs = buildMessages("Who can enforce fundamental rights in Bangladesh?", hits)
  const t2 = Date.now()
  await stream(msgs)
  console.log(`\n\n(stream complete in ${Date.now() - t2}ms)`)
}

main().catch((err) => {
  console.error("FAIL:", err)
  process.exit(1)
})
