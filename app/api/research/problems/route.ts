import { NextResponse } from "next/server"

import { listResearchProblems } from "@/lib/nagarik/store"

export async function GET() {
  return NextResponse.json({ problems: await listResearchProblems() })
}