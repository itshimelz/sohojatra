"use client"

import { useTransition } from "react"
import { Translate } from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { setLocaleAction } from "@/lib/i18n/actions"
import type { Locale } from "@/lib/i18n/config"

type Props = {
  currentLocale: Locale
}

export function LanguageSwitcher({ currentLocale }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    const nextLocale: Locale = currentLocale === "en" ? "bn" : "en"

    startTransition(async () => {
      await setLocaleAction(nextLocale)
      // Refresh the page to load the new dictionary on the server
      router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className="flex h-9 items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
      aria-label="Toggle language"
    >
      <Translate className="size-4" weight="bold" />
      <span className="hidden sm:inline">
        {currentLocale === "en" ? "বাংলা" : "EN"}
      </span>
    </button>
  )
}
