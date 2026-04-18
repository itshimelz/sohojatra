/**
 * GET/POST /api/research/match — Match research problems with concerns.
 *
 * SECURITY:
 *   - GET: Public (transparency — research matching results are open).
 *   - POST: Requires admin or superadmin role (RBAC).
 *     Only administrators can create new research problems via this endpoint.
 */
import { requireRole } from "@/lib/api-guard"
import {
  listResearchProblems,
  createResearchProblem,
  matchResearchWithConcerns,
} from "@/lib/sohojatra/store"

// GET is public — research matching is transparent
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const researchId = searchParams.get("researchId")
  const action = searchParams.get("action")

  if (action === "match" && researchId) {
    const matches = await matchResearchWithConcerns(researchId, 5)
    return Response.json(matches)
  }

  const problems = await listResearchProblems()
  return Response.json(problems)
}

export async function POST(request: Request) {
  // ── RBAC: Only admin+ can create research problems ───────
  const session = await requireRole(request, ["admin", "superadmin"])
  if (session instanceof Response) return session

  const body = await request.json()

  const problem = await createResearchProblem({
    title: body.title,
    ministry: body.ministry,
    grant: body.grant,
    deadline: body.deadline,
    summary: body.summary,
  })

  return Response.json(problem, { status: 201 })
}
