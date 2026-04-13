import { NextResponse } from "next/server"

import { createProposal, listProposals } from "@/lib/nagarik/store"

export async function GET() {
  return NextResponse.json({ proposals: await listProposals() })
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