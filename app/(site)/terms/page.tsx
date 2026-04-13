import Link from "next/link"
import type { Metadata } from "next"
import {
  Scales,
  ShieldWarning,
  ChatCircleDots,
  ListChecks,
  Envelope,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Terms | Sohojatra",
  description:
    "Terms and acceptable use guidelines for reporting and participating on Sohojatra.",
}

const termsSections = [
  {
    title: "Account Responsibility",
    icon: ListChecks,
    body: "You are responsible for activities under your account. Keep access to your phone/device secure and report suspicious activity quickly.",
  },
  {
    title: "Acceptable Use",
    icon: ShieldWarning,
    body: "Use Sohojatra for legitimate civic concerns. Spam, harassment, false reports, and abusive behavior may result in moderation or account restrictions.",
  },
  {
    title: "Content & Moderation",
    icon: ChatCircleDots,
    body: "Submitted content may be reviewed for quality, safety, and policy compliance. Authorities and moderators may update issue status as part of civic workflows.",
  },
  {
    title: "Service Scope",
    icon: Scales,
    body: "Sohojatra enables reporting and visibility. It does not guarantee resolution timelines by third-party authorities beyond the published process targets.",
  },
] as const

export default function TermsPage() {
  return (
    <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm sm:p-8">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Scales className="size-3.5" weight="bold" />
            Terms of Use
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Terms & Community Standards
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            By using Sohojatra, you agree to the following terms designed to
            keep civic reporting trustworthy, constructive, and safe for
            everyone.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {termsSections.map((section) => {
            const Icon = section.icon

            return (
              <Card key={section.title} className="border border-border/60">
                <CardHeader className="gap-3">
                  <div className="inline-flex size-9 items-center justify-center rounded-2xl bg-accent/40 text-accent-foreground">
                    <Icon className="size-5" weight="duotone" />
                  </div>
                  <CardTitle>{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-muted-foreground">
                    {section.body}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <a href="mailto:support@sohojatra.app">
              <Envelope className="size-4" weight="bold" />
              Contact support
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="size-4" weight="bold" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
