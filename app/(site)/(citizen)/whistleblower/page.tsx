"use client"

import { useState } from "react"
import {
  ShieldCheck,
  Warning,
  Eye,
  EyeSlash,
  Copy,
  CheckCircle,
  ArrowRight,
  LockSimple,
  Scales,
  MagnifyingGlass,
  ArrowUp,
} from "@phosphor-icons/react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { buttonVariants } from "@/components/ui/button-variants"

const CATEGORIES = [
  { value: "Corruption", label: "Corruption", desc: "Abuse of power for personal gain" },
  { value: "Bribery", label: "Bribery", desc: "Offering or accepting bribes" },
  { value: "Misconduct", label: "Official Misconduct", desc: "Abuse of authority, negligence" },
  { value: "RightsViolation", label: "Rights Violation", desc: "Violation of fundamental rights" },
  { value: "FraudAndEmbezzlement", label: "Fraud & Embezzlement", desc: "Misuse of public funds" },
  { value: "Other", label: "Other", desc: "Other governance violations" },
]

const AGENCIES = [
  "Anti-Corruption Commission (ACC)",
  "Dhaka City Corporation (DNCC/DSCC)",
  "Bangladesh Police",
  "Ministry of Finance",
  "Ministry of Health and Family Welfare",
  "Ministry of Education",
  "Ministry of Local Government",
  "Customs and Revenue Authority",
  "Bangladesh Road Transport Authority (BRTA)",
  "Bangladesh Power Development Board (BPDB)",
  "Other Government Agency",
]

const TIER_INFO = [
  { tier: 0, label: "Platform Review", desc: "Internal review by Sohojatra moderators", color: "text-blue-500" },
  { tier: 1, label: "ACC", desc: "Anti-Corruption Commission", color: "text-amber-500" },
  { tier: 2, label: "Media Partners", desc: "Trusted investigative journalists", color: "text-orange-500" },
  { tier: 3, label: "Public Record", desc: "Full public disclosure", color: "text-red-500" },
]

type ReportResult = {
  caseToken: string
  status: string
  createdAt: string
  message: string
}

type CaseStatus = {
  caseToken: string
  category: string
  severity: string
  status: string
  escalationTier: number
  currentTier: string
  nextTier: string | null
  reviewNote: string | null
  updatedAt: string
}

export default function WhistleblowerPage() {
  const [step, setStep] = useState<"landing" | "form" | "submitted" | "check">("landing")
  const [category, setCategory] = useState("Corruption")
  const [severity, setSeverity] = useState("Medium")
  const [description, setDescription] = useState("")
  const [targetAgency, setTargetAgency] = useState(AGENCIES[0])
  const [targetDivision, setTargetDivision] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<ReportResult | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)

  // Status check
  const [checkToken, setCheckToken] = useState("")
  const [caseStatus, setCaseStatus] = useState<CaseStatus | null>(null)
  const [checking, setChecking] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Privacy toggles
  const [showDescription, setShowDescription] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch("/api/whistleblower/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, severity, description, targetAgency, targetDivision: targetDivision || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setResult(data)
      setStep("submitted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit report")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    setNotFound(false)
    setCaseStatus(null)
    try {
      const res = await fetch(`/api/whistleblower/status/${checkToken.trim().toUpperCase()}`)
      if (res.status === 404) { setNotFound(true); return }
      const data = await res.json()
      setCaseStatus(data)
    } catch {
      toast.error("Failed to check case status")
    } finally {
      setChecking(false)
    }
  }

  function copyToken() {
    if (result?.caseToken) {
      navigator.clipboard.writeText(result.caseToken)
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-3 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm font-medium">
            <ShieldCheck className="size-4 text-green-500" weight="fill" />
            Anonymous · Confidential · Protected
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Whistleblower Protection Portal</h1>
        <p className="mt-3 max-w-xl mx-auto text-muted-foreground">
          Report corruption, bribery, or misconduct safely. No login required. No IP stored. Your
          case token is the only link to your report.
        </p>
      </div>

      {/* Nav tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-1">
        {[
          { key: "landing" as const, label: "Overview" },
          { key: "form" as const, label: "File a Report" },
          { key: "check" as const, label: "Check Status" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setStep(t.key)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              step === t.key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* LANDING */}
      {step === "landing" && (
        <div className="space-y-6">
          {/* Safety banner */}
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20 p-5">
            <div className="flex gap-3">
              <Warning className="mt-0.5 size-5 shrink-0 text-amber-500" weight="fill" />
              <div>
                <p className="font-semibold text-amber-800 dark:text-amber-300">Read before reporting</p>
                <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-400/80">
                  While this platform provides anonymity, no digital system is 100% safe. If you
                  fear for your physical safety, consult a lawyer first. Consider using Tor Browser
                  for maximum anonymity.
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">How it works</h2>
            <div className="space-y-4">
              {[
                { n: "1", t: "File anonymously", d: "No account required. No IP address stored. Describe what you witnessed." },
                { n: "2", t: "Receive a case token", d: "A random 32-character token is generated. This is your only link to your report — save it safely." },
                { n: "3", t: "Review & escalation", d: "Platform moderators review within 48h. You can escalate to ACC, media partners, or public record." },
                { n: "4", t: "Legal protection", d: "The Whistleblower Protection Act 2011 provides legal safeguards against retaliation." },
              ].map((step) => (
                <div key={step.n} className="flex gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {step.n}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{step.t}</p>
                    <p className="text-sm text-muted-foreground">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escalation tiers */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-semibold">Escalation Tiers</h2>
            <div className="space-y-3">
              {TIER_INFO.map((t) => (
                <div key={t.tier} className="flex items-start gap-3">
                  <span className={`text-lg font-bold ${t.color}`}>L{t.tier}</span>
                  <div>
                    <p className="font-medium text-sm">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legal guide summary */}
          <div className="rounded-xl border border-border bg-muted/20 p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Scales className="size-4 text-primary" />
              Legal Protections (Whistleblower Act 2011)
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                "Your identity must be kept confidential by receiving authorities",
                "Protected against dismissal, demotion, or harassment",
                "Free legal aid: BLAST (blast.org.bd) and ASK (askbd.org)",
                "You can withdraw your report within 7 days if submitted in error",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <CheckCircle className="mt-0.5 size-4 shrink-0 text-green-500" weight="fill" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="text-center">
            <button onClick={() => setStep("form")} className={buttonVariants({ variant: "default", size: "lg" })}>
              File an Anonymous Report
              <ArrowRight className="ml-2 size-4" />
            </button>
          </div>
        </div>
      )}

      {/* FORM */}
      {step === "form" && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-green-200/60 bg-green-50/50 dark:border-green-900/40 dark:bg-green-950/20 p-4">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <LockSimple className="size-4 shrink-0" weight="fill" />
              No login required · No IP address stored · Anonymous submission
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium">Category of Misconduct</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    category === cat.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="mb-2 block text-sm font-medium">Severity</label>
            <div className="flex gap-2">
              {["Low", "Medium", "High", "Critical"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    severity === s
                      ? s === "Critical" ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                        : s === "High" ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : s === "Medium" ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                      : "border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Target Agency */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">Agency / Department Involved</label>
            <select
              value={targetAgency}
              onChange={(e) => setTargetAgency(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {AGENCIES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">Specific Division / Office <span className="text-muted-foreground">(optional)</span></label>
            <input
              type="text"
              value={targetDivision}
              onChange={(e) => setTargetDivision(e.target.value)}
              placeholder="e.g., Procurement Department, Ward 15 Office…"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Description */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Description</label>
              <button
                type="button"
                onClick={() => setShowDescription((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {showDescription ? <EyeSlash className="size-3.5" /> : <Eye className="size-3.5" />}
                {showDescription ? "Hide" : "Preview"}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              required
              minLength={50}
              placeholder="Describe the incident in detail. Include: what happened, when, who was involved (roles/positions, not necessarily names), and any evidence you have…"
              className={`w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${!showDescription ? "" : "blur-sm select-none"}`}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Minimum 50 characters. Do not include your own name, phone, or identifying details.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={buttonVariants({ variant: "default", size: "lg" })}
          >
            {submitting ? "Submitting securely…" : "Submit Anonymous Report"}
          </button>
        </form>
      )}

      {/* SUBMITTED */}
      {step === "submitted" && result && (
        <div className="space-y-5">
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30 p-6 text-center">
            <CheckCircle className="mx-auto mb-3 size-12 text-green-500" weight="fill" />
            <h2 className="text-xl font-bold">Report Submitted</h2>
            <p className="mt-1 text-sm text-muted-foreground">{result.message}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <p className="mb-2 text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Warning className="size-4" weight="fill" />
              Save your case token — this is the ONLY way to track your report
            </p>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 font-mono text-sm tracking-widest">
              <span className="flex-1 break-all">{result.caseToken}</span>
              <button
                onClick={copyToken}
                className="shrink-0 rounded-md p-1.5 hover:bg-muted transition-colors"
                title="Copy token"
              >
                {tokenCopied ? (
                  <CheckCircle className="size-4 text-green-500" weight="fill" />
                ) : (
                  <Copy className="size-4" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Write it down. Screenshot it. Store it safely. Do not share it with others.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground space-y-1">
            <p>• Your report will be reviewed by moderators within 48 hours.</p>
            <p>• You can check status or escalate using your case token.</p>
            <p>• If you face retaliation, contact BLAST (blast.org.bd) for free legal aid.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCheckToken(result.caseToken); setStep("check") }}
              className={buttonVariants({ variant: "default" })}
            >
              Check Status Now
            </button>
            <button onClick={() => setStep("landing")} className={buttonVariants({ variant: "outline" })}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* CHECK STATUS */}
      {step === "check" && (
        <div className="space-y-5">
          <form onSubmit={handleCheck} className="flex gap-2">
            <input
              type="text"
              value={checkToken}
              onChange={(e) => setCheckToken(e.target.value)}
              placeholder="Enter your 32-character case token…"
              maxLength={32}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="submit"
              disabled={checking || checkToken.length < 10}
              className={buttonVariants({ variant: "default" })}
            >
              {checking ? "Checking…" : <MagnifyingGlass className="size-4" />}
            </button>
          </form>

          {notFound && (
            <div className="rounded-xl border border-red-200/60 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20 p-4 text-sm text-red-700 dark:text-red-400">
              Case not found. Check your token and try again.
            </div>
          )}

          {caseStatus && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold">Case Status</h3>
                <Badge
                  variant={
                    caseStatus.status === "Resolved" ? "default"
                      : caseStatus.status === "Escalated" ? "destructive"
                      : "secondary"
                  }
                >
                  {caseStatus.status}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-medium">{caseStatus.category}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Severity</p>
                  <p className="font-medium">{caseStatus.severity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Tier</p>
                  <p className="font-medium">{caseStatus.currentTier}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{new Date(caseStatus.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {caseStatus.reviewNote && (
                <div className="rounded-lg bg-muted/40 p-3 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Review Note</p>
                  <p>{caseStatus.reviewNote}</p>
                </div>
              )}

              {caseStatus.nextTier && caseStatus.escalationTier < 3 && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/whistleblower/escalate/${caseStatus.caseToken}`, { method: "POST" })
                    const data = await res.json()
                    if (res.ok) {
                      toast.success(data.message)
                      setCaseStatus((s) => s ? { ...s, escalationTier: s.escalationTier + 1, currentTier: data.escalatedTo, status: "Escalated" } : s)
                    }
                  }}
                  className={`${buttonVariants({ variant: "outline", size: "sm" })} gap-1.5`}
                >
                  <ArrowUp className="size-3.5" />
                  Escalate to {caseStatus.nextTier}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
