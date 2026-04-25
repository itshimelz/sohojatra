import type { ReactNode } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { AuthProvider } from "@/components/auth-provider"
import { getDictionary, getLocale } from "@/lib/i18n/server"
import { TranslationProvider } from "@/lib/i18n/context"
import { getServerSession } from "@/lib/auth-session"
import type { AuthSession } from "@/components/auth-provider"

export default async function SiteLayout({
  children,
}: {
  children: ReactNode
}) {
  const locale = await getLocale()
  const t = await getDictionary(locale)

  // Pre-fetch session on the server — passed to AuthProvider
  // so the client never shows a "loading" flash
  let initialSession: AuthSession = null
  try {
    const serverSession = await getServerSession()
    if (serverSession?.user) {
      const u = serverSession.user as typeof serverSession.user & {
        role?: string
        phoneNumber?: string | null
        onboarded?: boolean
        dob?: string | Date | null
        education?: string | null
      }
      initialSession = {
        user: {
          id: u.id,
          name: u.name ?? "Citizen",
          email: u.email ?? "",
          image: u.image ?? null,
          role: u.role,
          phoneNumber: u.phoneNumber ?? undefined,
        },
      }
    }
  } catch {
    // If session fetch fails (e.g. DB down), proceed as unauthenticated
    initialSession = null
  }

  return (
    <AuthProvider initialSession={initialSession}>
      <TranslationProvider dictionary={t}>
        <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary/20">
          <SiteHeader nav={t.nav} locale={locale} />
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter locale={locale} footer={t.footer} nav={t.nav} />
        </div>
      </TranslationProvider>
    </AuthProvider>
  )
}
