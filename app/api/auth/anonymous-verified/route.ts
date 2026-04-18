/**
 * POST /api/auth/anonymous-verified — Get an anonymous verified profile.
 *
 * SECURITY:
 *   - Requires authenticated session. The userId is taken from the
 *     session to prevent anyone from querying anonymous profiles of
 *     other users. This is critical for the anonymous mode feature.
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { anonymousVerifiedProfile } from "@/lib/sohojatra/advanced"

export async function POST(request: Request) {
  // ── Auth: Only the logged-in user can fetch their anon profile
  const session = await requireSession(request)
  if (session instanceof Response) return session

  // ── userId from session, not the body ───────────────────
  return NextResponse.json({
    profile: anonymousVerifiedProfile(session.userId),
  })
}
