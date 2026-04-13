import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

import { MOCK_CONCERNS, type Concern } from "@/lib/concerns/mock"
import { prisma } from "@/lib/prisma"

type ProposalComment = {
  id: string
  author: string
  body: string
  createdAt: string
  quote?: string
  points: number
  upvotes?: number
  downvotes?: number
}

export type ProposalRecord = {
  id: string
  title: string
  body: string
  author: string
  category: string
  votes: number
  downvotes: number
  createdAt: string
  comments: ProposalComment[]
  status?: string
}

type ResearchProblem = {
  id: string
  title: string
  ministry: string
  grant: string
  deadline: string
  summary: string
}

type ModerationFlag = {
  id: string
  title: string
  reason: string
  severity: "Low" | "Medium" | "High"
  status: "Pending" | "Needs Review" | "Escalated" | "Approved" | "Rejected"
  reviewedBy?: string
}

type Award = {
  id: string
  proposalId: string
  title: string
  description: string
  awardedTo: string
  createdAt: string
  value?: string
}

type StateFile = {
  concerns: Concern[]
  proposals: ProposalRecord[]
  researchProblems: ResearchProblem[]
  moderation: ModerationFlag[]
  awards: Award[]
}

const stateFilePath = join(process.cwd(), ".sohojatra-state.json")

const defaultState: StateFile = {
  concerns: [...MOCK_CONCERNS],
  proposals: [
    {
      id: "p-101",
      title: "Create ward-level drainage status board",
      body:
        "Every ward should publish a live drainage map with blocked lines, cleaning status, and the next maintenance date.",
      author: "Dr. Rafiq Hasan",
      category: "Infrastructure",
      votes: 421,
      downvotes: 12,
      status: "Active",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      comments: [
        {
          id: "pc-1",
          author: "Amina Noor",
          body: "Add photo proof and the ward engineer name so follow-up becomes measurable.",
          createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          points: 92,
          upvotes: 92,
          downvotes: 2,
        },
      ],
    },
  ],
  researchProblems: [
    {
      id: "rp-11",
      title: "Flood-prone intersection prediction in Dhaka South",
      ministry: "Ministry of Local Government",
      grant: "BDT 12,00,000",
      deadline: "15 May 2026",
      summary:
        "Build a model that predicts flood-prone intersections using rainfall, drainage status, and past complaint density.",
    },
  ],
  moderation: [
    {
      id: "mq-1",
      title: "Proposal: anti-dumping zone near school",
      reason: "Needs source citations and contractor references",
      severity: "Medium",
      status: "Pending",
    },
  ],
  awards: [
    {
      id: "a-1",
      proposalId: "p-101",
      title: "Infrastructure Innovation Award",
      description: "Awarded for excellence in civic infrastructure planning",
      awardedTo: "Dr. Rafiq Hasan",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      value: "BDT 50,000",
    },
  ],
}

let state = loadState()

const db = prisma as unknown as Record<string, any>

function hasModel(modelName: string) {
  return Boolean(db?.[modelName])
}

function uniqueId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneState<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function loadState(): StateFile {
  if (!existsSync(stateFilePath)) {
    return cloneState(defaultState)
  }

  try {
    const raw = readFileSync(stateFilePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<StateFile>

    return {
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : cloneState(defaultState.concerns),
      proposals: Array.isArray(parsed.proposals) ? parsed.proposals : cloneState(defaultState.proposals),
      researchProblems: Array.isArray(parsed.researchProblems)
        ? parsed.researchProblems
        : cloneState(defaultState.researchProblems),
      moderation: Array.isArray(parsed.moderation) ? parsed.moderation : cloneState(defaultState.moderation),
      awards: Array.isArray(parsed.awards) ? parsed.awards : cloneState(defaultState.awards),
    }
  } catch {
    return cloneState(defaultState)
  }
}

function saveState() {
  writeFileSync(stateFilePath, JSON.stringify(state, null, 2), "utf8")
}

function nextConcernSort(left: Concern, right: Concern) {
  if (right.upvotes !== left.upvotes) {
    return right.upvotes - left.upvotes
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
}

function mapConcernRow(row: any): Concern {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    hasUpvoted: row.hasUpvoted ?? false,
    createdAt: new Date(row.createdAt).toISOString(),
    author: { name: row.authorName },
    location: {
      lat: Number(row.locationLat),
      lng: Number(row.locationLng),
      address: row.location ?? undefined,
    },
    photos: Array.isArray(row.photos) ? row.photos : [],
    updates: Array.isArray(row.updates) ? row.updates : [],
  }
}

function mapProposalRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    author: row.authorName,
    category: row.category,
    votes: row.votes ?? 0,
    downvotes: row.downvotes ?? 0,
    createdAt: new Date(row.createdAt).toISOString(),
    comments: Array.isArray(row.comments)
      ? row.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.authorName,
          body: comment.body,
          createdAt: new Date(comment.createdAt).toISOString(),
          quote: comment.quoted ?? undefined,
          points: comment.aiPriorityScore ?? 0,
        }))
      : [],
  }
}

function mapResearchRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    ministry: row.ministry,
    grant: row.grantAmount,
    deadline: row.deadline,
    summary: row.summary,
  }
}

function mapModerationRow(row: any) {
  return {
    id: row.id,
    title: row.title,
    reason: row.reason,
    severity: row.severity,
    status: row.status,
  }
}

export async function listConcerns() {
  if (hasModel("concern")) {
    try {
      const rows = await db.concern.findMany({ orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }] })
      return rows.map(mapConcernRow)
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.concerns).sort(nextConcernSort)
}

export async function getConcern(concernId: string) {
  if (hasModel("concern")) {
    try {
      const row = await db.concern.findUnique({ where: { id: concernId } })
      return row ? mapConcernRow(row) : null
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return state.concerns.find((concern) => concern.id === concernId) ?? null
}

export async function createConcern(input: {
  title: string
  description: string
  authorName?: string
  locationLat: number
  locationLng: number
  location?: string
  photos?: string[]
}) {
  const now = new Date().toISOString()
  const concern: Concern = {
    id: uniqueId("c"),
    title: input.title.trim(),
    description: input.description.trim(),
    status: "Submitted",
    upvotes: 1,
    downvotes: 0,
    hasUpvoted: true,
    createdAt: now,
    author: { name: input.authorName?.trim() || "Verified Citizen" },
    location: {
      lat: input.locationLat,
      lng: input.locationLng,
      address: input.location,
    },
    photos: input.photos ?? [],
    updates: [
      {
        id: uniqueId("u"),
        status: "Submitted",
        timestamp: now,
        author: input.authorName?.trim() || "Verified Citizen",
        note: "Concern submitted and queued for review.",
      },
    ],
  }

  if (hasModel("concern")) {
    try {
      await db.concern.create({
        data: {
          id: concern.id,
          title: concern.title,
          description: concern.description,
          status: concern.status,
          upvotes: concern.upvotes,
          downvotes: concern.downvotes,
          hasUpvoted: concern.hasUpvoted,
          authorName: concern.author.name,
          locationLat: concern.location.lat,
          locationLng: concern.location.lng,
          location: concern.location.address ?? null,
          photos: concern.photos,
          updates: concern.updates,
        },
      })
      return concern
    } catch {
      // Fall through to local persistence.
    }
  }

  state.concerns.unshift(concern)
  saveState()
  return concern
}

export async function listProposals() {
  if (hasModel("proposal")) {
    try {
      const rows = await db.proposal.findMany({
        orderBy: [{ votes: "desc" }, { createdAt: "desc" }],
        include: { comments: true },
      })

      return rows.map(mapProposalRow)
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.proposals)
}

export async function createProposal(input: {
  title: string
  body: string
  author: string
  category?: string
}) {
  const proposal: ProposalRecord = {
    id: uniqueId("p"),
    title: input.title.trim(),
    body: input.body.trim(),
    author: input.author.trim(),
    category: input.category?.trim() || "General",
    votes: 1,
    downvotes: 0,
    createdAt: new Date().toISOString(),
    comments: [],
  }

  if (hasModel("proposal")) {
    try {
      await db.proposal.create({
        data: {
          id: proposal.id,
          title: proposal.title,
          body: proposal.body,
          authorName: proposal.author,
          category: proposal.category,
          votes: proposal.votes,
          downvotes: proposal.downvotes,
          status: "Pending",
          aiPriorityScore: 0,
        },
      })
      return proposal
    } catch {
      // Fall through to local persistence.
    }
  }

  state.proposals.unshift(proposal)
  saveState()
  return proposal
}

export async function addProposalComment(
  proposalId: string,
  input: { author: string; body: string; quote?: string }
) {
  if (hasModel("comment")) {
    try {
      const proposal = await db.proposal.findUnique({ where: { id: proposalId } })
      if (!proposal) {
        return null
      }

      const comment = await db.comment.create({
        data: {
          id: uniqueId("pc"),
          body: input.body.trim(),
          authorName: input.author.trim(),
          quoted: input.quote ?? null,
          proposalId,
          aiPriorityScore: 0,
        },
      })

      return {
        id: comment.id,
        author: comment.authorName,
        body: comment.body,
        createdAt: new Date(comment.createdAt).toISOString(),
        quote: comment.quoted ?? undefined,
        points: comment.aiPriorityScore ?? 0,
      }
    } catch {
      // Fall through to local persistence.
    }
  }

  const proposal = state.proposals.find((item) => item.id === proposalId)
  if (!proposal) {
    return null
  }

  const comment: ProposalComment = {
    id: uniqueId("pc"),
    author: input.author.trim(),
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    quote: input.quote,
    points: 0,
  }

  proposal.comments.unshift(comment)
  saveState()
  return comment
}

export async function listResearchProblems() {
  if (hasModel("researchProblem")) {
    try {
      const rows = await db.researchProblem.findMany({ orderBy: [{ createdAt: "desc" }] })
      return rows.map(mapResearchRow)
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.researchProblems)
}

export async function listModerationQueue() {
  if (hasModel("moderationFlag")) {
    try {
      const rows = await db.moderationFlag.findMany({ orderBy: [{ createdAt: "desc" }] })
      return rows.map(mapModerationRow)
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.moderation)
}

export async function getDashboardSnapshot() {
  const concerns = await listConcerns()
  const moderation = await listModerationQueue()

  return {
    kpis: [
      { label: "Avg. resolution time", value: "64h", detail: "Across active ministries this month" },
      { label: "Open vs resolved", value: `${concerns.length} : ${Math.max(1, concerns.filter((concern: Concern) => concern.status === "Resolved").length)}`, detail: "Public issue backlog improving" },
      { label: "Citizen satisfaction", value: "4.3/5", detail: "Post-resolution ratings from verified users" },
      { label: "Assembly events", value: "18", detail: "Town halls published with minutes" },
    ],
    moderation,
    concerns: concerns.slice(0, 6),
  }
}

// --- Voting Operations ---

export async function voteOnProposal(proposalId: string, increment: number = 1) {
  const proposal = state.proposals.find((p) => p.id === proposalId)
  if (!proposal) return null

  proposal.votes = Math.max(0, proposal.votes + increment)
  saveState()
  return proposal
}

export async function downvoteProposal(proposalId: string, increment: number = 1) {
  const proposal = state.proposals.find((p) => p.id === proposalId)
  if (!proposal) return null

  proposal.downvotes = Math.max(0, proposal.downvotes + increment)
  saveState()
  return proposal
}

export async function voteOnComment(proposalId: string, commentId: string, increment: number = 1) {
  const proposal = state.proposals.find((p) => p.id === proposalId)
  if (!proposal) return null

  const comment = proposal.comments.find((c) => c.id === commentId)
  if (!comment) return null

  comment.upvotes = (comment.upvotes ?? 0) + increment
  comment.points = (comment.upvotes ?? 0) - (comment.downvotes ?? 0)
  saveState()
  return comment
}

export async function downvoteComment(proposalId: string, commentId: string, increment: number = 1) {
  const proposal = state.proposals.find((p) => p.id === proposalId)
  if (!proposal) return null

  const comment = proposal.comments.find((c) => c.id === commentId)
  if (!comment) return null

  comment.downvotes = (comment.downvotes ?? 0) + increment
  comment.points = (comment.upvotes ?? 0) - (comment.downvotes ?? 0)
  saveState()
  return comment
}

// --- Moderation Operations ---

export async function approveModerationFlag(flagId: string, reviewedBy: string = "System Admin") {
  const flag = state.moderation.find((f) => f.id === flagId)
  if (!flag) return null

  flag.status = "Approved"
  flag.reviewedBy = reviewedBy
  saveState()
  return flag
}

export async function rejectModerationFlag(flagId: string, reviewedBy: string = "System Admin") {
  const flag = state.moderation.find((f) => f.id === flagId)
  if (!flag) return null

  flag.status = "Rejected"
  flag.reviewedBy = reviewedBy
  saveState()
  return flag
}

export async function escalateModerationFlag(flagId: string) {
  const flag = state.moderation.find((f) => f.id === flagId)
  if (!flag) return null

  flag.status = "Escalated"
  saveState()
  return flag
}

// --- Award Operations ---

export async function listAwards() {
  if (hasModel("award")) {
    try {
      const rows = await db.award.findMany({ orderBy: [{ createdAt: "desc" }] })
      return rows.map((row: any) => ({
        id: row.id,
        proposalId: row.proposalId,
        title: row.title,
        description: row.description,
        awardedTo: row.awardedTo,
        createdAt: new Date(row.createdAt).toISOString(),
        value: row.value ?? undefined,
      }))
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.awards)
}

export async function createAward(input: {
  proposalId: string
  title: string
  description: string
  awardedTo: string
  value?: string
}) {
  const award: Award = {
    id: uniqueId("a"),
    proposalId: input.proposalId,
    title: input.title.trim(),
    description: input.description.trim(),
    awardedTo: input.awardedTo.trim(),
    createdAt: new Date().toISOString(),
    value: input.value?.trim(),
  }

  if (hasModel("award")) {
    try {
      await db.award.create({
        data: {
          id: award.id,
          proposalId: award.proposalId,
          title: award.title,
          description: award.description,
          awardedTo: award.awardedTo,
          value: award.value ?? null,
        },
      })
      return award
    } catch {
      // Fall through to local persistence.
    }
  }

  state.awards.unshift(award)
  saveState()
  return award
}

// --- Concern Operations ---

export async function voteOnConcern(concernId: string, increment: number = 1) {
  const concern = state.concerns.find((c) => c.id === concernId)
  if (!concern) return null

  concern.upvotes = Math.max(0, concern.upvotes + increment)
  concern.hasUpvoted = true
  saveState()
  return concern
}

export async function downvoteConcern(concernId: string, increment: number = 1) {
  const concern = state.concerns.find((c) => c.id === concernId)
  if (!concern) return null

  concern.downvotes = Math.max(0, concern.downvotes + increment)
  saveState()
  return concern
}

export async function updateConcernStatus(
  concernId: string,
  newStatus: string
): Promise<Concern | null> {
  const concern = state.concerns.find((c) => c.id === concernId)
  if (!concern) return null

  concern.status = newStatus as any
  concern.updates?.push({
    id: uniqueId("u"),
    status: newStatus as any,
    timestamp: new Date().toISOString(),
    author: "System",
    note: `Status updated to ${newStatus}`,
  })
  saveState()
  return concern
}

// --- Duplicate Detection ---

export async function detectDuplicateConcerns(concernId: string, similarityThreshold: number = 0.8) {
  const concern = state.concerns.find((c) => c.id === concernId)
  if (!concern) return []

  // Simple keyword matching for now (deterministic for testing)
  const keywords = concern.title.toLowerCase().split(/\s+/)
  return state.concerns
    .filter((c) => c.id !== concernId)
    .filter((c) => {
      const match = keywords.filter((kw) => c.title.toLowerCase().includes(kw)).length / keywords.length
      return match >= similarityThreshold
    })
    .slice(0, 5)
}

// --- Research Matching ---

export async function createResearchProblem(input: {
  title: string
  ministry: string
  grant: string
  deadline: string
  summary: string
}) {
  const problem: ResearchProblem = {
    id: uniqueId("rp"),
    title: input.title.trim(),
    ministry: input.ministry.trim(),
    grant: input.grant.trim(),
    deadline: input.deadline.trim(),
    summary: input.summary.trim(),
  }

  if (hasModel("researchProblem")) {
    try {
      await db.researchProblem.create({
        data: {
          id: problem.id,
          title: problem.title,
          ministry: problem.ministry,
          grantAmount: problem.grant,
          deadline: problem.deadline,
          summary: problem.summary,
        },
      })
      return problem
    } catch {
      // Fall through to local persistence.
    }
  }

  state.researchProblems.unshift(problem)
  saveState()
  return problem
}

export async function matchResearchWithConcerns(
  researchId: string,
  topK: number = 3
) {
  const research = state.researchProblems.find((r) => r.id === researchId)
  if (!research) return []

  // Keyword matching between research and concerns
  const keywords = research.title
    .toLowerCase()
    .split(/\s+/)
    .filter((kw) => kw.length > 3)

  return state.concerns
    .map((concern) => {
      const matchCount = keywords.filter((kw) =>
        concern.title.toLowerCase().includes(kw) ||
        concern.description.toLowerCase().includes(kw)
      ).length
      return { concern, score: matchCount / keywords.length }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.concern)
}