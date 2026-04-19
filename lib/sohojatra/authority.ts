import { prisma } from "@/lib/prisma"

export type AuthorityRecord = {
  id: string
  agency: string
  metric: string
  value: string
  updatedAt: string
}

const db = prisma as unknown as Record<string, any>

function hasModel(name: string) {
  return Boolean(db?.[name])
}

async function computeLiveMetrics(): Promise<AuthorityRecord[]> {
  const results: AuthorityRecord[] = []
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const now = new Date().toISOString()

  if (hasModel("concern")) {
    try {
      // Total resolved concerns in last 7 days
      const resolvedRecently = await db.concern.count({
        where: { status: "Resolved", updatedAt: { gte: sevenDaysAgo } },
      })

      results.push({
        id: "live-resolved-7d",
        agency: "Platform",
        metric: "Resolved concerns (7d)",
        value: String(resolvedRecently),
        updatedAt: now,
      })

      // Total open concerns
      const openCount = await db.concern.count({
        where: { status: { not: "Resolved" } },
      })

      results.push({
        id: "live-open",
        agency: "Platform",
        metric: "Open concerns",
        value: String(openCount),
        updatedAt: now,
      })

      // Avg urgency score across all concerns
      const avg = await db.concern.aggregate({ _avg: { urgencyScore: true } })
      const avgUrgency = avg._avg?.urgencyScore
      if (avgUrgency !== null && avgUrgency !== undefined) {
        results.push({
          id: "live-urgency",
          agency: "Platform",
          metric: "Avg urgency score",
          value: Number(avgUrgency).toFixed(2),
          updatedAt: now,
        })
      }
    } catch {
      // DB unavailable — return empty live metrics
    }
  }

  return results
}

export async function listAuthorityRecords(): Promise<AuthorityRecord[]> {
  const liveMetrics = await computeLiveMetrics()

  // Also return any admin-managed authority metrics from the DB
  if (hasModel("authorityMetric")) {
    try {
      const rows = await db.authorityMetric.findMany({
        orderBy: { updatedAt: "desc" },
      })

      const stored: AuthorityRecord[] = rows.map((row: any) => ({
        id: row.id,
        agency: row.agency,
        metric: row.metric,
        value: row.value,
        updatedAt: new Date(row.updatedAt).toISOString(),
      }))

      return [...liveMetrics, ...stored]
    } catch {
      // Fall through
    }
  }

  return liveMetrics
}

export async function upsertAuthorityMetric(input: {
  agency: string
  metric: string
  value: string
}): Promise<AuthorityRecord | null> {
  if (!hasModel("authorityMetric")) return null

  try {
    const row = await db.authorityMetric.upsert({
      where: { agency_metric: { agency: input.agency, metric: input.metric } },
      update: { value: input.value },
      create: {
        id: `ar-${crypto.randomUUID().slice(0, 8)}`,
        agency: input.agency.trim(),
        metric: input.metric.trim(),
        value: input.value.trim(),
      },
    })

    return {
      id: row.id,
      agency: row.agency,
      metric: row.metric,
      value: row.value,
      updatedAt: new Date(row.updatedAt).toISOString(),
    }
  } catch {
    return null
  }
}
