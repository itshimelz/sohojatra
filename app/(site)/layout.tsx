import type { ReactNode } from "react"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"
import { getDictionary, getLocale } from "@/lib/i18n/server"

export default async function SiteLayout({
  children,
}: {
  children: ReactNode
}) {
  const locale = await getLocale()
  const t = await getDictionary(locale)

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground selection:bg-primary/20">
      <SiteHeader nav={t.nav} locale={locale} />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter locale={locale} footer={t.footer} nav={t.nav} />
    </div>
  )
}
