import { Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { BackToTopButton } from "@/components/back-to-top-button"
import { cn } from "@/lib/utils"
import { getLocale } from "@/lib/i18n/server"
import { defaultMetadata } from "@/lib/seo"

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = defaultMetadata

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
