import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  locale: Locale
  footer: Dictionary["footer"]
  nav: Pick<
    Dictionary["nav"],
    | "browseConcerns"
    | "login"
    | "researchLab"
    | "rightsChatbot"
    | "assemblies"
    | "leaderboard"
    | "openData"
    | "coGovernance"
  >
}

export function SiteFooter({ locale, footer, nav }: Props) {
  return (
    <footer className="border-t border-border/40 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <Image src="/Sohojatra_logo.svg" alt="Sohojatra Logo" width={32} height={32} className="size-8 w-auto" />
            <span className="text-lg font-bold tracking-tight">
              Sohojatra
            </span>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {footer.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
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
                  href="/concerns/heatmap"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.concernHeatmap}
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
                  href="/collaboration"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.coGovernance}
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
                  href="/research"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.researchLab}
                </Link>
              </li>
              <li>
                <Link
                  href="/chatbot"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.rightsChatbot}
                </Link>
              </li>
              <li>
                <Link
                  href="/assembly"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.assemblies}
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.leaderboard}
                </Link>
              </li>
              <li>
                <Link
                  href="/open-data"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {nav.openData}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold tracking-wide text-foreground uppercase">
              {footer.contact}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/login"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {footer.signIn}
                </Link>
              </li>
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
                  <a
                    href={`mailto:${footer.supportEmail}`}
                    className="text-xs text-primary underline-offset-4 hover:underline"
                  >
                    {footer.supportEmail}
                  </a>
                  <span className="mt-1 block text-xs">
                    {footer.contactHint}
                  </span>
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-border/40 pt-6 sm:mt-10 sm:flex-row sm:items-center sm:justify-between sm:pt-8">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            &copy; {new Date().getFullYear()} {footer.tagline}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-end">
            <p className="text-xs text-muted-foreground">
              <Link
                href="/privacy"
                className="transition-colors hover:text-foreground"
              >
                {footer.privacy}
              </Link>{" "}
              ·{" "}
              <Link
                href="/terms"
                className="transition-colors hover:text-foreground"
              >
                {footer.terms}
              </Link>
            </p>
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
