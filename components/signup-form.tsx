"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { WarningCircle } from "@phosphor-icons/react"
import Link from "next/link"
import Image from "next/image"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { mapAuthError } from "@/lib/auth-feedback"
import {
  bdPhoneRegex,
  bdPhoneSchema,
  otpCodeSchema,
  signupNameSchema,
} from "@/lib/validation/auth"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const nameResult = signupNameSchema.safeParse(name)
    if (!nameResult.success) {
      setInlineError(nameResult.error.issues[0]?.message ?? "Name is required.")
      return
    }

    const phoneResult = bdPhoneSchema.safeParse(phoneNumber)
    if (!phoneResult.success) {
      setInlineError(
        phoneResult.error.issues[0]?.message ?? "Invalid phone number."
      )
      return
    }

    setIsLoading(true)
    setInlineError(null)
    try {
      const { error } = await authClient.phoneNumber.sendOtp({
        phoneNumber: `+880${phoneNumber}`,
      })

      if (error) {
        const errorText =
          ((error as { message?: string; code?: string }).message ||
            (error as { code?: string }).code ||
            "Failed to send OTP")

        const feedback = mapAuthError(
          errorText,
          "Failed to send OTP. Please try again.",
          "send"
        )

        if (feedback.channel === "alert") {
          setInlineError(feedback.message)
        } else {
          toast.error(feedback.message)
        }
        return
      }

      setIsOtpSent(true)
      toast.success("OTP sent to your phone number.")
    } catch {
      toast.error("Unable to send OTP right now. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const otpResult = otpCodeSchema.safeParse(otp)
    if (!otpResult.success) {
      setInlineError(otpResult.error.issues[0]?.message ?? "Invalid OTP code.")
      return
    }

    setIsLoading(true)
    setInlineError(null)
    try {
      type PhoneVerifyPayload = Parameters<typeof authClient.phoneNumber.verify>[0]
      const payload = {
        phoneNumber: `+880${phoneNumber}`,
        code: otpResult.data,
        name: signupNameSchema.parse(name),
      } as unknown as PhoneVerifyPayload

      const { error } = await authClient.phoneNumber.verify(payload)

      if (error) {
        const errorText =
          ((error as { message?: string; code?: string }).message ||
            (error as { code?: string }).code ||
            "Invalid OTP")

        const feedback = mapAuthError(
          errorText,
          "Unable to verify OTP. Please try again.",
          "verify"
        )

        if (feedback.channel === "alert") {
          setInlineError(feedback.message)
        } else {
          toast.error(feedback.message)
        }
        return
      }

      toast.success(`Welcome to Sohojatra, ${name}! Your account is ready.`)
      void router.push("/concerns")
    } catch {
      toast.error("Unable to verify OTP right now. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/40 p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            className="flex flex-col justify-center p-6 md:p-10"
            onSubmit={handleVerifyOtp}
          >
            <FieldGroup className="gap-5">
              <div className="mb-2 flex flex-col items-center gap-2 text-center">
                <div className="mb-2 flex size-12 items-center justify-center">
                  <Image src="/logo.svg" alt="Sohojatra Logo" width={48} height={48} className="size-12 w-auto" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isOtpSent ? "Verify Phone" : "Create your account"}
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  {isOtpSent ? (
                    <>
                      Enter the 6-digit code sent to{" "}
                      <span className="font-bold text-foreground">
                        +880 {phoneNumber.slice(0, 3)}****{phoneNumber.slice(-3)}
                      </span>
                    </>
                  ) : (
                    "Enter your details to get started with Sohojatra"
                  )}
                </p>
              </div>

              {!isOtpSent ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="name">Full Name</FieldLabel>
                    <Input
                      id="name"
                      type="text"
                      placeholder="e.g. Rahim Uddin"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                    <div className="flex">
                      <div className="flex h-11 items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                        <span className="mr-2">🇧🇩</span>
                        <span>+880</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1712345678"
                        pattern={bdPhoneRegex.source}
                        required
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "")
                          if (val.length <= 10) setPhoneNumber(val)
                        }}
                        className="h-11 rounded-l-none focus-visible:z-10"
                        disabled={isLoading}
                      />
                    </div>
                    <FieldDescription>
                      We&apos;ll send an OTP to verify this number.
                    </FieldDescription>
                  </Field>
                  <Field className="mt-2">
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || !phoneNumber || !name}
                      className="h-11 w-full rounded-full transition-all duration-200"
                    >
                      {isLoading ? "Sending..." : "Send OTP Code"}
                    </Button>
                  </Field>
                </>
              ) : (
                <>
                  <Field>
                    <FieldLabel htmlFor="otp">OTP Code</FieldLabel>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="123456"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="h-12 text-center text-lg tracking-[0.35em]"
                      disabled={isLoading}
                    />
                  </Field>
                  <Field className="mt-2">
                    <Button
                      type="submit"
                      disabled={isLoading || !otp}
                      className="h-11 w-full rounded-full transition-all duration-200"
                    >
                      {isLoading ? "Verifying..." : "Verify & Sign Up"}
                    </Button>
                  </Field>
                </>
              )}

              {inlineError && (
                <Alert variant="destructive">
                  <WarningCircle className="size-4" weight="fill" />
                  <AlertTitle>Something needs attention</AlertTitle>
                  <AlertDescription>{inlineError}</AlertDescription>
                </Alert>
              )}

              <FieldDescription className="mt-2 text-center">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Log in
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden flex-col items-center justify-center overflow-hidden border-l border-border/40 bg-muted/30 p-10 text-center md:flex">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]"></div>
            <div className="z-10 flex flex-col items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground">
                Together,
                <br />
                <span className="text-primary">We Decide.</span>
              </h2>
              <p className="max-w-xs text-balance text-muted-foreground">
                Join thousands of citizens making Dhaka a better place, one
                issue at a time.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </FieldDescription>
    </div>
  )
}
