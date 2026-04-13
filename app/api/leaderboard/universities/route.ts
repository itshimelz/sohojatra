import { NextResponse } from "next/server"

import { listLeaderboard } from "@/lib/sohojatra/advanced"

export async function GET() {
  return NextResponse.json({ leaderboard: listLeaderboard() })
}
