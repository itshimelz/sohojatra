"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-9 rounded-full"
        aria-hidden
        tabIndex={-1}
      >
        <span className="size-5" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 rounded-full text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? (
        <Sun className="size-5" weight="bold" />
      ) : (
        <Moon className="size-5" weight="bold" />
      )}
    </Button>
  )
}
