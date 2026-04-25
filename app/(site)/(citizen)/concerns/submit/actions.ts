"use server"

import { requireServerSession, getServerSession } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getCategoryLabel } from "@/lib/concerns/categories"

// ─── Rate limit constants ──────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours
const RATE_LIMIT_MAX_SUBMISSIONS = 5              // max 5 concerns per 24h per user

// ─── Submit concern (with rate limit) ─────────────────────────────────────────
export async function submitConcernAction(data: {
  title: string
  description: string
  category?: string
  locationLat: number
  locationLng: number
  address?: string
  photos: string[]
}) {
  const session = await requireServerSession()
  const user = session.user
  const userId = user?.id

  // Rate-limit check: count submissions by this user in the last 24h
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const recentCount = await prisma.concern.count({
    where: {
      authorId: userId ?? undefined,
      createdAt: { gte: windowStart },
    },
  })

  if (recentCount >= RATE_LIMIT_MAX_SUBMISSIONS) {
    throw new Error(
      `Rate limit reached. You can submit at most ${RATE_LIMIT_MAX_SUBMISSIONS} concerns per 24 hours. Please try again later.`
    )
  }

  const concern = await prisma.concern.create({
    data: {
      id: crypto.randomUUID(),
      title: data.title,
      description: data.description,
      locationLat: data.locationLat,
      locationLng: data.locationLng,
      location: data.address,
      photos: data.photos,
      authorName: user?.name ?? "Citizen",
      authorId: userId ?? null,
      status: "Submitted",
      updates: [
        {
          id: crypto.randomUUID(),
          status: "Submitted",
          timestamp: new Date().toISOString(),
          author: user?.name ?? "Citizen",
          note: data.category ? `Category: ${getCategoryLabel(data.category)}` : undefined,
        },
      ],
    },
  })

  return concern.id
}

// ─── Cast a vote (one per user per concern) ────────────────────────────────────
export async function castVoteAction(concernId: string, voteType: "up" | "down") {
  const session = await getServerSession()
  if (!session?.user) {
    throw new Error("You must be logged in to vote.")
  }
  const userId = session.user.id

  // Check for an existing vote by this user on this concern
  const existing = await prisma.concernVote.findUnique({
    where: { concernId_userId: { concernId, userId } },
  })

  if (existing) {
    if (existing.voteType === voteType) {
      // Same vote → retract (toggle off)
      await prisma.$transaction([
        prisma.concernVote.delete({
          where: { concernId_userId: { concernId, userId } },
        }),
        prisma.concern.update({
          where: { id: concernId },
          data: {
            upvotes:   voteType === "up"   ? { decrement: 1 } : undefined,
            downvotes: voteType === "down" ? { decrement: 1 } : undefined,
          },
        }),
      ])
      revalidatePath("/concerns")
      return { action: "retracted", voteType: null as null }
    } else {
      // Opposite vote → switch
      await prisma.$transaction([
        prisma.concernVote.update({
          where: { concernId_userId: { concernId, userId } },
          data: { voteType },
        }),
        prisma.concern.update({
          where: { id: concernId },
          data: {
            upvotes:   voteType === "up"   ? { increment: 1 } : { decrement: 1 },
            downvotes: voteType === "down" ? { increment: 1 } : { decrement: 1 },
          },
        }),
      ])
      revalidatePath("/concerns")
      return { action: "switched", voteType }
    }
  }

  // New vote
  await prisma.$transaction([
    prisma.concernVote.create({
      data: { concernId, userId, voteType },
    }),
    prisma.concern.update({
      where: { id: concernId },
      data: {
        upvotes:   voteType === "up"   ? { increment: 1 } : undefined,
        downvotes: voteType === "down" ? { increment: 1 } : undefined,
      },
    }),
  ])
  revalidatePath("/concerns")
  return { action: "cast", voteType }
}
