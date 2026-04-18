import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

type VerificationRecord = {
  id: string
  type: "nid" | "passport"
  valueHash: string
  status: "verified" | "needs-review" | "rejected"
  trustScore: number
  createdAt: string
}

type Badge = {
  id: string
  key: string
  label: string
  description: string
  awardedTo: string
  awardedAt: string
}

type WorkspaceThread = {
  id: string
  title: string
  messages: Array<{
    id: string
    author: string
    text: string
    createdAt: string
  }>
}

type DriftMetric = {
  id: string
  model: string
  baseline: number
  current: number
  drift: number
  createdAt: string
}

type LeaderboardEntry = {
  id: string
  university: string
  solvedConcerns: number
  acceptedResearch: number
  score: number
}

type VectorPoint = {
  id: string
  text: string
  vector: number[]
  metadata?: Record<string, string>
}

type AdvancedState = {
  verifications: VerificationRecord[]
  badges: Badge[]
  threads: WorkspaceThread[]
  driftMetrics: DriftMetric[]
  leaderboard: LeaderboardEntry[]
  vectors: VectorPoint[]
}

const statePath = join(process.cwd(), ".sohojatra-advanced.json")

function uid(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function hash(input: string) {
  let h = 0
  for (let index = 0; index < input.length; index += 1) {
    h = (h << 5) - h + input.charCodeAt(index)
    h |= 0
  }

  return String(Math.abs(h))
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\u0980-\u09ff]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
}

function embed(text: string) {
  const vector = Array.from({ length: 16 }, () => 0)
  tokenize(text).forEach((token, tokenIndex) => {
    const tokenHash = Number(hash(token))
    vector[tokenIndex % 16] += (tokenHash % 1000) / 1000
  })

  return vector.map((value) => Number((value / Math.max(1, tokenize(text).length)).toFixed(4)))
}

function cosine(left: number[], right: number[]) {
  let dot = 0
  let leftNorm = 0
  let rightNorm = 0

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm)
  if (denominator === 0) return 0
  return dot / denominator
}

function defaultState(): AdvancedState {
  return {
    verifications: [],
    badges: [],
    threads: [],
    driftMetrics: [],
    leaderboard: [
      {
        id: "lb-1",
        university: "BUET",
        solvedConcerns: 29,
        acceptedResearch: 12,
        score: 93,
      },
      {
        id: "lb-2",
        university: "University of Dhaka",
        solvedConcerns: 23,
        acceptedResearch: 15,
        score: 90,
      },
    ],
    vectors: [],
  }
}

const state: AdvancedState = loadState()

function loadState(): AdvancedState {
  if (!existsSync(statePath)) return defaultState()

  try {
    const raw = readFileSync(statePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<AdvancedState>

    return {
      verifications: Array.isArray(parsed.verifications) ? parsed.verifications : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
      threads: Array.isArray(parsed.threads) ? parsed.threads : [],
      driftMetrics: Array.isArray(parsed.driftMetrics) ? parsed.driftMetrics : [],
      leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : defaultState().leaderboard,
      vectors: Array.isArray(parsed.vectors) ? parsed.vectors : [],
    }
  } catch {
    return defaultState()
  }
}

function saveState() {
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8")
}

export function verifyNid(nid: string) {
  const clean = nid.replace(/\D/g, "")
  const valid = clean.length === 10 || clean.length === 13 || clean.length === 17
  const trustScore = valid ? 86 : 30

  const record: VerificationRecord = {
    id: uid("v"),
    type: "nid",
    valueHash: hash(clean),
    status: valid ? "verified" : "needs-review",
    trustScore,
    createdAt: new Date().toISOString(),
  }

  state.verifications.unshift(record)
  saveState()
  return record
}

export function verifyPassport(passport: string) {
  const clean = passport.trim().toUpperCase()
  // Generic validation for passports: typical alphanumeric format
  const valid = /^[A-Z0-9]{7,15}$/.test(clean)
  const trustScore = valid ? 92 : 25

  const record: VerificationRecord = {
    id: uid("v"),
    type: "passport",
    valueHash: hash(clean),
    status: valid ? "verified" : "needs-review",
    trustScore,
    createdAt: new Date().toISOString(),
  }

  state.verifications.unshift(record)
  saveState()
  return record
}


export function trustFromFingerprint(input: {
  fingerprint: string
  ip?: string
  recentFailures?: number
  velocity?: number
}) {
  let score = 75
  if (input.fingerprint.length < 12) score -= 15
  if ((input.recentFailures ?? 0) > 2) score -= 20
  if ((input.velocity ?? 0) > 8) score -= 15
  if ((input.ip ?? "").startsWith("10.")) score += 2

  return {
    trustScore: Math.max(0, Math.min(100, score)),
    level: score >= 80 ? "trusted" : score >= 55 ? "watch" : "restricted",
  }
}

export function anonymousVerifiedProfile(userId: string) {
  return {
    userId,
    anonId: `anon-${hash(userId).slice(0, 8)}`,
    canPost: true,
    canVote: true,
    piiMasked: true,
  }
}

export function createThread(title: string) {
  const thread: WorkspaceThread = {
    id: uid("t"),
    title: title.trim() || "Untitled collaborative thread",
    messages: [],
  }

  state.threads.unshift(thread)
  saveState()
  return thread
}

export function postThreadMessage(threadId: string, author: string, text: string) {
  const thread = state.threads.find((item) => item.id === threadId)
  if (!thread) return null

  const message = {
    id: uid("m"),
    author: author.trim() || "Citizen",
    text: text.trim(),
    createdAt: new Date().toISOString(),
  }

  thread.messages.unshift(message)
  saveState()
  return message
}

export function listThreads() {
  return state.threads
}

export function listLeaderboard() {
  return state.leaderboard.slice().sort((left, right) => right.score - left.score)
}

export function addBadge(input: {
  key: string
  label: string
  description: string
  awardedTo: string
}) {
  const badge: Badge = {
    id: uid("b"),
    key: input.key,
    label: input.label,
    description: input.description,
    awardedTo: input.awardedTo,
    awardedAt: new Date().toISOString(),
  }

  state.badges.unshift(badge)
  saveState()
  return badge
}

export function listBadges() {
  return state.badges
}

export function registerVector(input: {
  id?: string
  text: string
  metadata?: Record<string, string>
}) {
  const point: VectorPoint = {
    id: input.id ?? uid("vec"),
    text: input.text,
    vector: embed(input.text),
    metadata: input.metadata,
  }

  state.vectors = state.vectors.filter((item) => item.id !== point.id)
  state.vectors.push(point)
  saveState()
  return point
}

export function queryVectors(query: string, topK = 5) {
  const queryVector = embed(query)
  return state.vectors
    .map((item) => ({
      ...item,
      similarity: Number(cosine(queryVector, item.vector).toFixed(4)),
    }))
    .sort((left, right) => right.similarity - left.similarity)
    .slice(0, topK)
}

export function ragRetrieve(question: string) {
  const contexts = queryVectors(question, 3)
  const evidence = contexts.map((item) => item.text)
  return {
    question,
    answer: evidence.length
      ? `Retrieved ${evidence.length} relevant civic records for: ${question}`
      : `No indexed records found yet for: ${question}`,
    evidence,
  }
}

export function detectMobGraph(input: {
  nodes: number
  edges: number
  burstVotes: number
  repeatedTextRatio: number
}) {
  const density = input.nodes <= 1 ? 0 : input.edges / (input.nodes * (input.nodes - 1))
  const score = Math.round(
    Math.max(
      0,
      Math.min(100, density * 40 + input.burstVotes * 4 + input.repeatedTextRatio * 40)
    )
  )

  return {
    density: Number(density.toFixed(4)),
    riskScore: score,
    label: score >= 70 ? "high-risk-coordination" : score >= 45 ? "watchlist" : "normal",
  }
}

export function banglaNlpAnalyze(text: string) {
  const tokens = tokenize(text)
  const banglaTokens = tokens.filter((token) => /[\u0980-\u09ff]/.test(token))
  const entities = banglaTokens.filter((token) => token.length > 4).slice(0, 8)

  return {
    tokenCount: tokens.length,
    banglaTokenCount: banglaTokens.length,
    entities,
    sentiment:
      /দুর্নীতি|সমস্যা|জরুরি|বিপদ/.test(text) ? "urgency" : /ধন্যবাদ|ভালো|সমাধান/.test(text) ? "positive" : "neutral",
  }
}

export function logDriftMetric(input: { model: string; baseline: number; current: number }) {
  const drift = Math.abs(input.current - input.baseline)
  const metric: DriftMetric = {
    id: uid("dr"),
    model: input.model,
    baseline: input.baseline,
    current: input.current,
    drift,
    createdAt: new Date().toISOString(),
  }

  state.driftMetrics.unshift(metric)
  saveState()

  return {
    ...metric,
    status: drift > 0.15 ? "retrain-required" : drift > 0.08 ? "monitor" : "stable",
  }
}

export function listDriftMetrics() {
  return state.driftMetrics
}

export function ussdReply(input: { phone: string; text: string }) {
  const normalized = input.text.trim().toLowerCase()
  if (!normalized) {
    return {
      sessionState: "CONTINUE",
      response: "Welcome to Sohojatra. Reply 1: Report issue, 2: Check status, 3: Language",
    }
  }

  if (normalized === "1") {
    return { sessionState: "CONTINUE", response: "Enter issue short title." }
  }

  if (normalized === "2") {
    return { sessionState: "CONTINUE", response: "Enter concern ID (example: c-001)." }
  }

  return { sessionState: "END", response: "Thank you. A support agent will follow up by SMS." }
}

export function smsFallback(input: { phone: string; message: string }) {
  return {
    id: uid("sms"),
    phone: input.phone,
    accepted: true,
    status: "queued",
    message: input.message,
    createdAt: new Date().toISOString(),
  }
}
