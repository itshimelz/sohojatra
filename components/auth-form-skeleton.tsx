import { Card, CardContent } from "@/components/ui/card"

/**
 * Skeleton shown while auth form (login/signup) is being lazily loaded.
 * Matches the visual layout of the real form to prevent layout shift.
 */
export function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden border-border/40 p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* Form side skeleton */}
          <div className="flex flex-col items-center justify-center gap-5 p-6 md:p-10">
            {/* Icon */}
            <div className="mb-2 h-12 w-12 animate-pulse rounded-xl bg-muted" />
            {/* Title */}
            <div className="h-7 w-48 animate-pulse rounded bg-muted" />
            {/* Subtitle */}
            <div className="h-4 w-64 animate-pulse rounded bg-muted" />

            {/* Input fields */}
            <div className="mt-4 w-full space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-11 w-full animate-pulse rounded-md bg-muted" />
              </div>
              <div className="h-11 w-full animate-pulse rounded-full bg-muted" />
            </div>

            {/* Footer link */}
            <div className="mt-2 h-4 w-52 animate-pulse rounded bg-muted" />
          </div>

          {/* Decorative side skeleton */}
          <div className="hidden border-l border-border/40 bg-muted/30 md:block" />
        </CardContent>
      </Card>
    </div>
  )
}
