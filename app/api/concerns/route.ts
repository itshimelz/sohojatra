/**
 * POST /api/concerns — Create a new civic concern.
 *
 * SECURITY:
 *   - Requires authenticated session (401 if missing).
 *   - Author identity is extracted from the session, NOT the request body.
 *   - Prevents identity spoofing by ignoring client-supplied authorName.
 *
 * GET /api/concerns — List all concerns (public, no auth required).
 */
import { NextResponse } from "next/server"

import { requireSession } from "@/lib/api-guard"
import { createConcern, listConcerns } from "@/lib/sohojatra/store"
import { createConcernSchema } from "@/lib/validation/concerns"
import { z } from "zod"

// GET is public — anyone can view concerns
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
    const session = await requireSession(request)
    if (session instanceof Response) return session

    const body = await request.json()
    const validatedBody = createConcernSchema.parse(body)

    const concern = await createConcern({
      title: validatedBody.title,
      description: validatedBody.description,
      // Identity from session, NOT body
      authorName: session.userName || "Citizen",
      locationLat: validatedBody.locationLat,
      locationLng: validatedBody.locationLng,
      location: validatedBody.location,
      photos: validatedBody.photos ?? [],
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