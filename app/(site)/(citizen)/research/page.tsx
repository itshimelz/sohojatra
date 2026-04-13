import { Bank, Briefcase, CalendarCheck, GraduationCap } from "@phosphor-icons/react/dist/ssr"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { researchProblems } from "@/lib/nagarik/mock"

export default function ResearchPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <Badge variant="secondary" className="rounded-full">Research Lab</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          Open civic problems with grant-backed applications
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Universities and experts can apply to solve civic problems, then verify
          milestones before the next tranche is released.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <div className="space-y-4">
          {researchProblems.map((problem) => (
            <Card key={problem.id} className="rounded-3xl border-border/60">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline" className="rounded-full">{problem.ministry}</Badge>
                  <span className="text-sm text-muted-foreground">Deadline: {problem.deadline}</span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">{problem.title}</h2>
                <p className="text-sm text-muted-foreground">Grant: {problem.grant}</p>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-foreground/90">{problem.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button className="rounded-full">
                    <Briefcase className="mr-2 size-4" />
                    Apply
                  </Button>
                  <Button variant="outline" className="rounded-full">
                    <CalendarCheck className="mr-2 size-4" />
                    Milestone Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <h2 className="text-xl font-semibold">Workflow</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><GraduationCap className="mr-2 inline size-4 text-primary" />Expert and university review panel</p>
              <p><Bank className="mr-2 inline size-4 text-primary" />Phased bKash or bank transfer disbursement</p>
              <p>Milestone verification required before new funding is unlocked</p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 bg-muted/20">
            <CardHeader>
              <h2 className="text-xl font-semibold">Public outcomes</h2>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Project progress feed</p>
              <p>University contribution leaderboard</p>
              <p>Citizen-facing impact summaries</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}