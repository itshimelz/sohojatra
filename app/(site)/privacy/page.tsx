import Link from "next/link"
import type { Metadata } from "next"
import {
  ShieldCheck,
  Lock,
  Database,
  Eye,
  Lifebuoy,
  Envelope,
  ArrowLeft,
} from "@phosphor-icons/react/dist/ssr"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button-variants"
import { Separator } from "@/components/ui/separator"

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Sohojatra handles citizen data, protects privacy, and keeps civic reporting secure.",
  alternates: { canonical: "https://sohojatra.app/privacy" },
  openGraph: {
    title: "Privacy — Sohojatra",
    description:
      "Learn how Sohojatra responsibly handles data, protects citizen privacy, and secures civic reporting.",
    url: "https://sohojatra.app/privacy",
  },
}

const privacySections = [
  {
    title: "What We Collect",
    icon: Database,
    body: "We collect only what is needed to run civic reporting: account identity, submitted concerns, attached media, and basic device/session metadata for security and abuse prevention.",
  },
  {
    title: "How We Use Data",
    icon: Eye,
    body: "Your data is used to verify identity, route concerns to the right authority, display public issue status, and improve platform reliability. We do not sell personal data.",
  },
  {
    title: "How We Protect Data",
    icon: Lock,
    body: "We use secure transport, authentication controls, and restricted access patterns. Sensitive values are managed through environment variables and never hardcoded in source.",
  },
  {
    title: "Data Retention",
    icon: ShieldCheck,
    body: "We retain data only for operational, legal, and accountability needs. Abuse-related logs may be retained longer when required for incident investigation.",
  },
  {
    title: "Support & Requests",
    icon: Lifebuoy,
    body: "For privacy requests, corrections, or account concerns, contact support. We will verify ownership and respond through the registered channel.",
  },
] as const

export default function PrivacyPage() {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden border-b border-border/50 px-4 pt-14 pb-12 sm:px-6 lg:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--primary)/0.16),transparent_42%),radial-gradient(circle_at_85%_20%,hsl(var(--accent)/0.14),transparent_40%)]" />
        <div className="mx-auto max-w-5xl">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <ShieldCheck className="size-3.5" weight="bold" />
            Privacy Notice
          </Badge>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Privacy at Sohojatra
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            We are building civic transparency with responsible data handling.
            This page explains what information we process and how we keep it
            secure.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>Last updated: April 2026</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Scope: Web platform & support services</span>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2">
          {privacySections.map((section) => {
            const Icon = section.icon

            return (
              <Card
                key={section.title}
                className="border border-border/60 bg-card/90 shadow-sm"
              >
                <CardHeader className="gap-3">
                  <div className="inline-flex size-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
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
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-border/60 bg-muted/30 p-6 sm:p-8">
          <h2 className="text-2xl font-semibold tracking-tight">Need help?</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Contact our support team for privacy questions, account concerns, or
            data access requests.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href="mailto:support@sohojatra.app"
              className={buttonVariants({ variant: "default" })}
            >
              <Envelope className="size-4" weight="bold" />
              support@sohojatra.app
            </a>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              <ArrowLeft className="size-4" weight="bold" />
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
