import type { Concern } from "./types"

const CONCERNS_STORAGE_KEY = "sohojatra:concerns"
const VOTES_STORAGE_KEY = "sohojatra:concern-votes"

type VoteMap = Record<string, true>

type CreateConcernInput = {
  title: string
  description: string
  location: {
    lat: number
    lng: number
    address?: string
  }
  authorName?: string
  photos?: string[]
}

function canUseStorage() {
  return typeof window !== "undefined"
}

function cloneConcern(concern: Concern): Concern {
  return {
    ...concern,
    author: { ...concern.author },
    location: { ...concern.location },
    photos: [...concern.photos],
    updates: concern.updates.map((update) => ({ ...update })),
  }
}

function readConcernsFromStorage(): Concern[] | null {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(CONCERNS_STORAGE_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as Concern[]
  } catch {
    return null
  }
}

function readVotesFromStorage(): VoteMap {
  if (!canUseStorage()) {
    return {}
  }

  const raw = window.localStorage.getItem(VOTES_STORAGE_KEY)
  if (!raw) {
    return {}
  }

  try {
    return JSON.parse(raw) as VoteMap
  } catch {
    return {}
  }
}

function writeConcernsToStorage(concerns: Concern[]) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(CONCERNS_STORAGE_KEY, JSON.stringify(concerns))
}

function writeVotesToStorage(votes: VoteMap) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(VOTES_STORAGE_KEY, JSON.stringify(votes))
}

function seedConcerns() {
  return [] as Concern[]
}

function sortConcerns(concerns: Concern[]) {
  return [...concerns].sort((left, right) => {
    if (right.upvotes !== left.upvotes) {
      return right.upvotes - left.upvotes
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  })
}

function createTrackingId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `c-${crypto.randomUUID().slice(0, 8)}`
  }

  return `c-${Math.random().toString(36).slice(2, 10)}`
}

export function getBrowserConcerns() {
  const storedConcerns = readConcernsFromStorage()

  if (!storedConcerns || storedConcerns.length === 0) {
    const seededConcerns = seedConcerns()
    writeConcernsToStorage(seededConcerns)
    return sortConcerns(seededConcerns)
  }

  return sortConcerns(storedConcerns.map(cloneConcern))
}

export function saveBrowserConcerns(concerns: Concern[]) {
  writeConcernsToStorage(concerns)
}

export function findConcernById(concernId: string) {
  return getBrowserConcerns().find((concern) => concern.id === concernId) ?? null
}

export function createBrowserConcern(input: CreateConcernInput) {
  const now = new Date().toISOString()
  const concern: Concern = {
    id: createTrackingId(),
    title: input.title.trim(),
    description: input.description.trim(),
    status: "Submitted",
    upvotes: 1,
    downvotes: 0,
    hasUpvoted: true,
    createdAt: now,
    author: {
      name: input.authorName?.trim() || "Verified Citizen",
    },
    location: input.location,
    photos: input.photos ?? [],
    updates: [
      {
        id: `${createTrackingId()}-submitted`,
        status: "Submitted",
        timestamp: now,
        author: input.authorName?.trim() || "Verified Citizen",
        note: "Concern submitted and queued for review.",
      },
    ],
  }

  const concerns = [concern, ...getBrowserConcerns()]
  saveBrowserConcerns(concerns)
  return concern
}

export function upvoteConcern(concernId: string) {
  const concerns = getBrowserConcerns()
  const votes = readVotesFromStorage()
  const target = concerns.find((concern) => concern.id === concernId)

  if (!target || target.hasUpvoted || votes[concernId]) {
    return { concerns, alreadyVoted: true }
  }

  const nextConcerns = concerns.map((concern) =>
    concern.id === concernId
      ? {
          ...concern,
          hasUpvoted: true,
          upvotes: concern.upvotes + 1,
        }
      : concern
  )

  votes[concernId] = true
  writeVotesToStorage(votes)
  saveBrowserConcerns(nextConcerns)

  return { concerns: nextConcerns, alreadyVoted: false }
}
