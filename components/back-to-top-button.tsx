"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"

const SHOW_AFTER_SCROLL_Y = 320

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setIsVisible(window.scrollY > SHOW_AFTER_SCROLL_Y)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <Button
      type="button"
      size="icon-lg"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed right-4 bottom-5 z-50 rounded-full shadow-lg transition-all duration-300 md:right-6 md:bottom-6 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="size-5" weight="bold" />
    </Button>
  )
}
