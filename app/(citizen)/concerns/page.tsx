import Link from "next/link"

export default function ConcernsPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Concerns</h1>
      <p className="text-muted-foreground">
        Concern list placeholder for Task 01.
      </p>
      <Link
        className="text-primary underline-offset-4 hover:underline"
        href="/"
      >
        Back to home
      </Link>
    </main>
  )
}
