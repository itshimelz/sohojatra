import { z } from "zod"

export const bdPhoneRegex = /^(?:1[3-9]\d{8}|01[3-9]\d{8})$/

export const bdPhoneSchema = z
  .string()
  .regex(
    bdPhoneRegex,
    "Please enter a valid Bangladeshi mobile number (10 digits like 17XXXXXXXX or 11 digits like 01XXXXXXXXX)."
  )

/**
 * Normalizes a Bangladeshi mobile number to +880 format body:
 * - 01XXXXXXXXX -> 1XXXXXXXXX
 * - 1XXXXXXXXX  -> 1XXXXXXXXX
 */
export function normalizeBdPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("0") ? digits.slice(1) : digits
}

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Please enter a valid 6-digit OTP code.")

export const signupNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long.")
  .max(100, "Name is too long.")
