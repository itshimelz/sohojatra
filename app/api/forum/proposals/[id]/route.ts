import { NextResponse } from "next/server"
import { listProposals, type ProposalRecord } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const proposals = await listProposals()
  const proposal = proposals.find((p: ProposalRecord) => p.id === id)

  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 })
  }

  return NextResponse.json({ proposal })
}
