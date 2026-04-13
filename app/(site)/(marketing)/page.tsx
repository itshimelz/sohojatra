import Link from "next/link"
import type { Metadata } from "next"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { getDictionary } from "@/lib/i18n/server"
import { SITE_URL } from "@/lib/seo"
import {
  organizationJsonLd,
  websiteJsonLd,
  faqJsonLd,
} from "@/lib/structured-data"
import {
  MapPinLine,
  ThumbsUp,
  CheckCircle,
  CaretRight,
  ShieldCheck,
  ClockCounterClockwise,
  UsersThree,
  MagnifyingGlass,
  Camera,
  PencilSimpleLine,
  ChartLineUp,
  RoadHorizon,
  Lightbulb,
  Drop,
  Trash,
  ShieldWarning,
  Tree,
  Question,
} from "@phosphor-icons/react/dist/ssr"
import { FaqAccordion } from "@/components/faq-accordion"
import { PartnersRail } from "@/components/partners-rail"
import { Card, CardContent } from "@/components/ui/card"

export const metadata: Metadata = {
  title: { absolute: "Sohojatra — Civic Reporting for Dhaka" },
  description:
    "Report local civic issues in Dhaka, track real-time progress, and upvote what matters most. A transparent platform for citizens to improve their city.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "Sohojatra — Together, We Decide.",
    description:
      "Join thousands of Dhaka citizens reporting urban issues, tracking resolutions, and building a better city.",
    url: SITE_URL,
  },
}

export default async function MarketingPage() {
  const t = await getDictionary()

  const categoryIcons = [
    { icon: RoadHorizon, label: t.categories.c1 },
    { icon: Lightbulb, label: t.categories.c2 },
    { icon: Drop, label: t.categories.c3 },
    { icon: Trash, label: t.categories.c4 },
    { icon: ShieldWarning, label: t.categories.c5 },
    { icon: Tree, label: t.categories.c6 },
  ]

  const faqs = [
    { q: t.faq.q1, a: t.faq.a1 },
    { q: t.faq.q2, a: t.faq.a2 },
    { q: t.faq.q3, a: t.faq.a3 },
    { q: t.faq.q4, a: t.faq.a4 },
    { q: t.faq.q5, a: t.faq.a5 },
  ]

  const steps = [
    {
      icon: Camera,
      label: t.howItWorks.step1Label,
      title: t.howItWorks.step1Title,
      desc: t.howItWorks.step1Desc,
    },
    {
      icon: PencilSimpleLine,
      label: t.howItWorks.step2Label,
      title: t.howItWorks.step2Title,
      desc: t.howItWorks.step2Desc,
    },
    {
      icon: ChartLineUp,
      label: t.howItWorks.step3Label,
      title: t.howItWorks.step3Title,
      desc: t.howItWorks.step3Desc,
    },
  ]

  return (
    <main className="flex flex-1 flex-col">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              faqJsonLd(
                faqs.map((f) => ({ question: f.q, answer: f.a }))
              )
            ),
          }}
        />

        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-16 pb-16 sm:pt-24 lg:pt-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px]"></div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary ring-1 ring-primary/10">
              <ShieldCheck className="mr-1.5 size-4" weight="bold" />
              <span>{t.hero.badge}</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl lg:text-7xl">
              {t.hero.title}{" "}
              <span className="text-primary">{t.hero.titleHighlight}</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground sm:text-xl">
              {t.hero.description}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group h-12 w-full rounded-full px-8 font-semibold transition-all duration-200 sm:w-auto"
                )}
              >
                {t.hero.reportConcern}
                <CaretRight
                  weight="bold"
                  className="ml-2 size-4 transition-transform group-hover:translate-x-1"
                />
              </Link>
              <Link
                href="/concerns"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full rounded-full border-border/50 bg-background px-8 font-semibold transition-all duration-200 hover:border-border hover:bg-muted/50 sm:w-auto"
                )}
              >
                {t.hero.viewIssues}
              </Link>
            </div>
          </div>
        </section>

        {/* Impact / Stats Section */}
        <section className="border-y border-border/40 bg-muted/10 py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid grid-cols-1 gap-8 divide-y divide-border/50 text-center sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
                <ClockCounterClockwise
                  className="mb-3 size-8 text-primary"
                  weight="duotone"
                />
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  72 Hours
                </h3>
                <p className="mt-2 text-sm text-balance text-muted-foreground">
                  {t.stats.targetUpdate}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
                <MagnifyingGlass
                  className="mb-3 size-8 text-primary"
                  weight="duotone"
                />
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  100%
                </h3>
                <p className="mt-2 text-sm text-balance text-muted-foreground">
                  {t.stats.tracking}
                </p>
              </div>
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-0">
                <UsersThree
                  className="mb-3 size-8 text-primary"
                  weight="duotone"
                />
                <h3 className="text-3xl font-bold tracking-tight text-foreground">
                  5,000+
                </h3>
                <p className="mt-2 text-sm text-balance text-muted-foreground">
                  {t.stats.activeCitizens}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t.features.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.features.subtitle}
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm sm:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPinLine className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {t.features.f1Title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {t.features.f1Desc}
                </p>
              </div>

              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm sm:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ThumbsUp className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {t.features.f2Title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {t.features.f2Desc}
                </p>
              </div>

              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-sm sm:col-span-2 sm:p-8 lg:col-span-1">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <CheckCircle className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {t.features.f3Title}
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  {t.features.f3Desc}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works — Step-by-Step */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-14 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t.howItWorks.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.howItWorks.subtitle}
              </p>
            </div>

            <div className="relative grid gap-10 sm:grid-cols-3 sm:gap-6">
              {/* Connector line (desktop only) */}
              <div className="pointer-events-none absolute top-12 right-[16.7%] left-[16.7%] hidden h-px bg-border/60 sm:block" />

              {steps.map((step, i) => {
                const Icon = step.icon
                return (
                  <div key={i} className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 mb-5 flex size-24 items-center justify-center rounded-full border-2 border-border/50 bg-background transition-colors duration-300 hover:border-primary/30">
                      <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon className="size-7" weight="duotone" />
                      </div>
                    </div>
                    <span className="mb-2 rounded-full bg-primary/10 px-3 py-0.5 text-xs font-semibold tracking-wider text-primary uppercase">
                      {step.label}
                    </span>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                      {step.desc}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Partners Rail — after steps, before transparency story */}
        <PartnersRail
          title={t.partners.title}
          subtitle={t.partners.subtitle}
        />

        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Explore the platform modules
              </h2>
              <p className="mt-3 text-lg text-muted-foreground">
                The project now has dedicated surfaces for civic discussion,
                constitutional guidance, research, and public accountability.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { href: "/forum", title: "Voice Forum", desc: "Vote on proposals, pin strong comments, and quote-reply threads." },
                { href: "/chatbot", title: "Chatbot", desc: "Bangla-first rights guidance with citations and session memory." },
                { href: "/research", title: "Research Lab", desc: "Open problems, grant applications, and milestone tracking." },
                { href: "/dashboard", title: "Dashboard", desc: "Public KPIs, moderation queue, and heatmap preview." },
              ].map((item) => (
                <Link key={item.href} href={item.href}>
                  <Card className="h-full rounded-3xl border-border/60 transition-transform duration-200 hover:-translate-y-1 hover:border-primary/30">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Tracking Timeline Process Section */}
        <section className="overflow-hidden border-y border-border/40 bg-muted/20 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
              <div>
                <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary">
                  {t.timeline.badge}
                </div>
                <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {t.timeline.title}
                </h2>
                <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
                  {t.timeline.desc}
                </p>
                <div className="flex gap-4">
                  <Link
                    href="/login"
                    className={cn(buttonVariants(), "rounded-full")}
                  >
                    {t.timeline.cta}
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,transparent,black,transparent)] bg-[size:24px_24px]"></div>
                <div className="relative ml-auto max-w-md rounded-3xl border border-border/50 bg-background/80 p-6 backdrop-blur-sm sm:p-8">
                  <h4 className="mb-6 text-lg font-semibold text-foreground">
                    {t.timeline.exampleTitle}
                  </h4>
                  <div className="relative space-y-6 before:absolute before:inset-y-2 before:left-[11px] before:w-0.5 before:bg-border/50">
                    <div className="relative flex gap-4">
                      <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground ring-4 ring-background">
                        <CheckCircle className="size-4" weight="bold" />
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground">
                          {t.timeline.resolved}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {t.timeline.resolvedDesc}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex gap-4">
                      <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-primary/20 text-primary ring-4 ring-background">
                        <div className="size-2 rounded-full bg-primary"></div>
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground">
                          {t.timeline.underReview}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {t.timeline.underReviewDesc}
                        </p>
                      </div>
                    </div>
                    <div className="relative flex gap-4">
                      <div className="relative z-10 flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground ring-4 ring-background">
                        <div className="size-2 rounded-full bg-muted-foreground"></div>
                      </div>
                      <div>
                        <h5 className="font-medium text-foreground">
                          {t.timeline.submitted}
                        </h5>
                        <p className="text-sm text-muted-foreground">
                          {t.timeline.submittedDesc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="bg-background py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t.categories.title}
              </h2>
              <p className="text-lg text-muted-foreground">
                {t.categories.subtitle}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {categoryIcons.map((cat, i) => {
                const Icon = cat.icon
                return (
                  <div
                    key={i}
                    className="group flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-background p-5 text-center transition-all duration-300 hover:border-primary/20 hover:shadow-sm"
                  >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="size-6" weight="duotone" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {cat.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section
          id="faq"
          className="border-t border-border/40 bg-muted/10 py-16 sm:py-24 scroll-mt-24"
        >
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Question className="size-6" weight="duotone" />
              </div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {t.faq.title}
              </h2>
              <p className="text-lg text-muted-foreground">{t.faq.subtitle}</p>
            </div>
            <FaqAccordion items={faqs} />
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative overflow-hidden border-t border-border/40 py-20 sm:py-32">
          {/* Subtle primary tint base */}
          <div className="absolute inset-0 bg-primary/5 dark:bg-primary/10 pointer-events-none"></div>
          {/* Dot-grid pattern — distinct from the hero's line grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_var(--color-primary)_2px,_transparent_2px)] bg-[size:24px_24px] opacity-[0.08] dark:opacity-[0.15] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,_black_30%,_transparent_100%)] pointer-events-none"></div>
          <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {t.cta.title}
            </h2>
            <p className="mb-10 text-lg text-muted-foreground">{t.cta.desc}</p>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-14 rounded-full px-10 text-lg font-semibold transition-all hover:-translate-y-1 active:translate-y-0"
              )}
            >
              {t.cta.button}
            </Link>
          </div>
        </section>
    </main>
  )
}
