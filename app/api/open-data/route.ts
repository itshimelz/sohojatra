import { NextResponse } from "next/server"

import {
  getDashboardSnapshot,
  listConcerns,
  listProposals,
  listResearchProblems,
  listAwards,
  listProjects,
  listSolutionPlans,
  listAssemblyEvents,
  listActionLog,
  type ActionLogEntry,
  type AssemblyEvent,
  type ProjectMilestone,
  type ProjectTracker,
  type ProposalRecord,
  type SolutionPlan,
} from "@/lib/sohojatra/store"
import type { Concern } from "@/lib/concerns/mock"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dataset = searchParams.get("dataset")

  const [concerns, proposals, researchProblems, awards, projects, plans, events, actionLog, dashboard] =
    await Promise.all([
      listConcerns(),
      listProposals(),
      listResearchProblems(),
      listAwards(),
      listProjects(),
      listSolutionPlans(),
      listAssemblyEvents(),
      listActionLog({ limit: 500 }),
      getDashboardSnapshot(),
    ])

  const openData = {
    timestamp: new Date().toISOString(),
    version: "2.0",
    license: "CC BY 4.0",
    compliance: "PDPO 2025 — no personally identifiable information exported",
    datasets: {
      concerns: {
        count: concerns.length,
        data: concerns.map((c: Concern) => ({
          id: c.id,
          title: c.title,
          description: c.description,
          status: c.status,
          upvotes: c.upvotes,
          downvotes: c.downvotes,
          location: c.location,
          createdAt: c.createdAt,
        })),
      },
      proposals: {
        count: proposals.length,
        data: proposals.map((p: ProposalRecord) => ({
          id: p.id,
          title: p.title,
          body: p.body,
          author: p.author,
          category: p.category,
          votes: p.votes,
          downvotes: p.downvotes,
          commentCount: (p.comments || []).length,
          createdAt: p.createdAt,
        })),
      },
      researchProblems: {
        count: researchProblems.length,
        data: researchProblems,
      },
      awards: {
        count: awards.length,
        data: awards,
      },
      projects: {
        count: projects.length,
        data: projects.map((p: ProjectTracker) => ({
          id: p.id,
          title: p.title,
          ministry: p.ministry,
          department: p.department,
          status: p.status,
          progress: p.progress,
          deadline: p.deadline,
          budgetAllocatedBdt: p.budgetAllocatedBdt,
          budgetSpentBdt: p.budgetSpentBdt,
          milestoneCount: p.milestones.length,
          completedMilestones: p.milestones.filter(
            (m: ProjectMilestone) => m.status === "Verified"
          ).length,
        })),
      },
      solutionPlans: {
        count: plans.length,
        data: plans.map((p: SolutionPlan) => ({
          id: p.id,
          concernId: p.concernId,
          title: p.title,
          summary: p.summary,
          budgetEstimateBdt: p.budgetEstimateBdt,
          timeline: p.timeline,
          status: p.status,
          submittedBy: p.submittedBy,
          assignedDepartment: p.assignedDepartment,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      },
      assemblyEvents: {
        count: events.length,
        data: events.map((e: AssemblyEvent) => ({
          id: e.id,
          title: e.title,
          date: e.date,
          time: e.time,
          location: e.location,
          organizer: e.organizer,
          topic: e.topic,
          status: e.status,
          rsvpCount: e.rsvps.length,
          hasMinutes: Boolean(e.minutesUrl),
        })),
      },
      actionLog: {
        count: actionLog.length,
        data: actionLog.map((entry: ActionLogEntry) => ({
          id: entry.id,
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          actorRole: entry.actorRole,
          createdAt: entry.createdAt,
        })),
      },
      statistics: {
        totalConcerns: concerns.length,
        totalProposals: proposals.length,
        totalResearch: researchProblems.length,
        totalAwards: awards.length,
        totalProjects: projects.length,
        totalSolutionPlans: plans.length,
        totalAssemblyEvents: events.length,
        activeProjects: projects.filter(
          (p: ProjectTracker) => p.status === "In Progress"
        ).length,
        approvedPlans: plans.filter(
          (p: SolutionPlan) => p.status === "Approved"
        ).length,
        resolvedConcerns: concerns.filter((c: Concern) => c.status === "Resolved").length,
        averageConcernVotes:
          concerns.length > 0
            ? Math.round(
                concerns.reduce((sum: number, c: Concern) => sum + c.upvotes, 0) / concerns.length
              )
            : 0,
        topConcerns: concerns.slice(0, 5).map((c: Concern, idx: number) => ({
          rank: idx + 1,
          title: c.title,
          votes: c.upvotes,
          status: c.status,
        })),
      },
      dashboard: {
        data: dashboard,
      },
    },
  }

  const datasetMap: Record<string, unknown> = {
    concerns: openData.datasets.concerns,
    proposals: openData.datasets.proposals,
    research: openData.datasets.researchProblems,
    awards: openData.datasets.awards,
    projects: openData.datasets.projects,
    "solution-plans": openData.datasets.solutionPlans,
    "assembly-events": openData.datasets.assemblyEvents,
    "action-log": openData.datasets.actionLog,
    statistics: openData.datasets.statistics,
    dashboard: openData.datasets.dashboard,
  }

  if (dataset && dataset in datasetMap) {
    return NextResponse.json(datasetMap[dataset])
  }

  return NextResponse.json(openData)
}
