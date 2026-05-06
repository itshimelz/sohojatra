import { NextResponse } from "next/server"
import { createHash } from "crypto"
import { prisma } from "@/lib/prisma"

function computeHash(blockIndex: number, prevHash: string, timestamp: string, data: unknown): string {
  const content = `${blockIndex}${prevHash}${timestamp}${JSON.stringify(data)}`
  return createHash("sha256").update(content).digest("hex")
}

export async function GET() {
  const blocks = await prisma.auditBlock.findMany({ orderBy: { blockIndex: "asc" } })

  if (blocks.length === 0) {
    return NextResponse.json({ valid: true, chainLength: 0, issues: [] })
  }

  const issues: string[] = []

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const expectedPrevHash = i === 0 ? "0".repeat(64) : blocks[i - 1].hash

    if (block.prevHash !== expectedPrevHash) {
      issues.push(`Block #${block.blockIndex}: prevHash mismatch (chain broken)`)
    }

    const recomputedHash = computeHash(
      block.blockIndex,
      block.prevHash,
      block.timestamp.toISOString(),
      block.data
    )
    if (recomputedHash !== block.hash) {
      issues.push(`Block #${block.blockIndex}: hash mismatch (data tampered)`)
    }
  }

  return NextResponse.json({
    valid: issues.length === 0,
    chainLength: blocks.length,
    issues,
    verifiedAt: new Date().toISOString(),
  })
}
