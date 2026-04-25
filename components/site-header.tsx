"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Warning,
  ChatCircle,
  Users,
  ChartBar,
  Gear,
  List,
  X,
  ArrowRight,
  type Icon,
} from "@phosphor-icons/react"
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
        { href: "/forum", label: nav.voiceForum, desc: nav.voiceForumDesc, Icon: ChatCircle },
        { href: "/collaboration", label: nav.coGovernance, desc: nav.coGovernanceDesc, Icon: Users },
      ],
    },
    {
      key: "government",
      label: nav.government,
      items: [
        { href: "/projects", label: nav.projectTracker, desc: nav.projectTrackerDesc, Icon: ChartBar },
      ],
    },
    {
      key: "transparency",
      label: nav.transparency,
      items: [
        { href: "/dashboard", label: nav.analytics, desc: nav.analyticsDesc, Icon: ChartBar },
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
            <Image src="/logo.png" alt="Sohojatra Logo" width={32} height={32} className="size-8 w-auto" />
            <span className="hidden text-xl font-bold tracking-tight text-foreground sm:block">
              Sohojatra
            </span>
          </Link>

          {/* Desktop mega-menu */}
          <div className="hidden flex-1 justify-center lg:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                <NavigationMenuItem>
                  <NavigationMenuLink
                    render={<Link href="/concerns" />}
                    className="group inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {nav.concernHub}
                  </NavigationMenuLink>
                </NavigationMenuItem>
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
            <Link
              href="/concerns"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Warning className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{nav.concernHub}</p>
                <p className="text-xs text-muted-foreground">{nav.concernHubDesc}</p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground/40" />
            </Link>

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
          </div>
        </div>
      )}
    </>
  )
}
