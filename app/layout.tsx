import { Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"
import { getDictionary, getLocale } from "@/lib/i18n/server"
import { Megaphone } from "@phosphor-icons/react/dist/ssr"

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Sohojatra",
    template: "%s | Sohojatra",
  },
  description: "Sohojatra web application.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const t = await getDictionary(locale)

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col bg-background text-foreground">
            <div className="flex flex-1 flex-col">{children}</div>
            <Toaster closeButton position="top-right" />

            {/* Global Footer */}
            <footer className="border-t border-border/40 bg-background py-10">
              <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
                <div className="flex items-center gap-2 text-foreground/80 transition-colors duration-200 hover:text-foreground">
                  <Megaphone weight="fill" className="size-5 text-primary" />
                  <span className="text-lg font-bold tracking-tight">
                    Sohojatra
                  </span>
                </div>
                <p className="text-center text-sm text-muted-foreground sm:text-left">
                  &copy; {new Date().getFullYear()} {t.footer.tagline}
                </p>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
