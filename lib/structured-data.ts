import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS } from "./seo"

/**
 * JSON-LD structured data generators for rich search results.
 * @see https://developers.google.com/search/docs/advanced/structured-data
 */

/** Organization schema — shown in Knowledge Panel */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/Sohojatra_logo.svg`,
    description: SITE_DESCRIPTION,
    areaServed: {
      "@type": "City",
      name: "Dhaka",
      address: {
        "@type": "PostalAddress",
        addressCountry: "BD",
      },
    },
    sameAs: [],
  }
}

/** WebSite schema — enables sitelinks search box in Google */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS.join(", "),
    inLanguage: ["en", "bn"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/concerns?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

/** WebPage schema for individual pages */
export function webPageJsonLd(opts: {
  title: string
  description: string
  url: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.title,
    description: opts.description,
    url: opts.url,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

/** FAQ page schema — enables rich FAQ results in Google */
export function faqJsonLd(items: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
