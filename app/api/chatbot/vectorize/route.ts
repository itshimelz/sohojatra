import { NextResponse } from "next/server"

import {
  VectorizerConfigError,
  vectorize,
  vectorizeVariants,
  type VectorizerOptions,
} from "@/lib/sohojatra/vectorizer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 8 * 1024 * 1024 // 8MB

function parseVariants(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.length === 0) return null
  try {
    const parsed = JSON.parse(value) as Array<{ name: string; options: VectorizerOptions }>
    if (!Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data upload" },
      { status: 415 },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = form.get("image")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image file is required" }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `image exceeds ${MAX_BYTES} bytes` },
      { status: 413 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const variants = parseVariants(form.get("variants"))

  try {
    if (variants && variants.length > 0) {
      const results = await vectorizeVariants(buffer, file.name, variants)
      return NextResponse.json({
        ok: true,
        variants: results.map((r) => ({
          name: r.name,
          error: r.error ?? null,
          svg: r.error ? null : r.svg.toString("utf8"),
        })),
      })
    }

    const opts: VectorizerOptions = {
      mode: (form.get("mode") as VectorizerOptions["mode"]) ?? "preview",
      colorMode: (form.get("colorMode") as VectorizerOptions["colorMode"]) ?? undefined,
      detailLevel:
        (form.get("detailLevel") as VectorizerOptions["detailLevel"]) ?? undefined,
      colors: form.get("colors") ? Number(form.get("colors")) : undefined,
    }

    const { svg, contentType: svgContentType } = await vectorize(buffer, file.name, opts)
    return new Response(svg.toString("utf8"), {
      headers: {
        "Content-Type": svgContentType,
        "Content-Disposition": `inline; filename="${file.name.replace(/\.[^.]+$/, "")}.svg"`,
      },
    })
  } catch (error) {
    const status = error instanceof VectorizerConfigError ? 503 : 502
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status },
    )
  }
}
