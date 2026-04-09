import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Sohojatra</h1>
        <p className="text-muted-foreground">
          Together, we decide. Citizen-first urban concern reporting platform.
        </p>
      </header>

      <section className="flex flex-col gap-3 sm:flex-row">
        <Link href="/login">
          <Button>Sign in with OTP</Button>
        </Link>
        <Link href="/concerns">
          <Button variant="outline">Browse concerns</Button>
        </Link>
      </section>
    </main>
  )
}
