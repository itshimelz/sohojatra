"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Warning,
  ChatCircle,
  Users,
  Flask,
  ShieldCheck,
  ChartBar,
  CalendarCheck,
  Star,
  Trophy,
  Buildings,
  Database,
  Gear,
  List,
  X,
  ArrowRight,
  type Icon,
} from "@phosphor-icons/react"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"

import { UserMenu } from "@/components/user-menu"
import { useAuth } from "@/components/auth-provider"
import { hasElevatedRole } from "@/lib/roles"
import type { Locale } from "@/lib/i18n/config"
import type { Dictionary } from "@/lib/i18n/dictionaries/en"

type Props = {
  nav: Dictionary["nav"]
  locale: Locale
}

type NavItem = {
  href: string
  label: string
  desc: string
  Icon: Icon
  /** If true, this item is only visible to elevated roles (admin, moderator, etc.) */
  elevated?: boolean
}

type NavGroup = {
  key: string
  label: string
  items: NavItem[]
}

function buildNavGroups(nav: Dictionary["nav"]): NavGroup[] {
  return [
    {
      key: "civic",
      label: nav.civic,
      items: [
        { href: "/concerns", label: nav.concernHub, desc: nav.concernHubDesc, Icon: Warning },
        { href: "/forum", label: nav.voiceForum, desc: nav.voiceForumDesc, Icon: ChatCircle },
        { href: "/collaboration", label: nav.coGovernance, desc: nav.coGovernanceDesc, Icon: Users },
      ],
    },
    {
      key: "knowledge",
      label: nav.knowledge,
      items: [
        { href: "/research", label: nav.researchLab, desc: nav.researchLabDesc, Icon: Flask },
        { href: "/chatbot", label: nav.rightsChatbot, desc: nav.rightsChatbotDesc, Icon: ShieldCheck },
      ],
    },
    {
      key: "government",
      label: nav.government,
      items: [
        { href: "/projects", label: nav.projectTracker, desc: nav.projectTrackerDesc, Icon: ChartBar },
        { href: "/assembly", label: nav.assemblies, desc: nav.assembliesDesc, Icon: CalendarCheck },
      ],
    },
    {
      key: "community",
      label: nav.community,
      items: [
        { href: "/profile", label: nav.reputation, desc: nav.reputationDesc, Icon: Star },
        { href: "/leaderboard", label: nav.leaderboard, desc: nav.leaderboardDesc, Icon: Trophy },
      ],
    },
    {
      key: "transparency",
      label: nav.transparency,
      items: [
        { href: "/dashboard", label: nav.analytics, desc: nav.analyticsDesc, Icon: Buildings },
        { href: "/open-data", label: nav.openData, desc: nav.openDataDesc, Icon: Database },
        { href: "/admin", label: nav.adminPanel, desc: nav.adminPanelDesc, Icon: Gear, elevated: true },
      ],
    },
  ]
}

function NavDropdownItem({ href, label, desc, Icon }: NavItem) {
  return (
    <NavigationMenuLink
      render={<Link href={href} />}
      className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted focus:bg-muted outline-none"
    >
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </NavigationMenuLink>
  )
}

export function SiteHeader({ nav, locale }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { session } = useAuth()
  const userRole = session?.user?.role
  const elevated = hasElevatedRole(userRole)
  const allGroups = buildNavGroups(nav)

  // Filter out elevated-only items for citizens & unauthenticated users
  const navGroups = useMemo(() => {
    if (elevated) return allGroups
    return allGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.elevated),
      }))
      .filter((group) => group.items.length > 0)
  }, [elevated, allGroups])

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-90"
          >
            <Image src="/logo.svg" alt="Sohojatra Logo" width={32} height={32} className="size-8 w-auto" />
            <span className="hidden text-xl font-bold tracking-tight text-foreground sm:block">
              Sohojatra
            </span>
          </Link>

          {/* Desktop mega-menu */}
          <div className="hidden flex-1 justify-center lg:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {navGroups.map((group) => (
                  <NavigationMenuItem key={group.key}>
                    <NavigationMenuTrigger className="text-sm font-medium">
                      {group.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="w-72 p-2">
                        {group.items.map((item) => (
                          <NavDropdownItem key={item.href} {...item} />
                        ))}
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/concerns/submit"
              className={cn(
                buttonVariants({ size: "sm" }),
                "hidden rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none md:inline-flex"
              )}
            >
              {nav.submitConcern}
            </Link>

            <UserMenu loginLabel={nav.login} />



            {/* Mobile hamburger */}
            <button
              className="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-muted lg:hidden"
              aria-label="Toggle navigation"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="size-5" /> : <List className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      {mobileOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto bg-background lg:hidden" style={{ top: "64px" }}>
          <div className="flex flex-col gap-6 px-5 py-6">
            {navGroups.map((group) => (
              <div key={group.key}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <item.Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="border-t border-border/60 pt-4">
              <Link
                href="/concerns/submit"
                onClick={() => setMobileOpen(false)}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md hover:from-emerald-600 hover:to-teal-700 transition-all border-none"
                )}
              >
                {nav.submitConcern}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
