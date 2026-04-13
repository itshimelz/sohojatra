"use client"

import Link from "next/link"
import Image from "next/image"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { UserButton } from "@/components/user-button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

type Props = {
  nav: {
    browseConcerns: string
    submitConcern: string
    howItWorks: string
    login: string
  }
}

export function SiteHeader({ nav }: Props) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <Image src="/logo.svg" alt="Sohojatra Logo" width={32} height={32} className="size-8 w-auto" />
          <span className="text-xl font-bold tracking-tight text-foreground">
            Sohojatra
          </span>
        </Link>
        <div className="hidden md:flex">
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent font-medium"
                  )}
                  render={<Link href="/concerns" />}
                >
                  {nav.browseConcerns}
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent font-medium"
                  )}
                  render={<Link href="/concerns/submit" />}
                >
                  {nav.submitConcern}
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent font-medium"
                  )}
                  render={<Link href="/#how-it-works" />}
                >
                  {nav.howItWorks}
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <nav className="flex items-center gap-1 sm:gap-2">
          {/* Mobile visible basic link just in case */}
          <Link
            href="/concerns"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground transition-colors duration-200 hover:text-foreground sm:inline-flex md:hidden"
            )}
          >
            {nav.browseConcerns}
          </Link>
          <UserButton loginLabel={nav.login} />
        </nav>
      </div>
    </header>
  )
}
