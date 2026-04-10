"use server"

import { cookies } from "next/headers"
import { type Locale } from "./config"

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies()
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}
