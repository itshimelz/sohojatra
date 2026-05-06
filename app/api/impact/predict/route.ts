import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const PredictSchema = z.object({ concernId: z.string().min(1) })

// Baseline resolution days by category
const CATEGORY_BASELINE: Record<string, number> = {
  Safety: 7, Health: 10, Infrastructure: 21, Environment: 30,
  Education: 25, Corruption: 45, Rights: 35, Economy: 40,
}

// Factor weights
const UPVOTE_BOOST = 0.3     // each upvote reduces days
const AGE_PENALTY = 0.1      // each day unresolved adds urgency
const ENGAGEMENT_BOOST = 1.5 // each proposal/comment reduces days

function computePrediction(concern: {
  category: string
  upvotes: number
  createdAt: Date
  status: string
  proposals: { id: string }[]
  comments: { id: string }[]
}) {
  const baseline = CATEGORY_BASELINE[concern.category] ?? 30
  const ageDays = (Date.now() - concern.createdAt.getTime()) / 86_400_000
  const upvoteReduction = Math.min(concern.upvotes * UPVOTE_BOOST, baseline * 0.5)
  const engagementReduction = Math.min(
    (concern.proposals.length + concern.comments.length) * ENGAGEMENT_BOOST,
    baseline * 0.3
  )
  const agePenalty = Math.min(ageDays * AGE_PENALTY, baseline * 0.4)

  const predicted = Math.max(1, Math.round(baseline - upvoteReduction - engagementReduction + agePenalty))

  const impactScore = Math.min(100,
    (concern.upvotes * 2) +
    (concern.proposals.length * 5) +
    (concern.comments.length * 1) +
    (ageDays > 30 ? 20 : ageDays > 14 ? 10 : 0)
  )

  const riskLevel = predicted <= 7 ? "Low" : predicted <= 21 ? "Medium" : predicted <= 45 ? "High" : "Critical"

  const confidence = Math.min(0.95, 0.5 + (concern.upvotes / 100) + (ageDays / 365) * 0.2)

  const factors = {
    baseline,
    upvoteReduction: Math.round(upvoteReduction * 10) / 10,
    engagementReduction: Math.round(engagementReduction * 10) / 10,
    agePenaltyDays: Math.round(agePenalty * 10) / 10,
    ageDays: Math.round(ageDays),
    proposalCount: concern.proposals.length,
    commentCount: concern.comments.length,
  }

  return { predictedDays: predicted, impactScore: Math.round(impactScore), riskLevel, confidenceScore: Math.round(confidence * 100) / 100, factors }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = PredictSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 })
  }

  const concern = await prisma.concern.findUnique({
    where: { id: parsed.data.concernId },
    include: { proposals: { select: { id: true } }, comments: { select: { id: true } } },
  })
  if (!concern) {
    return NextResponse.json({ error: "Concern not found" }, { status: 404 })
  }

  const result = computePrediction(concern)

  const prediction = await prisma.impactPrediction.upsert({
    where: { concernId: concern.id },
    create: { concernId: concern.id, ...result, factors: JSON.parse(JSON.stringify(result.factors)) },
    update: { ...result, factors: JSON.parse(JSON.stringify(result.factors)), predictedAt: new Date() },
  })

  return NextResponse.json({ prediction, concern: { id: concern.id, title: concern.title, status: concern.status } })
}
