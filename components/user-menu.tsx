"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { hasElevatedRole } from "@/lib/roles"

export function UserMenu({ loginLabel }: { loginLabel: string }) {
  const { session, isPending, signOut } = useAuth()
  const router = useRouter()

  if (isPending && session === undefined) {
    return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className={cn(buttonVariants(), "rounded-full transition-all duration-200")}
      >
        {loginLabel}
      </Link>
    )
  }

  const { name, email, role } = session.user
  const elevated = hasElevatedRole(role)
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold ring-2 ring-primary/20 transition-all hover:ring-4 focus:outline-none"
        aria-label="Open user menu"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium leading-none">{name}</p>
              <p className="text-xs leading-none text-muted-foreground">{email}</p>
              {role && (
                <p className="text-xs leading-none text-primary capitalize">
                  {role.replace("_", " ")}
                </p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          My Profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/concerns")}>
          Browse Concerns
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>
          Dashboard
        </DropdownMenuItem>
        {elevated && (
          <DropdownMenuItem onClick={() => router.push("/admin")}>
            Admin Panel
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={async () => {
            await signOut()
            router.push("/")
            router.refresh()
          }}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
