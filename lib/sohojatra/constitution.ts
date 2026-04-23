import { readFile } from "node:fs/promises"
import path from "node:path"

export type ConstitutionArticle = {
  number: string
  title: string
  part: string
  text: string
}

type ConstitutionPayload = {
  title?: string
  articles?: ConstitutionArticle[]
}

let cache: {
  articles: ConstitutionArticle[]
  tokens: Map<string, Set<number>>
  docLengths: number[]
  avgDocLength: number
} | null = null

const STOPWORDS = new Set([
  "a", "an", "and", "any", "are", "as", "at", "be", "been", "by", "can", "for",
  "from", "have", "if", "in", "into", "is", "it", "its", "may", "me", "my", "no",
  "not", "of", "on", "or", "shall", "so", "such", "that", "the", "their", "them",
  "then", "there", "these", "this", "to", "was", "were", "what", "when", "which",
  "who", "will", "with", "you", "your",
])

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9\u0980-\u09ff]+/gu) ?? []).filter(
    (tok) => tok.length > 1 && !STOPWORDS.has(tok),
  )
}

async function loadFromDisk(): Promise<ConstitutionArticle[]> {
  const file = path.join(process.cwd(), "data", "bd-constitution.json")
  const raw = await readFile(file, "utf8")
  const payload = JSON.parse(raw) as ConstitutionPayload | ConstitutionArticle[]
  const articles = Array.isArray(payload) ? payload : payload.articles ?? []
  return articles.filter((a): a is ConstitutionArticle => Boolean(a?.number && a?.text))
}

async function ensureIndex() {
  if (cache) return cache

  const articles = await loadFromDisk()
  const tokens = new Map<string, Set<number>>()
  const docLengths: number[] = []

  articles.forEach((article, docId) => {
    const docTokens = tokenize(`${article.title} ${article.text}`)
    docLengths.push(docTokens.length)
    for (const tok of docTokens) {
      if (!tokens.has(tok)) tokens.set(tok, new Set())
      tokens.get(tok)!.add(docId)
    }
  })

  const avgDocLength =
    docLengths.reduce((sum, l) => sum + l, 0) / Math.max(docLengths.length, 1)

  cache = { articles, tokens, docLengths, avgDocLength }
  return cache
}

/** BM25 retrieval over the constitution (in-memory, deterministic). */
export async function retrieve(
  query: string,
  topK = 4,
): Promise<Array<{ article: ConstitutionArticle; score: number }>> {
  const index = await ensureIndex()
  const queryTokens = tokenize(query)

  // Pure Bangla/no-Latin query → tokenizer yields nothing.
  // Return top Part III articles so the model has grounded context.
  if (queryTokens.length === 0) {
    return index.articles
      .filter((a) => /Fundamental Rights/i.test(a.part))
      .slice(0, topK)
      .map((article) => ({ article, score: 0.01 }))
  }

  const k1 = 1.5
  const b = 0.75
  const N = index.articles.length
  const scores = new Array<number>(N).fill(0)

  for (const tok of queryTokens) {
    const postings = index.tokens.get(tok)
    if (!postings) continue
    const df = postings.size
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5))
    for (const docId of postings) {
      const docLen = index.docLengths[docId] ?? 1
      const tf = 1
      const norm =
        (tf * (k1 + 1)) /
        (tf + k1 * (1 - b + (b * docLen) / (index.avgDocLength || 1)))
      scores[docId] += idf * norm
    }
  }

  // Boost exact article-number matches ("Article 33", "33")
  const numberMatch = query.match(/\b(?:article\s*)?(\d{1,3}[A-Za-z]?)\b/i)
  if (numberMatch) {
    const wanted = numberMatch[1]!.toLowerCase()
    index.articles.forEach((a, i) => {
      if (a.number.toLowerCase() === wanted) scores[i] += 10
    })
  }

  const ranked = scores
    .map((score, docId) => ({ article: index.articles[docId]!, score }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)

  // If the English query produced scores but ALL below threshold, it means
  // the question is about something outside the 21 loaded articles. Return
  // empty — the system prompt will tell the model to say so honestly.
  const MIN_SCORE = 0.3
  const meaningful = ranked.filter((r) => r.score >= MIN_SCORE)
  if (meaningful.length > 0) return meaningful

  // Low-confidence fallback: return the top BM25 hits even if weak, so the
  // model has some context. Score is preserved so groq.ts can filter citations.
  return ranked
}

export async function getArticle(number: string): Promise<ConstitutionArticle | null> {
  const index = await ensureIndex()
  return (
    index.articles.find((a) => a.number.toLowerCase() === number.toLowerCase()) ?? null
  )
}

export async function totalArticles(): Promise<number> {
  const index = await ensureIndex()
  return index.articles.length
}

export function formatCitation(article: ConstitutionArticle): string {
  return `Article ${article.number}, ${article.title} — Constitution of Bangladesh`
}
