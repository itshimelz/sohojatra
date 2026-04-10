import { cookies } from "next/headers"
import { type Locale, defaultLocale, locales } from "./config"
import { en } from "./dictionaries/en"
import { bn } from "./dictionaries/bn"

const dictionaries = {
  en,
  bn,
}

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get("NEXT_LOCALE")

  if (localeCookie?.value && locales.includes(localeCookie.value as Locale)) {
    return localeCookie.value as Locale
  }

  return defaultLocale
}

export async function getDictionary(locale?: Locale) {
  const currentLocale = locale ?? (await getLocale())
  return dictionaries[currentLocale] ?? dictionaries[defaultLocale]
}
