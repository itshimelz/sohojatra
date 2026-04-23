"use client"

import { createContext, useContext } from "react"
import type { Dictionary } from "./dictionaries/en"

const TranslationContext = createContext<Dictionary | null>(null)

export function TranslationProvider({
  children,
  dictionary,
}: {
  children: React.ReactNode
  dictionary: Dictionary
}) {
  return (
    <TranslationContext.Provider value={dictionary}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useT(): Dictionary {
  const ctx = useContext(TranslationContext)
  if (!ctx) throw new Error("useT must be used within TranslationProvider")
  return ctx
}
