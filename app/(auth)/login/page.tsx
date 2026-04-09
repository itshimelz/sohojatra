import Link from "next/link"

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="text-muted-foreground">
        OTP login screen placeholder for Task 01.
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
