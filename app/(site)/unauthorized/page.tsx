import Link from "next/link"
import type { Metadata } from "next"
import { ShieldWarning } from "@phosphor-icons/react/dist/ssr"

export const metadata: Metadata = {
  title: "Unauthorized",
  description: "You do not have permission to access this page.",
  robots: { index: false, follow: false },
}

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
        <ShieldWarning className="h-10 w-10 text-destructive" weight="duotone" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
        <p className="max-w-md text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe
          this is a mistake, please contact an administrator.
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Go Home
        </Link>
      </div>
    </main>
  )
}
