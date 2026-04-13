import { NextResponse } from "next/server"

import { getConcern } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const concern = await getConcern(id)

  if (!concern) {
    return NextResponse.json({ message: "Concern not found" }, { status: 404 })
  }

  return NextResponse.json({ concern })
}