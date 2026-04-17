import type { ReactNode } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { AuthProvider } from "@/components/auth-provider"
import { getDictionary, getLocale } from "@/lib/i18n/server"
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
      initialSession = {
        user: {
          id: serverSession.user.id,
          name: serverSession.user.name ?? "Citizen",
          email: serverSession.user.email ?? "",
          image: serverSession.user.image ?? null,
          role: (serverSession.user as { role?: string }).role,
          phoneNumber: (serverSession.user as { phoneNumber?: string })
            .phoneNumber,
        },
      }
    }
  } catch {
    // If session fetch fails (e.g. DB down), proceed as unauthenticated
    initialSession = null
  }

  return (
    <AuthProvider initialSession={initialSession}>
      <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary/20">
        <SiteHeader nav={t.nav} locale={locale} />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter locale={locale} footer={t.footer} nav={t.nav} />
      </div>
    </AuthProvider>
  )
}
