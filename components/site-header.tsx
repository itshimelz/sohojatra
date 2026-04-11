import Link from "next/link"
import { Megaphone } from "@phosphor-icons/react/dist/ssr"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

type Props = {
  nav: {
    browseConcerns: string
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
          <div className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Megaphone weight="fill" className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Sohojatra
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/concerns"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden text-muted-foreground transition-colors duration-200 hover:text-foreground sm:inline-flex"
            )}
          >
            {nav.browseConcerns}
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants(),
              "rounded-full transition-all duration-200"
            )}
          >
            {nav.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
