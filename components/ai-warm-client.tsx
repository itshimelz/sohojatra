"use client"

import { useEffect, useRef } from "react"

const SESSION_KEY = "sohojatra:ai-warm"

/**
 * Fire-and-forget request so the external AI host (e.g. Render free tier) can cold-start
 * before the user opens flows that POST to /api/analyze. Runs at most once per browser tab.
 */
export function AiWarmClient() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (typeof window === "undefined") return
    try {
      if (window.sessionStorage.getItem(SESSION_KEY)) return
    } catch {
      // storage blocked — still attempt one warm per mount
    }

    void (async () => {
      try {
        await fetch("/api/ai/warm", { method: "GET", cache: "no-store" })
      } catch {
        // ignore network errors
      }
      try {
        window.sessionStorage.setItem(SESSION_KEY, "1")
      } catch {
        // ignore
      }
    })()
  }, [])

  return null
}
