import type { Metadata } from "next"

/**
 * Central SEO constants for the Sohojatra platform.
 * All page-level metadata should import from here to stay consistent.
 */

export const SITE_NAME = "Sohojatra"
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://sohojatra.app"
export const SITE_DESCRIPTION =
  "Report local civic issues in Dhaka, track real-time progress, and upvote what matters most. A transparent platform for citizens to improve their city."
export const SITE_LOCALE = "en_BD"
export const SITE_LOCALE_ALT = "bn_BD"

/** Shared keywords applied site-wide */
export const SITE_KEYWORDS = [
  "Sohojatra",
  "Dhaka",
  "civic reporting",
  "civic platform",
  "urban issues",
  "community engagement",
  "public complaints",
  "city improvement",
  "pothole report",
  "streetlight",
  "waste management",
  "Bangladesh",
  "নাগরিক সেবা",
  "ঢাকা",
]

/**
 * Default metadata shared across all pages via the root layout.
 * Individual pages extend / override this through Next.js metadata merging.
 */
export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Sohojatra — Civic Reporting for Dhaka",
    template: "%s | Sohojatra",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  authors: [{ name: "Sohojatra Team" }],
  creator: "Sohojatra",
  publisher: "Sohojatra",

  // ── Open Graph ──────────────────────────────────────────────
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Sohojatra — Civic Reporting for Dhaka",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: SITE_LOCALE,
    alternateLocale: SITE_LOCALE_ALT,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sohojatra — Report, Track & Resolve Civic Issues in Dhaka",
        type: "image/png",
      },
    ],
  },

  // ── Twitter / X ─────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Sohojatra — Civic Reporting for Dhaka",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },

  // ── Robots ──────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Alternate languages ─────────────────────────────────────
  alternates: {
    canonical: SITE_URL,
    languages: {
      en: SITE_URL,
      bn: SITE_URL,
    },
  },

  // ── Icons ───────────────────────────────────────────────────
  icons: {
    icon: "/Sohojatra_logo.svg",
    shortcut: "/Sohojatra_logo.svg",
    apple: "/Sohojatra_logo.svg",
  },

  // ── Verification (add IDs when available) ───────────────────
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_ID",
  // },
}
