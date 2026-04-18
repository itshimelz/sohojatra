import { z } from "zod"

export const bdPhoneRegex = /^1[3-9]\d{8}$/

export const bdPhoneSchema = z
  .string()
  .regex(
    bdPhoneRegex,
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

// NID: 10-digit (smart card), 13-digit (old), or 17-digit (voter list)
const nidRegex = /^\d{10}$|^\d{13}$|^\d{17}$/
// Birth Certificate: exactly 17 digits (Bangladesh birth registration)
const birthCertRegex = /^\d{17}$/

export const citizenSignupSchema = z
  .object({
    idType: z.enum(["nid", "birth_certificate"]),
    idNumber: z.string().min(1, "ID number is required."),
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(100, "Name is too long."),
    phoneNumber: bdPhoneSchema,
    email: z.string().email("Please enter a valid email address."),
    address: z
      .string()
      .trim()
      .min(5, "Please enter your full address.")
      .max(500, "Address is too long."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .superRefine((d, ctx) => {
    const valid =
      d.idType === "nid"
        ? nidRegex.test(d.idNumber)
        : birthCertRegex.test(d.idNumber)
    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          d.idType === "nid"
            ? "NID must be 10, 13, or 17 digits."
            : "Birth Certificate Number must be exactly 17 digits.",
        path: ["idNumber"],
      })
    }
  })
