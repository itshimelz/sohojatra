"use client"

import dynamic from "next/dynamic"
import { AuthFormSkeleton } from "@/components/auth-form-skeleton"

const SignupForm = dynamic(
  () =>
    import("@/components/signup-form").then((mod) => ({
      default: mod.SignupForm,
    })),
  { loading: () => <AuthFormSkeleton />, ssr: false }
)

export default function SignupPage() {
  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-background p-6 selection:bg-primary/20 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </main>
  )
}
