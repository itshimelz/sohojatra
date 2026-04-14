import { NextResponse } from "next/server"
import { createConcern, listConcerns } from "@/lib/sohojatra/store"
import { getServerSession } from "@/lib/auth-session"
import { createConcernSchema } from "@/lib/validation/concerns"
import { z } from "zod"

export async function GET() {
  try {
    const concerns = await listConcerns()
    return NextResponse.json({ concerns })
  } catch (error) {
    console.error("[API_CONCERNS_GET]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedBody = createConcernSchema.parse(body)

    const concern = await createConcern({
      title: validatedBody.title,
      description: validatedBody.description,
      authorName: validatedBody.authorName || session.user.name,
      locationLat: validatedBody.locationLat,
      locationLng: validatedBody.locationLng,
      location: validatedBody.location,
      photos: validatedBody.photos,
    })

    return NextResponse.json({ concern }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.issues }, { status: 400 })
    }
    console.error("[API_CONCERNS_POST]", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}