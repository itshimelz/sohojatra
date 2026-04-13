import { NextResponse } from "next/server"

import { createProposal, listProposals } from "@/lib/sohojatra/store"
import type { ProposalRecord } from "@/lib/sohojatra/store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sort = searchParams.get("sort") ?? "trending"
  const proposals = await listProposals()

  const sorted = proposals.slice().sort((left: ProposalRecord, right: ProposalRecord) => {
    if (sort === "new") {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    }

    if (sort === "controversial") {
      const leftControversy = Math.abs(left.votes - left.downvotes)
      const rightControversy = Math.abs(right.votes - right.downvotes)
      return leftControversy - rightControversy
    }

    return right.votes - left.votes
  })

  return NextResponse.json({ proposals: sorted, sort })
}

export async function POST(request: Request) {
  const body = await request.json()
  const proposal = await createProposal({
    title: body.title,
    body: body.body,
    author: body.author,
    category: body.category,
  })

  return NextResponse.json({ proposal }, { status: 201 })
}