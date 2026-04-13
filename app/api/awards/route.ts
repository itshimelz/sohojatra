import { listAwards, createAward } from "@/lib/nagarik/store"

export async function GET() {
  const awards = await listAwards()
  return Response.json(awards)
}

export async function POST(request: Request) {
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
