import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = (await request.json()) as {
    prompt?: string
    adapter?: string
    temperature?: number
  }

  if (!body.prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  const adapter = body.adapter ?? "civic-bd-lora-v1"
  const temperature = body.temperature ?? 0.2

  return NextResponse.json({
    model: "llama3-simulated",
    adapter,
    temperature,
    output: `Simulated LLaMA+LoRA response for prompt: ${body.prompt}`,
    note: "Local deterministic stub for development. Replace with production inference server.",
  })
}
