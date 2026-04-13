import { listResearchProblems, createResearchProblem, matchResearchWithConcerns } from "@/lib/sohojatra/store"

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
