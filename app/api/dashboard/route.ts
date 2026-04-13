import { NextResponse } from "next/server"

import { getDashboardSnapshot } from "@/lib/nagarik/store"

export async function GET() {
  return NextResponse.json(await getDashboardSnapshot())
}