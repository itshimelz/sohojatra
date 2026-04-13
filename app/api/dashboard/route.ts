import { NextResponse } from "next/server"

import { listAuthorityRecords } from "@/lib/sohojatra/authority"
import { getDashboardSnapshot } from "@/lib/sohojatra/store"

export async function GET() {
  const [snapshot, authorityRecords] = await Promise.all([
    getDashboardSnapshot(),
    Promise.resolve(listAuthorityRecords()),
  ])

  return NextResponse.json({
    ...snapshot,
    authorityRecords,
  })
}