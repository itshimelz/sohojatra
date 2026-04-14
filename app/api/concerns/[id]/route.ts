import { NextResponse } from "next/server"
import { getConcern } from "@/lib/sohojatra/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const concern = await getConcern(id)

    if (!concern) {
      return NextResponse.json({ message: "Concern not found" }, { status: 404 })
    }

    return NextResponse.json({ concern })
  } catch (error) {
    console.error(`[API_CONCERNS_ID_GET] ID:`, error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}