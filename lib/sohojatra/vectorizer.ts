/**
 * Vectorizer.AI wrapper — converts uploaded images (scanned notices, hand-written
 * complaints, ID photos with sensitive backgrounds) into clean SVG vectors for
 * display alongside the rights chatbot's answers.
 *
 * Auth: Basic auth with API_ID:API_SECRET (per vectorizer.ai docs). Set:
 *   VECTORIZER_API_ID=...
 *   VECTORIZER_API_SECRET=...
 */

const VECTORIZER_URL = "https://api.vectorizer.ai/api/v1/vectorize"

export type VectorizerMode = "production" | "preview" | "test" | "test_preview"

export type VectorizerOptions = {
  mode?: VectorizerMode
  colors?: number
  detailLevel?: "low" | "medium" | "high"
  colorMode?: "color" | "mono"
}

export class VectorizerConfigError extends Error {}

function requireCredentials(): { id: string; secret: string } {
  const id = process.env.VECTORIZER_API_ID
  const secret = process.env.VECTORIZER_API_SECRET
  if (!id || !secret) {
    throw new VectorizerConfigError(
      "VECTORIZER_API_ID and VECTORIZER_API_SECRET must be set to vectorize images.",
    )
  }
  return { id, secret }
}

function basicAuth(id: string, secret: string): string {
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64")
}

function applyOptions(form: FormData, opts: VectorizerOptions) {
  // Safer defaults for civic docs: keep it cheap via `preview` unless caller
  // explicitly asks for production credits.
  form.append("mode", opts.mode ?? "preview")
  if (opts.colors !== undefined) {
    form.append("processing.palette.target_colors", String(opts.colors))
  }
  if (opts.detailLevel) {
    const detail = opts.detailLevel === "low" ? "low" : opts.detailLevel === "high" ? "high" : "auto"
    form.append("processing.shapes.min_area_px", detail === "low" ? "64" : detail === "high" ? "4" : "16")
  }
  if (opts.colorMode === "mono") {
    form.append("processing.palette.palette", "bw")
  }
}

/** Vectorize a single image. Returns the SVG body as a Buffer. */
export async function vectorize(
  image: Blob | ArrayBuffer | Uint8Array,
  filename: string,
  opts: VectorizerOptions = {},
): Promise<{ svg: Buffer; contentType: string }> {
  const { id, secret } = requireCredentials()
  const form = new FormData()

  let blob: Blob
  if (image instanceof Blob) {
    blob = image
  } else {
    const bytes =
      image instanceof Uint8Array
        ? new Uint8Array(image.buffer.slice(image.byteOffset, image.byteOffset + image.byteLength))
        : new Uint8Array(image)
    blob = new Blob([bytes.buffer as ArrayBuffer])
  }

  form.append("image", blob, filename)
  applyOptions(form, opts)

  const response = await fetch(VECTORIZER_URL, {
    method: "POST",
    headers: { Authorization: basicAuth(id, secret) },
    body: form,
    redirect: "follow",
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new Error(`Vectorizer request failed (${response.status}): ${detail}`)
  }

  const svg = Buffer.from(await response.arrayBuffer())
  return { svg, contentType: response.headers.get("content-type") ?? "image/svg+xml" }
}

/**
 * Run multiple option sets in parallel — useful when you want to offer the
 * citizen a choice between "high detail", "few colours" and "black/white"
 * outputs for a scanned legal notice.
 */
export async function vectorizeVariants(
  image: Blob | ArrayBuffer | Uint8Array,
  filename: string,
  workflows: Array<{ name: string; options: VectorizerOptions }>,
): Promise<Array<{ name: string; svg: Buffer; error?: string }>> {
  return Promise.all(
    workflows.map(async ({ name, options }) => {
      try {
        const { svg } = await vectorize(image, filename, options)
        return { name, svg }
      } catch (error) {
        return {
          name,
          svg: Buffer.alloc(0),
          error: error instanceof Error ? error.message : String(error),
        }
      }
    }),
  )
}
