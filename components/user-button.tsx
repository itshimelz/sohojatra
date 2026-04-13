"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button-variants"
import { SignOut, User as UserIcon } from "@phosphor-icons/react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function getPhoneLabel(user: unknown) {
  if (user && typeof user === "object" && "phoneNumber" in user) {
    const phoneNumber = (user as { phoneNumber?: string | null }).phoneNumber
    if (phoneNumber) return phoneNumber
  }

  return "Citizen"
}

/**
 * Session-aware user button — shows skeleton → login link or user menu.
 * Relies on AuthProvider (SSR-prefilled) so there's no flash of wrong state.
 */
export function UserButton({ loginLabel }: { loginLabel: string }) {
  const { session, isPending, signOut } = useAuth()
  const router = useRouter()
  const [showProfile, setShowProfile] = useState(false)

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
  const phoneLabel = getPhoneLabel(user)

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="relative size-8 cursor-pointer rounded-full border border-border/40 ring-primary outline-none focus-visible:ring-2">
          <Avatar className="size-8">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="size-4" weight="fill" />
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{user.name || "Citizen"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {phoneLabel}
                </p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowProfile(true)}
          >
            <UserIcon className="mr-2 size-4" />
            <span>My Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={(e) => {
              e.preventDefault()
              void handleSignOut()
            }}
            disabled={isPending}
          >
            <SignOut className="mr-2 size-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>My Profile</DialogTitle>
            <DialogDescription>
              Your basic account information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <Avatar className="size-24 border">
              <AvatarImage
                src={user.image || undefined}
                alt={user.name || ""}
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                <UserIcon className="size-12" weight="fill" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1 text-center">
              <h3 className="text-lg font-semibold">{user.name || "Citizen"}</h3>
              <p className="text-sm text-muted-foreground">{phoneLabel}</p>
              {user.email && (
                <p className="text-sm text-muted-foreground">{user.email}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowProfile(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
