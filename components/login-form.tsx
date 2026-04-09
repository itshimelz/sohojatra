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
import { Megaphone } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border/40 p-0 shadow-lg">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="flex flex-col justify-center p-6 md:p-10">
            <FieldGroup className="gap-5">
              <div className="mb-2 flex flex-col items-center gap-2 text-center">
                <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <Megaphone weight="fill" className="size-6" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back
                </h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Sign in to Sohojatra with your mobile number
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor="phone">Phone Number</FieldLabel>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="017XXXXXXXX"
                  required
                  className="h-11"
                />
              </Field>
              <Field className="mt-2">
                <Button
                  type="button"
                  className="h-11 w-full rounded-full shadow-sm transition-all duration-200 hover:shadow-sm"
                >
                  Send OTP Code
                </Button>
              </Field>

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
