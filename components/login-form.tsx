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
import { Megaphone, WarningCircle } from "@phosphor-icons/react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type FeedbackChannel = "alert" | "toast"
type AuthPhase = "send" | "verify"

function mapAuthError(
  message: string,
  fallback: string,
  phase: AuthPhase = "verify"
): {
  channel: FeedbackChannel
  message: string
} {
  const normalized = message.toLowerCase()

  if (
    normalized.includes("rate") ||
    normalized.includes("too many") ||
    normalized.includes("limit")
  ) {
    return {
      channel: "toast",
      message: "Too many attempts. Please wait a few minutes and try again.",
    }
  }

  if (normalized.includes("network") || normalized.includes("fetch")) {
    return {
      channel: "toast",
      message:
        "Network issue detected. Please check your connection and retry.",
    }
  }

  if (phase === "verify" && (normalized.includes("invalid") || normalized.includes("otp"))) {
    return { channel: "alert", message: "Invalid OTP. Please check the code and try again." }
  }

  if (phase === "send" && normalized.includes("invalid")) {
    return {
      channel: "alert",
      message: "Could not send OTP. Please check your phone number.",
    }
  }

  return { channel: "toast", message: fallback }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [isOtpSent, setIsOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!phoneNumber) return

    const bdPhoneRegex = /^1[3-9]\d{8}$/
    if (!bdPhoneRegex.test(phoneNumber)) {
      setInlineError(
        "Please enter a valid 10-digit Bangladeshi mobile number (e.g., 17XXXXXXXX)."
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
        const feedback = mapAuthError(
          error.message || "Failed to send OTP",
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
    if (!otp) return
    setIsLoading(true)
    setInlineError(null)
    try {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: `+880${phoneNumber}`,
        code: otp,
      })

      if (error) {
        const feedback = mapAuthError(
          error.message || "Invalid OTP",
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

      toast.success("Welcome back! You're now signed in.")
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
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Megaphone weight="fill" className="size-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {isOtpSent ? "Verify Phone" : "Welcome back"}
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  {isOtpSent
                    ? "Enter the OTP sent to your phone"
                    : "Sign in to Sohojatra with your mobile number"}
                </p>
              </div>

              {!isOtpSent ? (
                <>
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
                        placeholder="17XXXXXXXX"
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
                  </Field>
                  <Field className="mt-2">
                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading || !phoneNumber}
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
                      placeholder="123456"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="h-11"
                      disabled={isLoading}
                    />
                  </Field>
                  <Field className="mt-2">
                    <Button
                      type="submit"
                      disabled={isLoading || !otp}
                      className="h-11 w-full rounded-full transition-all duration-200"
                    >
                      {isLoading ? "Verifying..." : "Verify & Sign In"}
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
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Sign up
                </Link>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="relative hidden flex-col items-center justify-center overflow-hidden border-l border-border/40 bg-muted/30 p-10 text-center md:flex">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="z-10 flex flex-col items-center gap-4">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground">
                Together,
                <br />
                <span className="text-primary">We Decide.</span>
              </h2>
              <p className="max-w-xs text-balance text-muted-foreground">
                Log in to track your reported concerns and upvote issues in your
                community.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-xs">
        By clicking continue, you agree to our{" "}
        <a href="#" className="underline hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline hover:text-foreground">
          Privacy Policy
        </a>
        .
      </FieldDescription>
    </div>
  )
}
