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

type ActionLogEntry = {
  id: string
  entityType: "solutionPlan" | "project" | "assemblyEvent" | "researchProblem"
  entityId: string
  action: string
  actorName: string
  actorRole: "Citizen" | "Expert" | "Government" | "NGO" | "Admin" | "System"
  metadata?: Record<string, unknown>
  createdAt: string
}

type SolutionPlan = {
  id: string
  concernId: string
  title: string
  summary: string
  technicalDocs: string[]
  budgetEstimateBdt: number
  timeline: string
  riskNotes: string
  status:
    | "Submitted"
    | "UnderReview"
    | "Approved"
    | "Rejected"
    | "RevisionRequested"
  submittedBy: string
  governmentComments?: string
  assignedDepartment?: string
  createdAt: string
  updatedAt: string
}

type ProjectMilestone = {
  id: string
  title: string
  dueDate: string
  status: "Planned" | "InProgress" | "SubmittedForVerification" | "Verified"
  verifiedBy?: string
  verifiedAt?: string
}

type ProjectUpdate = {
  id: string
  text: string
  photos: string[]
  videos: string[]
  createdBy: string
  createdAt: string
}

type ProjectComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

type ProjectTracker = {
  id: string
  title: string
  ministry: string
  department: string
  owner: string
  status: "Planning" | "In Progress" | "On Hold" | "Completed"
  progress: number
  deadline: string
  budgetAllocatedBdt: number
  budgetSpentBdt: number
  milestones: ProjectMilestone[]
  updates: ProjectUpdate[]
  followers: string[]
  comments: ProjectComment[]
}

type AssemblyEvent = {
  id: string
  title: string
  date: string
  time: string
  location: string
  organizer: string
  topic: string
  agenda?: string
  minutesUrl?: string
  status: "Upcoming" | "Ongoing" | "Completed"
  rsvps: string[]
  linkedConcernIds: string[]
}

type NotificationItem = {
  id: string
  userId: string
  channel: "push" | "sms" | "email" | "in-app"
  subject: string
  body: string
  status: "pending" | "sent" | "failed"
  createdAt: string
  meta?: Record<string, unknown>
}

type UserVote = {
  id: string
  userId: string
  targetType: "concern" | "proposal" | "comment"
  targetId: string
  value: 1 | -1
  votedAt: string
}

type ReputationEvent = {
  id: string
  userId: string
  delta: number
  reason: string
  createdAt: string
}

type EarnedBadge = {
  id: string
  userId: string
  badgeKey: string
  label: string
  description: string
  earnedAt: string
}

type ConcernComment = {
  id: string
  concernId: string
  authorName: string
  authorId?: string
  body: string
  quoted?: string
  quotedCommentId?: string
  parentCommentId?: string
  upvotes: number
  downvotes: number
  aiPriorityScore: number
  createdAt: string
}

type StateFile = {
  concerns: Concern[]
  proposals: ProposalRecord[]
  researchProblems: ResearchProblem[]
  moderation: ModerationFlag[]
  awards: Award[]
  solutionPlans: SolutionPlan[]
  projects: ProjectTracker[]
  assemblyEvents: AssemblyEvent[]
  notifications: NotificationItem[]
  actionLog: ActionLogEntry[]
  userVotes: UserVote[]
  reputationEvents: ReputationEvent[]
  earnedBadges: EarnedBadge[]
  concernComments: ConcernComment[]
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
  solutionPlans: [
    {
      id: "sp-1",
      concernId: MOCK_CONCERNS[0]?.id ?? "c-1",
      title: "Rapid drainage sweep + contractor accountability plan",
      summary: "Immediate cleaning plus a weekly public status board with contractor IDs.",
      technicalDocs: [],
      budgetEstimateBdt: 1200000,
      timeline: "2 weeks for cleanup, 6 weeks for full audit",
      riskNotes: "Risk: contractor non-compliance; mitigate with public weekly audits.",
      status: "UnderReview",
      submittedBy: "Dr. Rafiq Hasan",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
  ],
  projects: [
    {
      id: "pt-1",
      title: "Drainage system rehabilitation - Mirpur Zone",
      ministry: "Ministry of Local Government",
      department: "Dhaka City Corporation",
      owner: "Eng. Karim Hossain",
      status: "In Progress",
      progress: 65,
      deadline: "30 Jun 2026",
      budgetAllocatedBdt: 4500000,
      budgetSpentBdt: 2800000,
      milestones: [
        {
          id: "ms-1",
          title: "Contractor mobilization",
          dueDate: "15 Apr 2026",
          status: "Verified",
          verifiedBy: "Gov Liaison",
          verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        },
        {
          id: "ms-2",
          title: "Primary line clearance",
          dueDate: "10 May 2026",
          status: "InProgress",
        },
      ],
      updates: [],
      followers: [],
      comments: [],
    },
  ],
  assemblyEvents: [
    {
      id: "ae-1",
      title: "Ward 50 Town Hall - Infrastructure Planning",
      date: "2026-04-20",
      time: "18:00 - 20:00",
      location: "Community Center, Mirpur 10",
      organizer: "DMC Ward Commissioner",
      topic: "Drainage & Street Maintenance Budget Review",
      agenda: "Budget review, citizen Q&A, next steps",
      minutesUrl: undefined,
      status: "Upcoming",
      rsvps: [],
      linkedConcernIds: [],
    },
  ],
  notifications: [],
  actionLog: [],
  userVotes: [],
  reputationEvents: [],
  earnedBadges: [],
  concernComments: [],
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
      solutionPlans: Array.isArray(parsed.solutionPlans) ? parsed.solutionPlans : cloneState(defaultState.solutionPlans),
      projects: Array.isArray(parsed.projects) ? parsed.projects : cloneState(defaultState.projects),
      assemblyEvents: Array.isArray(parsed.assemblyEvents) ? parsed.assemblyEvents : cloneState(defaultState.assemblyEvents),
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : cloneState(defaultState.notifications),
      actionLog: Array.isArray(parsed.actionLog) ? parsed.actionLog : cloneState(defaultState.actionLog),
      userVotes: Array.isArray(parsed.userVotes) ? parsed.userVotes : [],
      reputationEvents: Array.isArray(parsed.reputationEvents) ? parsed.reputationEvents : [],
      earnedBadges: Array.isArray(parsed.earnedBadges) ? parsed.earnedBadges : [],
      concernComments: Array.isArray(parsed.concernComments) ? parsed.concernComments : [],
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

export async function listConcerns(): Promise<Concern[]> {
  if (hasModel("concern")) {
    try {
      const rows = (await db.concern.findMany({
        orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
      })) as unknown[]
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

export async function listResearchProblems(): Promise<ResearchProblem[]> {
  if (hasModel("researchProblem")) {
    try {
      const rows = (await db.researchProblem.findMany({
        orderBy: [{ createdAt: "desc" }],
      })) as unknown[]
      return rows.map(mapResearchRow)
    } catch {
      // Fall through to the file-backed state.
    }
  }

  return cloneState(state.researchProblems)
}

export async function listModerationQueue(): Promise<ModerationFlag[]> {
  if (hasModel("moderationFlag")) {
    try {
      const rows = (await db.moderationFlag.findMany({
        orderBy: [{ createdAt: "desc" }],
      })) as unknown[]
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

  const resolvedConcerns = concerns.filter((concern: Concern) => concern.status === "Resolved")
  const openConcerns = concerns.filter((concern: Concern) => concern.status !== "Resolved")

  const resolutionDurationsMs = resolvedConcerns
    .map((concern: Concern) => {
      const submittedAt = concern.updates?.find((u) => u.status === "Submitted")?.timestamp
      const resolvedAt = concern.updates
        ?.slice()
        .reverse()
        .find((u) => u.status === "Resolved")?.timestamp
      if (!submittedAt || !resolvedAt) return null
      const diff = new Date(resolvedAt).getTime() - new Date(submittedAt).getTime()
      return diff > 0 ? diff : null
    })
    .filter((value): value is number => typeof value === "number")

  const avgResolutionHours =
    resolutionDurationsMs.length > 0
      ? Math.round(
          resolutionDurationsMs.reduce((sum, value) => sum + value, 0) /
            resolutionDurationsMs.length /
            (1000 * 60 * 60)
        )
      : null

  return {
    kpis: [
      {
        label: "Avg. resolution time",
        value: avgResolutionHours === null ? "—" : `${avgResolutionHours}h`,
        detail: "Computed from resolved concerns in this dataset",
      },
      {
        label: "Open vs resolved",
        value: `${openConcerns.length} : ${Math.max(1, resolvedConcerns.length)}`,
        detail: "Public issue backlog based on current concern statuses",
      },
      {
        label: "Citizen satisfaction",
        value: "4.3/5",
        detail: "Placeholder until post-resolution rating capture is enabled",
      },
      {
        label: "Assembly events held",
        value: String(state.assemblyEvents.length),
        detail: "Town halls published in the public schedule",
      },
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

function appendActionLog(entry: Omit<ActionLogEntry, "id" | "createdAt">) {
  const record: ActionLogEntry = {
    id: uniqueId("al"),
    createdAt: new Date().toISOString(),
    ...entry,
  }

  state.actionLog.unshift(record)
  saveState()
  return record
}

export async function listActionLog(filter?: {
  entityType?: ActionLogEntry["entityType"]
  entityId?: string
  limit?: number
}) {
  const filtered = state.actionLog.filter((entry) => {
    if (filter?.entityType && entry.entityType !== filter.entityType) return false
    if (filter?.entityId && entry.entityId !== filter.entityId) return false
    return true
  })

  return cloneState(filtered.slice(0, filter?.limit ?? 200))
}

export async function createNotification(input: Omit<NotificationItem, "id" | "createdAt" | "status"> & { status?: NotificationItem["status"] }) {
  const notification: NotificationItem = {
    id: uniqueId("n"),
    createdAt: new Date().toISOString(),
    status: input.status ?? "pending",
    userId: input.userId,
    channel: input.channel,
    subject: input.subject,
    body: input.body,
    meta: input.meta,
  }

  state.notifications.unshift(notification)
  saveState()
  return notification
}

export async function listNotifications(filter?: { userId?: string; channel?: NotificationItem["channel"] }) {
  const items = state.notifications.filter((item) => {
    if (filter?.userId && item.userId !== filter.userId) return false
    if (filter?.channel && item.channel !== filter.channel) return false
    return true
  })

  return cloneState(items)
}

export async function listSolutionPlans(filter?: { concernId?: string; status?: SolutionPlan["status"] }) {
  const plans = state.solutionPlans.filter((plan) => {
    if (filter?.concernId && plan.concernId !== filter.concernId) return false
    if (filter?.status && plan.status !== filter.status) return false
    return true
  })
  return cloneState(plans)
}

export async function getSolutionPlan(planId: string) {
  return cloneState(state.solutionPlans.find((plan) => plan.id === planId) ?? null)
}

export async function createSolutionPlan(input: {
  concernId: string
  title: string
  summary: string
  technicalDocs?: string[]
  budgetEstimateBdt: number
  timeline: string
  riskNotes: string
  submittedBy: string
  notifyUserId?: string
}) {
  const now = new Date().toISOString()
  const plan: SolutionPlan = {
    id: uniqueId("sp"),
    concernId: input.concernId,
    title: input.title.trim(),
    summary: input.summary.trim(),
    technicalDocs: Array.isArray(input.technicalDocs) ? input.technicalDocs : [],
    budgetEstimateBdt: Math.max(0, Math.round(input.budgetEstimateBdt)),
    timeline: input.timeline.trim(),
    riskNotes: input.riskNotes.trim(),
    status: "Submitted",
    submittedBy: input.submittedBy.trim() || "Expert",
    createdAt: now,
    updatedAt: now,
  }

  state.solutionPlans.unshift(plan)
  appendActionLog({
    entityType: "solutionPlan",
    entityId: plan.id,
    action: "submitted",
    actorName: plan.submittedBy,
    actorRole: "Expert",
    metadata: { concernId: plan.concernId },
  })

  if (input.notifyUserId) {
    await createNotification({
      userId: input.notifyUserId,
      channel: "in-app",
      subject: "New solution proposal submitted",
      body: `A new solution proposal was submitted for concern ${input.concernId}.`,
      meta: { concernId: input.concernId, solutionPlanId: plan.id },
    })
  }

  saveState()
  return plan
}

export async function reviewSolutionPlan(input: {
  planId: string
  action: "approve" | "reject" | "requestRevision" | "assignDepartment"
  actorName: string
  department?: string
  comments?: string
  notifyUserId?: string
}) {
  const plan = state.solutionPlans.find((p) => p.id === input.planId)
  if (!plan) return null

  const now = new Date().toISOString()
  const actorName = input.actorName.trim() || "Government Authority"

  if (input.action === "assignDepartment") {
    plan.assignedDepartment = input.department?.trim() || plan.assignedDepartment
    plan.status = "UnderReview"
  } else if (input.action === "approve") {
    plan.status = "Approved"
  } else if (input.action === "reject") {
    plan.status = "Rejected"
  } else if (input.action === "requestRevision") {
    plan.status = "RevisionRequested"
  }

  if (input.comments) {
    plan.governmentComments = input.comments.trim()
  }

  plan.updatedAt = now

  appendActionLog({
    entityType: "solutionPlan",
    entityId: plan.id,
    action: input.action,
    actorName,
    actorRole: "Government",
    metadata: {
      assignedDepartment: plan.assignedDepartment,
      comments: plan.governmentComments,
      status: plan.status,
    },
  })

  if (input.notifyUserId) {
    await createNotification({
      userId: input.notifyUserId,
      channel: "in-app",
      subject: "Solution proposal updated",
      body: `The solution proposal for concern ${plan.concernId} is now ${plan.status}.`,
      meta: { concernId: plan.concernId, solutionPlanId: plan.id, status: plan.status },
    })
  }

  saveState()
  return cloneState(plan)
}

export async function listProjects() {
  return cloneState(state.projects)
}

export async function createProject(input: {
  title: string
  ministry: string
  department: string
  owner: string
  deadline: string
  budgetAllocatedBdt: number
}) {
  const project: ProjectTracker = {
    id: uniqueId("pt"),
    title: input.title.trim(),
    ministry: input.ministry.trim(),
    department: input.department.trim(),
    owner: input.owner.trim() || "Implementing Team",
    status: "Planning",
    progress: 0,
    deadline: input.deadline.trim(),
    budgetAllocatedBdt: Math.max(0, Math.round(input.budgetAllocatedBdt)),
    budgetSpentBdt: 0,
    milestones: [],
    updates: [],
    followers: [],
    comments: [],
  }

  state.projects.unshift(project)
  appendActionLog({
    entityType: "project",
    entityId: project.id,
    action: "created",
    actorName: project.owner,
    actorRole: "Government",
    metadata: { ministry: project.ministry, department: project.department },
  })
  saveState()
  return cloneState(project)
}

export async function getProject(projectId: string) {
  return cloneState(state.projects.find((project) => project.id === projectId) ?? null)
}

export async function addProjectComment(input: { projectId: string; author: string; body: string }) {
  const project = state.projects.find((p) => p.id === input.projectId)
  if (!project) return null

  const comment: ProjectComment = {
    id: uniqueId("pcmt"),
    author: input.author.trim() || "Citizen",
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
  }

  project.comments.unshift(comment)
  appendActionLog({
    entityType: "project",
    entityId: project.id,
    action: "commented",
    actorName: comment.author,
    actorRole: "Citizen",
    metadata: { commentId: comment.id },
  })

  saveState()
  return cloneState(comment)
}

export async function toggleProjectFollow(input: { projectId: string; followerId: string }) {
  const project = state.projects.find((p) => p.id === input.projectId)
  if (!project) return null

  const followerId = input.followerId.trim()
  if (!followerId) return null

  const existing = project.followers.includes(followerId)
  project.followers = existing
    ? project.followers.filter((id) => id !== followerId)
    : [followerId, ...project.followers]

  appendActionLog({
    entityType: "project",
    entityId: project.id,
    action: existing ? "unfollowed" : "followed",
    actorName: followerId,
    actorRole: "Citizen",
  })

  saveState()
  return cloneState({ followers: project.followers, following: !existing })
}

export async function updateProjectMilestone(input: {
  projectId: string
  milestoneId: string
  status: ProjectMilestone["status"]
  actorName: string
  verify?: boolean
}) {
  const project = state.projects.find((p) => p.id === input.projectId)
  if (!project) return null

  const milestone = project.milestones.find((m) => m.id === input.milestoneId)
  if (!milestone) return null

  milestone.status = input.status

  if (input.verify) {
    milestone.status = "Verified"
    milestone.verifiedBy = input.actorName.trim() || "Gov Liaison"
    milestone.verifiedAt = new Date().toISOString()
  }

  appendActionLog({
    entityType: "project",
    entityId: project.id,
    action: "milestone-updated",
    actorName: input.actorName.trim() || "System",
    actorRole: input.verify ? "Government" : "System",
    metadata: { milestoneId: milestone.id, status: milestone.status },
  })

  saveState()
  return cloneState(milestone)
}

export async function addProjectUpdate(input: {
  projectId: string
  text: string
  photos?: string[]
  videos?: string[]
  createdBy: string
  budgetSpentDeltaBdt?: number
}) {
  const project = state.projects.find((p) => p.id === input.projectId)
  if (!project) return null

  const update: ProjectUpdate = {
    id: uniqueId("pu"),
    text: input.text.trim(),
    photos: Array.isArray(input.photos) ? input.photos : [],
    videos: Array.isArray(input.videos) ? input.videos : [],
    createdBy: input.createdBy.trim() || "Implementing Team",
    createdAt: new Date().toISOString(),
  }

  project.updates.unshift(update)

  if (typeof input.budgetSpentDeltaBdt === "number" && Number.isFinite(input.budgetSpentDeltaBdt)) {
    project.budgetSpentBdt = Math.max(0, project.budgetSpentBdt + Math.round(input.budgetSpentDeltaBdt))
    project.progress = Math.max(0, Math.min(100, project.progress))
  }

  appendActionLog({
    entityType: "project",
    entityId: project.id,
    action: "progress-update",
    actorName: update.createdBy,
    actorRole: "Government",
    metadata: { updateId: update.id },
  })

  saveState()
  return cloneState(update)
}

export async function listAssemblyEvents() {
  return cloneState(state.assemblyEvents)
}

export async function createAssemblyEvent(input: {
  title: string
  date: string
  time: string
  location: string
  organizer: string
  topic: string
  agenda?: string
  linkedConcernIds?: string[]
}) {
  const event: AssemblyEvent = {
    id: uniqueId("ae"),
    title: input.title.trim(),
    date: input.date.trim(),
    time: input.time.trim(),
    location: input.location.trim(),
    organizer: input.organizer.trim(),
    topic: input.topic.trim(),
    agenda: input.agenda?.trim() || undefined,
    minutesUrl: undefined,
    status: "Upcoming",
    rsvps: [],
    linkedConcernIds: Array.isArray(input.linkedConcernIds) ? input.linkedConcernIds : [],
  }

  state.assemblyEvents.unshift(event)
  appendActionLog({
    entityType: "assemblyEvent",
    entityId: event.id,
    action: "scheduled",
    actorName: event.organizer,
    actorRole: "Government",
  })
  saveState()
  return cloneState(event)
}

export async function rsvpAssemblyEvent(input: { eventId: string; userId: string }) {
  const event = state.assemblyEvents.find((e) => e.id === input.eventId)
  if (!event) return null

  const userId = input.userId.trim()
  if (!userId) return null

  const already = event.rsvps.includes(userId)
  event.rsvps = already ? event.rsvps.filter((id) => id !== userId) : [userId, ...event.rsvps]

  appendActionLog({
    entityType: "assemblyEvent",
    entityId: event.id,
    action: already ? "rsvp-cancelled" : "rsvp",
    actorName: userId,
    actorRole: "Citizen",
  })

  saveState()
  return cloneState({ rsvps: event.rsvps, attending: !already })
}

export async function publishAssemblyMinutes(input: { eventId: string; minutesUrl: string; actorName: string }) {
  const event = state.assemblyEvents.find((e) => e.id === input.eventId)
  if (!event) return null

  event.minutesUrl = input.minutesUrl.trim()
  event.status = "Completed"

  appendActionLog({
    entityType: "assemblyEvent",
    entityId: event.id,
    action: "minutes-published",
    actorName: input.actorName.trim() || "Government",
    actorRole: "Government",
    metadata: { minutesUrl: event.minutesUrl },
  })

  saveState()
  return cloneState(event)
}

// ─── Vote Deduplication ────────────────────────────────────────────────────────

export async function castVote(input: {
  userId: string
  targetType: "concern" | "proposal" | "comment"
  targetId: string
  value: 1 | -1
}) {
  const existing = state.userVotes.find(
    (v) => v.userId === input.userId && v.targetType === input.targetType && v.targetId === input.targetId
  )
  if (existing) return { alreadyVoted: true, vote: existing }

  const vote: UserVote = {
    id: uniqueId("v"),
    userId: input.userId,
    targetType: input.targetType,
    targetId: input.targetId,
    value: input.value,
    votedAt: new Date().toISOString(),
  }

  state.userVotes.unshift(vote)

  if (input.targetType === "concern") {
    if (input.value === 1) await voteOnConcern(input.targetId)
    else await downvoteConcern(input.targetId)
  } else if (input.targetType === "proposal") {
    if (input.value === 1) await voteOnProposal(input.targetId)
    else await downvoteProposal(input.targetId)
  }

  saveState()
  return { alreadyVoted: false, vote }
}

export async function getUserVotes(userId: string) {
  return cloneState(state.userVotes.filter((v) => v.userId === userId))
}

// ─── Reputation System ─────────────────────────────────────────────────────────

const REPUTATION_EVENTS = {
  CONCERN_SUBMITTED: 5,
  CONCERN_RESOLVED: 20,
  COMMENT_UPVOTED: 2,
  AWARD_RECEIVED: 15,
  COMMENT_PINNED_BEST: 30,
  COMMENT_CITED: 50,
  EVENT_ATTENDANCE: 3,
  RESEARCH_MILESTONE: 100,
} as const

export async function awardReputation(input: {
  userId: string
  reason: keyof typeof REPUTATION_EVENTS | string
  delta?: number
}) {
  const delta =
    input.delta ??
    (input.reason in REPUTATION_EVENTS
      ? REPUTATION_EVENTS[input.reason as keyof typeof REPUTATION_EVENTS]
      : 1)

  const event: ReputationEvent = {
    id: uniqueId("rep"),
    userId: input.userId,
    delta,
    reason: input.reason,
    createdAt: new Date().toISOString(),
  }

  state.reputationEvents.unshift(event)
  saveState()
  return event
}

export async function getUserReputation(userId: string) {
  const events = state.reputationEvents.filter((e) => e.userId === userId)
  const total = events.reduce((sum, e) => sum + e.delta, 0)
  const weightMultiplier =
    total >= 5000 ? 1.8 : total >= 2000 ? 1.5 : total >= 500 ? 1.2 : 1.0

  return {
    userId,
    totalPoints: Math.max(0, total),
    weightMultiplier,
    tier: total >= 5000 ? "Champion" : total >= 2000 ? "Expert" : total >= 500 ? "Active" : "Newcomer",
    events: events.slice(0, 20),
  }
}

// ─── Badge System ──────────────────────────────────────────────────────────────

export const BADGE_CATALOG = [
  { key: "first-concern", label: "First Concern", description: "Submitted your first civic concern" },
  { key: "problem-solver", label: "Problem Solver", description: "Had a concern reach Resolved status" },
  { key: "top-voice", label: "Top Voice", description: "Received 100+ upvotes on proposals or comments" },
  { key: "verified-expert", label: "Verified Expert", description: "Verified as an expert or professor" },
  { key: "100-day-contributor", label: "100-Day Contributor", description: "Active for 100+ days on the platform" },
  { key: "research-pioneer", label: "Research Pioneer", description: "Completed a research milestone" },
  { key: "assembly-regular", label: "Assembly Regular", description: "RSVPed to 5+ assembly events" },
  { key: "rights-champion", label: "Rights Champion", description: "Submitted 10+ concerns in the Rights category" },
  { key: "mob-buster", label: "Mob Buster", description: "Helped identify coordinated inauthentic behavior" },
] as const

export async function awardBadge(input: {
  userId: string
  badgeKey: string
  label?: string
  description?: string
}) {
  const existing = state.earnedBadges.find(
    (b) => b.userId === input.userId && b.badgeKey === input.badgeKey
  )
  if (existing) return { alreadyHeld: true, badge: existing }

  const catalog = BADGE_CATALOG.find((b) => b.key === input.badgeKey)
  const badge: EarnedBadge = {
    id: uniqueId("eb"),
    userId: input.userId,
    badgeKey: input.badgeKey,
    label: input.label ?? catalog?.label ?? input.badgeKey,
    description: input.description ?? catalog?.description ?? "",
    earnedAt: new Date().toISOString(),
  }

  state.earnedBadges.unshift(badge)
  saveState()
  return { alreadyHeld: false, badge }
}

export async function getUserBadges(userId: string) {
  return cloneState(state.earnedBadges.filter((b) => b.userId === userId))
}

// ─── Concern Comments ──────────────────────────────────────────────────────────

export async function listConcernComments(concernId: string) {
  if (hasModel("comment")) {
    try {
      const rows = await db.comment.findMany({
        where: { concernId },
        orderBy: [{ upvotes: "desc" }, { createdAt: "asc" }],
      })
      return rows.map((row: any) => ({
        id: row.id,
        concernId: row.concernId,
        authorName: row.authorName,
        authorId: row.authorId ?? undefined,
        body: row.body,
        quoted: row.quoted ?? undefined,
        parentCommentId: row.parentCommentId ?? undefined,
        upvotes: row.upvotes ?? 0,
        downvotes: row.downvotes ?? 0,
        aiPriorityScore: row.aiPriorityScore ?? 0,
        createdAt: new Date(row.createdAt).toISOString(),
      }))
    } catch {
      // Fall through
    }
  }
  return cloneState(state.concernComments.filter((c) => c.concernId === concernId))
}

export async function addConcernComment(input: {
  concernId: string
  authorName: string
  authorId?: string
  body: string
  quoted?: string
  parentCommentId?: string
}) {
  const concern = state.concerns.find((c) => c.id === input.concernId)

  if (hasModel("comment")) {
    try {
      const dbConcern = concern ?? await db.concern.findUnique({ where: { id: input.concernId } })
      if (dbConcern) {
        const row = await db.comment.create({
          data: {
            id: uniqueId("cc"),
            body: input.body.trim(),
            authorName: input.authorName.trim(),
            authorId: input.authorId ?? null,
            quoted: input.quoted ?? null,
            parentCommentId: input.parentCommentId ?? null,
            concernId: input.concernId,
            aiPriorityScore: 0,
          },
        })
        return {
          id: row.id,
          concernId: row.concernId,
          authorName: row.authorName,
          body: row.body,
          upvotes: 0,
          downvotes: 0,
          aiPriorityScore: 0,
          createdAt: new Date(row.createdAt).toISOString(),
        }
      }
    } catch {
      // Fall through
    }
  }

  if (!concern) return null

  const comment: ConcernComment = {
    id: uniqueId("cc"),
    concernId: input.concernId,
    authorName: input.authorName.trim(),
    authorId: input.authorId,
    body: input.body.trim(),
    quoted: input.quoted,
    parentCommentId: input.parentCommentId,
    upvotes: 0,
    downvotes: 0,
    aiPriorityScore: 0,
    createdAt: new Date().toISOString(),
  }

  state.concernComments.unshift(comment)
  saveState()
  return cloneState(comment)
}

// ─── Full User Profile ─────────────────────────────────────────────────────────

export async function getFullUserProfile(userId: string) {
  const reputation = await getUserReputation(userId)
  const badges = await getUserBadges(userId)
  const votes = await getUserVotes(userId)
  const userConcerns = state.concerns.filter((c) => c.author?.name === userId || (c as any).authorId === userId).length
  const userComments = state.concernComments.filter((c) => c.authorId === userId).length

  return {
    userId,
    reputation,
    badges,
    stats: {
      totalVotes: votes.length,
      totalConcerns: userConcerns,
      totalComments: userComments,
    },
  }
}
