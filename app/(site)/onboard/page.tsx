import { requireServerSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { OnboardWizard } from "@/components/onboard-wizard"

export const metadata = {
  title: "Complete Your Profile - Sohojatra",
}

export default async function OnboardPage() {
  const session = await requireServerSession()

  // If already onboarded, redirect home
  if (session.user.onboarded) {
    redirect("/")
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-4">
      {/* Background styling for the wizard container area if needed */}
      <div className="absolute inset-0 -z-10 bg-primary/5 dark:bg-primary/10 pointer-events-none"></div>
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle,_var(--color-primary)_2px,_transparent_2px)] bg-[size:24px_24px] opacity-[0.08] dark:opacity-[0.15] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,_black_30%,_transparent_100%)] pointer-events-none"></div>
      
      <div className="text-center mt-12 mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Welcome to <span className="text-primary">Sohojatra</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Let&apos;s get your profile set up so you can start making a difference.
        </p>
      </div>
      
      <OnboardWizard user={session.user} />
    </main>
  )
}
