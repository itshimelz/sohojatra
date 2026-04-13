import { ChartBar, Clock, MapPin, Users } from "@phosphor-icons/react/dist/ssr"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { governanceKpis, moderationQueue } from "@/lib/nagarik/mock"

export default function DashboardPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Governance Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Accountability metrics and moderation signals
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Public indicators for resolution speed, transparency, and current review queues.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {governanceKpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-3xl border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-muted-foreground">{kpi.label}</h2>
                <ChartBar className="size-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold tracking-tight">{kpi.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{kpi.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold">Active concern heatmap preview</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className={`aspect-square rounded-2xl border border-border/60 ${index % 3 === 0 ? "bg-primary/20" : index % 2 === 0 ? "bg-primary/10" : "bg-muted/40"}`}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span><MapPin className="mr-1 inline size-4" />Division to ward drill-down</span>
              <span><Clock className="mr-1 inline size-4" />Updated in real time</span>
              <span><Users className="mr-1 inline size-4" />Public-facing metrics</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader>
            <h2 className="text-xl font-semibold">Moderation queue</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {moderationQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.reason}</p>
                  </div>
                  <span className="rounded-full bg-background px-3 py-1 text-xs font-semibold">
                    {item.status}
                  </span>
                </div>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Severity: {item.severity}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}