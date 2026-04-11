import Link from "next/link"
import { Megaphone } from "@phosphor-icons/react/dist/ssr"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  locale: Locale
  footer: Dictionary["footer"]
  nav: Pick<Dictionary["nav"], "browseConcerns" | "login">
}

export function SiteFooter({ locale, footer, nav }: Props) {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Megaphone weight="fill" className="size-6 text-primary" />
              <span className="text-lg font-bold tracking-tight">Sohojatra</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              {footer.description}
            </p>
            {/* <p className="mt-4 text-xs leading-relaxed text-muted-foreground/90">
              {footer.legalNote}
            </p> */}
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-foreground uppercase">
              {footer.exploreTitle}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.home}
                </Link>
              </li>
              <li>
                <Link
                  href="/concerns"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.browseConcerns}
                </Link>
              </li>
              <li>
                <Link
                  href="/concerns/submit"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.reportConcern}
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.signIn}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-foreground uppercase">
              {footer.resourcesTitle}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/#faq"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.faq}
                </Link>
              </li>
              <li>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground/90">
                    {footer.contact}
                  </span>
                  <br />
                  <a
                    href={`mailto:${footer.supportEmail}`}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {footer.supportEmail}
                  </a>
                  <span className="mt-1 block text-xs">{footer.contactHint}</span>
                </p>
              </li>
              <li className="pt-1 text-xs text-muted-foreground">
                {footer.privacy} · {footer.terms}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-border/40 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} {footer.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            {/* <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {footer.preferencesTitle}
            </span> */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageSwitcher currentLocale={locale} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
