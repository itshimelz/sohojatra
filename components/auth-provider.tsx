"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react"
import type { ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

// ─── Types ────────────────────────────────────────────────────
export type AuthUser = {
  id: string
  name: string
  email: string
  image?: string | null
  role?: string
  phoneNumber?: string | null
  onboarded?: boolean
  dob?: Date | string | null
  education?: string | null
}

export type AuthSession = {
  user: AuthUser
} | null

type AuthContextValue = {
  /** Current session — null means unauthenticated, undefined means still loading */
  session: AuthSession | undefined
  /** True while session is being fetched/refreshed */
  isPending: boolean
  /** Force-refresh session from server */
  refresh: () => void
  /** Sign out and clear session */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ─── Provider ─────────────────────────────────────────────────
type AuthProviderProps = {
  /** Server-side pre-fetched session — avoids loading flash */
  initialSession?: AuthSession
  children: ReactNode
}

export function AuthProvider({ initialSession, children }: AuthProviderProps) {
  const [session, setSession] = useState<AuthSession | undefined>(
    initialSession !== undefined ? initialSession : undefined
  )
  const [isPending, startTransition] = useTransition()

  const refresh = useCallback(() => {
    startTransition(async () => {
      try {
        const result = await authClient.getSession()
        if (result.data?.user) {
          setSession({
            user: result.data.user as AuthUser,
          })
        } else {
          setSession(null)
        }
      } catch {
        setSession(null)
      }
    })
  }, [])

  // Hydrate with fresh session on mount (only if not SSR-prefilled)
  useEffect(() => {
    if (initialSession === undefined) {
      refresh()
    }
  }, [initialSession, refresh])

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut()
    } finally {
      setSession(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ session, isPending, refresh, signOut }),
    [session, isPending, refresh, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>")
  }
  return ctx
}
