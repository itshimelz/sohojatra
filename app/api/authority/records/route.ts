import { NextResponse } from "next/server"

import { listAuthorityRecords } from "@/lib/sohojatra/authority"

export async function GET() {
  return NextResponse.json({ records: listAuthorityRecords() })
}
