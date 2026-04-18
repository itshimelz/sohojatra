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
import {
  Warning,
  IdentificationCard,
  Certificate,
  Eye,
  EyeSlash,
  CheckCircle,
} from "@phosphor-icons/react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { bdPhoneRegex, citizenSignupSchema } from "@/lib/validation/auth"

type IdType = "nid" | "birth_certificate"

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ["Weak", "Fair", "Good", "Strong"]
  const colors = [
    "bg-destructive",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ]
  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              i < score ? colors[score - 1] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Strength:{" "}
        <span
          className={cn(
            "font-medium",
            score <= 1 && "text-destructive",
            score === 2 && "text-orange-400",
            score === 3 && "text-yellow-600",
            score === 4 && "text-green-600"
          )}
        >
          {labels[score - 1] ?? "Too short"}
        </span>
      </p>
    </div>
  )
}

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()

  const [idType, setIdType] = useState<IdType>("nid")
  const [idNumber, setIdNumber] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [globalError, setGlobalError] = useState<string | null>(null)

  const clearError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleIdTypeChange = (type: IdType) => {
    setIdType(type)
    setIdNumber("")
    clearError("idNumber")
  }

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})
    setGlobalError(null)

    const result = citizenSignupSchema.safeParse({
      idType,
      idNumber,
      name,
      phoneNumber,
      email,
      address,
      password,
      confirmPassword,
    })

    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = String(issue.path[0] ?? "global")
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      // Scroll to first error
      const firstErrorEl = document.querySelector("[data-field-error]")
      firstErrorEl?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/citizen-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      })

      if (!res.ok) {
        const err = (await res.json()) as {
          error?: string
          field?: string
        }
        if (err.field) {
          setFieldErrors({ [err.field]: err.error ?? "Invalid value." })
        } else {
          setGlobalError(err.error ?? "Signup failed. Please try again.")
        }
        return
      }

      toast.success(`Welcome to Sohojatra, ${name}! Your account is ready.`)
      void router.push("/concerns")
    } catch {
      setGlobalError(
        "Unable to connect. Please check your internet connection and try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/40 p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          {/* ── Form ── */}
          <form
            className="flex flex-col justify-center p-6 md:p-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <FieldGroup className="gap-4">
              {/* Header */}
              <div className="mb-2 flex flex-col items-center gap-2 text-center">
                <div className="flex size-12 items-center justify-center">
                  <Image
                    src="/logo.svg"
                    alt="Sohojatra"
                    width={48}
                    height={48}
                    className="size-12 w-auto"
                  />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Create your account
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Join thousands of citizens building a better Bangladesh
                </p>
              </div>

              {/* ── Identity Type Toggle ── */}
              <Field>
                <FieldLabel>Identity Document</FieldLabel>
                <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-input bg-muted/40 p-1">
                  <button
                    type="button"
                    onClick={() => handleIdTypeChange("nid")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      idType === "nid"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <IdentificationCard
                      className="size-4 shrink-0"
                      weight={idType === "nid" ? "fill" : "regular"}
                    />
                    NID Card
                  </button>
                  <button
                    type="button"
                    onClick={() => handleIdTypeChange("birth_certificate")}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      idType === "birth_certificate"
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Certificate
                      className="size-4 shrink-0"
                      weight={
                        idType === "birth_certificate" ? "fill" : "regular"
                      }
                    />
                    Birth Certificate
                  </button>
                </div>
              </Field>

              {/* ── ID Number ── */}
              <Field>
                <FieldLabel htmlFor="idNumber">
                  {idType === "nid"
                    ? "National ID (NID) Number"
                    : "Birth Certificate Number"}
                </FieldLabel>
                <Input
                  id="idNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    idType === "nid"
                      ? "10, 13, or 17 digit NID number"
                      : "17-digit birth certificate number"
                  }
                  value={idNumber}
                  onChange={(e) => {
                    setIdNumber(e.target.value.replace(/\D/g, ""))
                    clearError("idNumber")
                  }}
                  className={cn(
                    "h-11 font-mono tracking-wider",
                    fieldErrors.idNumber && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                  aria-describedby="idNumber-hint"
                />
                {fieldErrors.idNumber ? (
                  <p
                    className="text-xs font-medium text-destructive"
                    data-field-error
                  >
                    {fieldErrors.idNumber}
                  </p>
                ) : (
                  <FieldDescription id="idNumber-hint">
                    {idType === "nid"
                      ? "Found on the front of your Smart NID card"
                      : "17-digit number on your birth registration certificate"}
                  </FieldDescription>
                )}
              </Field>

              {/* ── Full Name ── */}
              <Field>
                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Rahim Uddin"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    clearError("name")
                  }}
                  className={cn(
                    "h-11",
                    fieldErrors.name && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {fieldErrors.name && (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.name}
                  </p>
                )}
              </Field>

              {/* ── Phone Number ── */}
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <div className="flex">
                  <div className="flex h-11 items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground select-none">
                    <span className="mr-1.5">🇧🇩</span>
                    <span>+880</span>
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="1712345678"
                    pattern={bdPhoneRegex.source}
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      if (val.length <= 10) setPhoneNumber(val)
                      clearError("phoneNumber")
                    }}
                    className={cn(
                      "h-11 rounded-l-none focus-visible:z-10",
                      fieldErrors.phoneNumber && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isLoading}
                  />
                </div>
                {fieldErrors.phoneNumber ? (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.phoneNumber}
                  </p>
                ) : (
                  <FieldDescription>
                    Active Bangladeshi mobile number
                  </FieldDescription>
                )}
              </Field>

              {/* ── Email ── */}
              <Field>
                <FieldLabel htmlFor="email">Email Address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    clearError("email")
                  }}
                  className={cn(
                    "h-11",
                    fieldErrors.email && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {fieldErrors.email && (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.email}
                  </p>
                )}
              </Field>

              {/* ── Address ── */}
              <Field>
                <FieldLabel htmlFor="address">Address</FieldLabel>
                <textarea
                  id="address"
                  placeholder="House/Road, Area, Upazila, District"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value)
                    clearError("address")
                  }}
                  rows={2}
                  className={cn(
                    "w-full resize-none rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
                    fieldErrors.address && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={isLoading}
                />
                {fieldErrors.address && (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.address}
                  </p>
                )}
              </Field>

              {/* ── Password ── */}
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      clearError("password")
                    }}
                    className={cn(
                      "h-11 pr-10",
                      fieldErrors.password && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
                <PasswordStrength password={password} />
                {fieldErrors.password && (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.password}
                  </p>
                )}
              </Field>

              {/* ── Confirm Password ── */}
              <Field>
                <FieldLabel htmlFor="confirmPassword">
                  Confirm Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      clearError("confirmPassword")
                    }}
                    className={cn(
                      "h-11 pr-10",
                      fieldErrors.confirmPassword &&
                        "border-destructive focus-visible:ring-destructive",
                      !fieldErrors.confirmPassword &&
                        confirmPassword &&
                        confirmPassword === password &&
                        "border-green-500 focus-visible:ring-green-500"
                    )}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeSlash className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                  {!fieldErrors.confirmPassword &&
                    confirmPassword &&
                    confirmPassword === password && (
                      <CheckCircle
                        className="absolute right-9 top-1/2 -translate-y-1/2 size-4 text-green-500"
                        weight="fill"
                      />
                    )}
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs font-medium text-destructive" data-field-error>
                    {fieldErrors.confirmPassword}
                  </p>
                )}
              </Field>

              {/* ── Submit ── */}
              <Button
                type="submit"
                disabled={isLoading}
                className="mt-1 h-11 w-full rounded-full transition-all duration-200"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating account…
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* ── Global error ── */}
              {globalError && (
                <Alert variant="destructive">
                  <Warning className="size-4" weight="fill" />
                  <AlertTitle>Something went wrong</AlertTitle>
                  <AlertDescription>{globalError}</AlertDescription>
                </Alert>
              )}

              <FieldDescription className="text-center">
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

          {/* ── Side Panel ── */}
          <div className="relative hidden flex-col items-center justify-center gap-8 overflow-hidden border-l border-border/40 bg-muted/30 p-10 text-center md:flex">
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

            <div className="z-10 flex flex-col items-center gap-5">
              <h2 className="text-3xl font-bold tracking-tight text-balance text-foreground">
                Together,
                <br />
                <span className="text-primary">We Decide.</span>
              </h2>
              <p className="max-w-xs text-balance text-sm text-muted-foreground">
                Join thousands of citizens making Bangladesh a better place,
                one issue at a time.
              </p>
            </div>

            {/* Feature list */}
            <ul className="z-10 flex flex-col gap-3 text-left text-sm">
              {[
                "Submit civic concerns directly to authorities",
                "Vote on community proposals",
                "Track government project progress",
                "Earn reputation through civic action",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    weight="fill"
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            {/* NID note */}
            <p className="z-10 max-w-xs rounded-lg border border-border/50 bg-background/60 px-4 py-3 text-xs text-muted-foreground backdrop-blur-sm">
              🔒 Your NID / Birth Certificate number is encrypted and stored
              securely. Full government verification coming soon.
            </p>
          </div>
        </CardContent>
      </Card>

      <FieldDescription className="px-6 text-center text-xs">
        By creating an account, you agree to our{" "}
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
