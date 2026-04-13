"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { SignOut, User as UserIcon } from "@phosphor-icons/react"
import { toast } from "sonner"

/**
 * Session-aware user button — shows skeleton → login link or user menu.
 * Relies on AuthProvider (SSR-prefilled) so there's no flash of wrong state.
 */
export function UserButton({ loginLabel }: { loginLabel: string }) {
  const { session, isPending, signOut } = useAuth()
  const router = useRouter()

  // Still loading (should be near-instant with SSR prefill)
  if (session === undefined) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return (
      <Link
        href="/login"
        className={cn(
          buttonVariants(),
          "rounded-full transition-all duration-200"
        )}
      >
        {loginLabel}
      </Link>
    )
  }

  // Authenticated — show user info + sign out
  const user = session.user
  const initials = user.name
    ? user.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully.")
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Failed to sign out. Please try again.")
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Avatar / initials */}
      <Link
        href="/concerns"
        className="flex items-center gap-2 rounded-full px-2 py-1 text-sm font-medium transition-colors hover:bg-muted"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name}
            className="size-7 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {initials}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate sm:inline">
          {user.name}
        </span>
      </Link>

      {/* Sign-out button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isPending}
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Sign out"
      >
        <SignOut className="size-4" />
      </Button>
    </div>
  )
}
