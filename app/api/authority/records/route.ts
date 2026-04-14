import { NextResponse } from "next/server"
import { listAuthorityRecords } from "@/lib/sohojatra/authority"
import { getServerSession } from "@/lib/auth-session"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({ records: listAuthorityRecords() })
  } catch (error) {
    console.error("[API_AUTHORITY_RECORDS]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
