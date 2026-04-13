import { Geist_Mono } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { BackToTopButton } from "@/components/back-to-top-button"
import { cn } from "@/lib/utils"
import { getLocale } from "@/lib/i18n/server"

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

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>
          <div className="flex min-h-svh flex-col bg-background text-foreground">
            {children}
            <BackToTopButton />
            <Toaster closeButton position="top-right" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
