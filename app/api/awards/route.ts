/**
 * POST /api/awards — Create civic awards.
 *
 * SECURITY:
 *   - GET: Public (anyone can see awards).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only administrators can grant awards to prevent self-awarding.
 */
import { requireRole } from "@/lib/api-guard"
import { listAwards, createAward } from "@/lib/sohojatra/store"

// GET is public — anyone can view awards
export async function GET() {
  const awards = await listAwards()
  return Response.json(awards)
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can create awards ──────────────────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await request.json()

  const award = await createAward({
    proposalId: body.proposalId,
    title: body.title,
    description: body.description || "",
    awardedTo: body.awardedTo,
    value: body.value,
  })

  return Response.json(award, { status: 201 })
}
