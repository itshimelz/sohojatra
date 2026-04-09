"use client"

import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  MapPinLine,
  ThumbsUp,
  CheckCircle,
  Megaphone,
  CaretRight,
  ShieldCheck,
} from "@phosphor-icons/react"

export default function MarketingPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Megaphone weight="fill" className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              Sohojatra
            </span>
          </div>
          <nav className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/concerns"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "hidden text-muted-foreground transition-colors duration-200 hover:text-foreground sm:inline-flex"
              )}
            >
              Browse Concerns
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants(),
                "rounded-full shadow-sm transition-all duration-200 hover:shadow-md"
              )}
            >
              Log in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-4 pt-16 pb-16 sm:pt-24 lg:pt-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] bg-[size:24px_24px]"></div>
          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary ring-1 ring-primary/10">
              <ShieldCheck className="mr-1.5 size-4" weight="bold" />
              <span>For the citizens of Dhaka</span>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-balance text-foreground sm:text-5xl lg:text-7xl">
              Together, <span className="text-primary">We Decide.</span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-balance text-muted-foreground sm:text-xl">
              Report local issues, track their progress in real-time, and upvote
              what matters most to your community. A transparent path to a
              better city.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "group h-12 w-full rounded-full px-8 font-semibold shadow-md transition-all duration-200 hover:shadow-lg active:scale-95 sm:w-auto"
                )}
              >
                Report a Concern
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
                View Local Issues
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-muted/30 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                How Sohojatra Works
              </h2>
              <p className="text-lg text-muted-foreground">
                We make it easy to voice your concerns and ensure they are heard
                by the right authorities.
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-lg sm:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <MapPinLine className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Pinpoint Issues
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Easily snap a photo and drop a GPS pin to report problems like
                  broken streetlights, potholes, or waste management issues.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-lg sm:p-8">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ThumbsUp className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Prioritize Together
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  Browse concerns reported by others and upvote the ones that
                  impact you. The community decides what needs immediate
                  attention.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group relative flex flex-col rounded-3xl border border-border/50 bg-background/50 p-6 transition-all duration-300 hover:border-primary/20 hover:bg-background hover:shadow-lg sm:col-span-2 sm:p-8 lg:col-span-1">
                <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <CheckCircle className="size-6" weight="duotone" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  Live Process Tracking
                </h3>
                <p className="leading-relaxed text-muted-foreground">
                  No more guessing. Track the exact status of your reported
                  issue—from submission to review and final resolution—with
                  official updates.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2 text-foreground/80 transition-colors duration-200 hover:text-foreground">
            <Megaphone weight="fill" className="size-5 text-primary" />
            <span className="text-lg font-bold tracking-tight">Sohojatra</span>
          </div>
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} Sohojatra. Built for Dhaka.
          </p>
        </div>
      </footer>
    </div>
  )
}
