import { NextResponse } from "next/server"

import { addProposalComment } from "@/lib/sohojatra/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const comment = await addProposalComment(id, {
    author: body.author,
    body: body.body,
    quote: body.quote,
  })

  if (!comment) {
    return NextResponse.json({ message: "Proposal not found" }, { status: 404 })
  }

  return NextResponse.json({ comment }, { status: 201 })
}