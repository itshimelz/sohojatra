"use client"

import Link from "next/link"
import Image from "next/image"
import { List } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { UserButton } from "@/components/user-button"

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
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-4 hover:opacity-90 transition-opacity">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image src="/logo.svg" alt="Sohojatra Logo" width={32} height={32} className="size-8 w-auto" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              Sohojatra
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
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
                  render={<Link href="/chatbot" />}
                >
                  Chatbot
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent font-medium"
                  )}
                  render={<Link href="/research" />}
                >
                  Research Lab
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <nav className="flex items-center gap-2">
          {/* Mobile Navigation Dropdown */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="shrink-0">
                  <List className="size-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem render={<Link href="/concerns" />}>
                  {nav.browseConcerns}
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/chatbot" />}>
                  Chatbot
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/research" />}>
                  Research Lab
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <UserButton loginLabel={nav.login} />
        </nav>
      </div>
    </header>
  )
}
