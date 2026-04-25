"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button, buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CheckCircle, CaretRight, CaretLeft, CalendarBlank } from "@phosphor-icons/react/dist/ssr"
import { completeOnboarding } from "@/app/(site)/onboard/actions"
import { toast } from "sonner"

import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface OnboardWizardProps {
  user: { name?: string | null; email?: string | null }
}

export function OnboardWizard({ user }: OnboardWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: user.name || "",
    email: user.email || "",
    dob: "",
    education: "",
  })

  const handleNext = () => setStep((s) => Math.min(s + 1, 3))
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEducationChange = (value: string | null) => {
    setFormData((prev) => ({ ...prev, education: value || "" }))
  }

  const calculateAge = (dobString: string) => {
    if (!dobString) return null
    const birthDate = new Date(dobString)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      await completeOnboarding({
        name: formData.name,
        email: formData.email !== user.email ? formData.email : undefined,
        dob: formData.dob || undefined,
        education: formData.education || undefined,
      })
      toast.success("Welcome to Sohojatra!", {
        description: "Your profile has been successfully setup.",
      })
      router.refresh() // Crucial to update the layout state
      router.push("/")
    } catch {
      toast.error("Something went wrong", {
        description: "Please try submitting again.",
      })
    } finally {
      setLoading(false)
    }
  }

  const isStep1Valid = formData.name.trim().length > 0 && formData.email.trim().length > 0 && formData.email.includes("@")

  return (
    <div className="w-full max-w-xl mx-auto mt-12 mb-24 px-4">
      <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      </div>
      <Card className="border-border/50 shadow-none bg-background/60 backdrop-blur-md">
        {step === 1 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Basic Information</CardTitle>
              <CardDescription>Tell us a bit about yourself. Your email is secured with us.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  required
                />
                {(!user.email || formData.email !== user.email) && formData.email.trim().length > 0 && (
                  <p className="text-[0.8rem] text-muted-foreground mt-1">
                    Note: You will need to verify this email address later.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dob">Date of Birth</Label>
                  {formData.dob && (
                    <span className="text-xs text-muted-foreground font-medium">
                      Age: {calculateAge(formData.dob)}
                    </span>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger
                    id="dob"
                    className={cn(
                      buttonVariants({ variant: "outline" }),
                      "w-full justify-start text-left font-normal border-border/50",
                      !formData.dob && "text-muted-foreground"
                    )}
                  >
                    <CalendarBlank className="mr-2 size-4" />
                    {formData.dob ? format(new Date(formData.dob), "PPP") : <span>Pick a date</span>}
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={new Date(1950, 0)}
                      endMonth={new Date()}
                      selected={formData.dob ? new Date(formData.dob) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            dob: format(date, "yyyy-MM-dd"),
                          }))
                        } else {
                          setFormData((prev) => ({ ...prev, dob: "" }))
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleNext} disabled={!isStep1Valid} className="rounded-full px-8">
                Next <CaretRight className="ml-2 size-4" weight="bold" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary">Educational Status</CardTitle>
              <CardDescription className="flex items-center gap-2">
                This helps us personalize civic materials <span className="rounded-full bg-muted px-2 py-0.5 text-xs">Optional</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="education">Highest Level of Education</Label>
                <Select value={formData.education} onValueChange={handleEducationChange}>
                  <SelectTrigger id="education" className="w-full">
                    <SelectValue placeholder="Select educational status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="SSC / O Level or Equivalent">SSC / O Level or Equivalent</SelectItem>
                    <SelectItem value="HSC / A Level or Equivalent">HSC / A Level or Equivalent</SelectItem>
                    <SelectItem value="Bachelor's Degree">Bachelor&apos;s Degree</SelectItem>
                    <SelectItem value="Master's Degree">Master&apos;s Degree</SelectItem>
                    <SelectItem value="Doctorate (PhD)">Doctorate (PhD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handlePrev} className="rounded-full">
                <CaretLeft className="mr-2 size-4" weight="bold" /> Back
              </Button>
              <Button onClick={handleNext} className="rounded-full px-8">
                Next <CaretRight className="ml-2 size-4" weight="bold" />
              </Button>
            </CardFooter>
          </>
        )}

        {step === 3 && (
          <>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-2">
                Final Review <CheckCircle className="text-green-500" weight="fill" />
              </CardTitle>
              <CardDescription>Ensure your details are correct before finishing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-4 shadow-sm">
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-muted-foreground col-span-1">Name</span>
                  <span className="text-sm font-semibold col-span-2">{formData.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-muted-foreground col-span-1">Email</span>
                  <span className="text-sm font-semibold col-span-2">{formData.email || "Not provided"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 border-b border-border/50 pb-3">
                  <span className="text-sm font-medium text-muted-foreground col-span-1">DOB / Age</span>
                  <span className="text-sm font-semibold col-span-2">
                    {formData.dob ? `${formData.dob} (${calculateAge(formData.dob)} yrs)` : "Not provided"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-sm font-medium text-muted-foreground col-span-1">Education</span>
                  <span className="text-sm font-semibold col-span-2">
                    {formData.education || "Not provided"}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={handlePrev} disabled={loading} className="rounded-full">
                <CaretLeft className="mr-2 size-4" weight="bold" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={loading} className="rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground">
                {loading ? "Saving..." : "Finish Onboarding"}
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
