import { z } from "zod"

export const bdPhoneSchema = z
  .string()
  .regex(
    /^1[3-9]\d{8}$/,
    "Please enter a valid 10-digit Bangladeshi mobile number (e.g., 17XXXXXXXX)."
  )

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Please enter a valid 6-digit OTP code.")

export const signupNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long.")
  .max(100, "Name is too long.")
