import { NextResponse } from "next/server"

import { getDashboardSnapshot, listConcerns, listProposals, listResearchProblems, listAwards } from "@/lib/sohojatra/store"
import type { Concern } from "@/lib/concerns/mock"
import type { ProposalRecord } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataset = searchParams.get("dataset")

  const [concerns, proposals, researchProblems, awards, dashboard] = await Promise.all([
    listConcerns(),
    listProposals(),
    listResearchProblems(),
    listAwards(),
    getDashboardSnapshot(),
  ])

  const openData = {
    timestamp: new Date().toISOString(),
    version: "1.0",
    license: "CC BY 4.0",
    datasets: {
      concerns: {
        count: concerns.length,
        data: concerns.map((c: Concern) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          status: c.status,
          upvotes: c.upvotes,
          downvotes: c.downvotes,
          location: c.location,
          createdAt: c.createdAt,
        })),
      },
      proposals: {
        count: proposals.length,
        data: proposals.map((p: ProposalRecord) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          author: p.author,
          category: p.category,
          votes: p.votes,
          downvotes: p.downvotes,
          commentCount: (p.comments || []).length,
          createdAt: p.createdAt,
        })),
      },
      researchProblems: {
        count: researchProblems.length,
        data: researchProblems,
      },
      awards: {
        count: awards.length,
        data: awards,
      },
      statistics: {
        totalConcerns: concerns.length,
        totalProposals: proposals.length,
        totalResearch: researchProblems.length,
        totalAwards: awards.length,
        averageConcernVotes:
          concerns.length > 0
            ? Math.round(concerns.reduce((sum: number, c: Concern) => sum + c.upvotes, 0) / concerns.length)
            : 0,
        topConcerns: concerns.slice(0, 5).map((c: Concern, idx: number) => ({
          rank: idx + 1,
          title: c.title,
          votes: c.upvotes,
        })),
      },
    },
  }

  if (dataset === "concerns") {
    return NextResponse.json(openData.datasets.concerns)
  }

  if (dataset === "proposals") {
    return NextResponse.json(openData.datasets.proposals)
  }

  if (dataset === "research") {
    return NextResponse.json(openData.datasets.researchProblems)
  }

  if (dataset === "awards") {
    return NextResponse.json(openData.datasets.awards)
  }

  if (dataset === "statistics") {
    return NextResponse.json(openData.datasets.statistics)
  }

  return NextResponse.json(openData)
}