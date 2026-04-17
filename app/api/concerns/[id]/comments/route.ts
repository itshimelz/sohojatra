import { NextResponse } from "next/server"
import { addConcernComment, listConcernComments } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: concernId } = await params
  const comments = await listConcernComments(concernId)
  return NextResponse.json({ concernId, comments })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: concernId } = await params
  const body = (await request.json().catch(() => ({}))) as {
    authorName?: string
    authorId?: string
    body?: string
    quoted?: string
    parentCommentId?: string
  }

  if (!body.body || !body.authorName) {
    return NextResponse.json({ error: "authorName and body are required" }, { status: 400 })
  }

  const comment = await addConcernComment({
    concernId,
    authorName: body.authorName,
    authorId: body.authorId,
    body: body.body,
    quoted: body.quoted,
    parentCommentId: body.parentCommentId,
  })

  if (!comment) {
    return NextResponse.json({ error: "Concern not found" }, { status: 404 })
  }

  return NextResponse.json({ comment }, { status: 201 })
}
