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
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "privacy">("profile")

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
        <DialogContent className="sm:max-w-[700px] p-0 flex flex-col md:flex-row overflow-hidden min-h-[450px]">
          <DialogTitle className="sr-only">My Profile & Settings</DialogTitle>
          <DialogDescription className="sr-only">Manage your profile information and account settings.</DialogDescription>
          
          {/* Sidebar */}
          <div className="w-full md:w-[220px] bg-secondary/30 flex flex-col p-4 border-b md:border-r md:border-b-0 space-y-2 shrink-0">
            <h2 className="font-semibold text-sm px-3 mb-2 text-muted-foreground uppercase tracking-wider">Settings</h2>
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className="justify-start w-full"
              onClick={() => setActiveTab("profile")}
            >
              Profile Data
            </Button>
            <Button
              variant={activeTab === "account" ? "secondary" : "ghost"}
              className="justify-start w-full"
              onClick={() => setActiveTab("account")}
            >
              Account
            </Button>
            <Button
              variant={activeTab === "privacy" ? "secondary" : "ghost"}
              className="justify-start w-full"
              onClick={() => setActiveTab("privacy")}
            >
              Privacy
            </Button>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-6 relative overflow-y-auto max-h-[70vh] md:max-h-full">
            <div className="flex flex-col h-full">
              {activeTab === "profile" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold">General Profile</h3>
                    <p className="text-sm text-muted-foreground">Your basic civic identities and personal data.</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Avatar className="size-20 border shadow-sm">
                      <AvatarImage src={user.image || undefined} alt={user.name || ""} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <UserIcon className="size-10" weight="fill" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium text-lg">{user.name || "Citizen"}</h4>
                      <p className="text-sm text-muted-foreground">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Citizen Member"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Email Address</p>
                      <p className="text-sm font-medium">{user.email || "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Phone Number</p>
                      <p className="text-sm font-medium">{phoneLabel !== "Citizen" ? phoneLabel : "—"}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Date of Birth</p>
                      <p className="text-sm font-medium">
                        {user.dob ? new Date(user.dob).toLocaleDateString() : "Not provided"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground uppercase">NID Number</p>
                      <p className="text-sm font-medium">{user.nid || "Not provided"}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Education</p>
                      <p className="text-sm font-medium capitalize">{user.education || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "account" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold">Account Options</h3>
                    <p className="text-sm text-muted-foreground">Manage your authentication and active sessions.</p>
                  </div>
                  
                  <div className="pt-4 space-y-4">
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); setShowProfile(false); void handleSignOut(); }}>
                      <SignOut className="mr-2 size-4" />
                      Sign out of this device
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      If you have lost a device or noticed suspicious activity, you can securely sign out from options later available here.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <h3 className="text-lg font-semibold">Privacy</h3>
                    <p className="text-sm text-muted-foreground">Control who sees what and how your data is handled.</p>
                  </div>
                  
                  <div className="pt-4 rounded-lg bg-muted/30 p-4 border border-border/50 text-sm text-muted-foreground">
                    <span className="block font-medium text-foreground mb-1">Your data is strictly secured.</span>
                    We do not share your NID, Date of Birth, or precise personal details with common civic entities unless explicitly authorized or mandated.
                  </div>
                  
                  <Button variant="outline" disabled className="w-full">Download Personal Data Archive</Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
