"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"
import {
  UserIcon as User,
  ShieldIcon as Shield,
  StarIcon as Star,
  ClockIcon as Clock,
  GearIcon as Gear,
  CheckCircleIcon as CheckCircle,
  MapPinIcon as MapPin,
  PhoneIcon as Phone,
  EnvelopeIcon as Envelope,
  PencilSimpleIcon as PencilSimple,
  CrownIcon as Crown,
  TrophyIcon as Trophy,
  MedalIcon as Medal,
  LightningIcon as Lightning,
  TrendUpIcon as TrendUp,
  ChartBarIcon as ChartBar,
  ArrowRightIcon as ArrowRight,
} from "@phosphor-icons/react"
import Link from "next/link"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ReputationData {
  totalPoints: number
  tier: string
  weightMultiplier: number
  events: Array<{
    id: string
    delta: number
    reason: string
    createdAt: string
  }>
}

interface EarnedBadge {
  id: string
  badgeKey: string
  label: string
  description: string
  earnedAt: string
}

interface ExtendedProfile {
  address?: string | null
  createdAt?: string | null
  phoneNumber?: string | null
  nidHash?: string | null
  birthCertificateNoHash?: string | null
  trustScore?: number | null
}

interface ProfileData {
  reputation: ReputationData
  badges: EarnedBadge[]
  extended: ExtendedProfile
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TIERS = [
  {
    name: "Newcomer",
    min: 0,
    max: 100,
    color: "text-slate-500",
    bg: "bg-slate-100 dark:bg-slate-800",
    border: "border-slate-200",
    bar: "bg-slate-400",
    label: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    name: "Active",
    min: 100,
    max: 500,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
    label: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  {
    name: "Expert",
    min: 500,
    max: 2000,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200",
    bar: "bg-blue-500",
    label: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    name: "Champion",
    min: 2000,
    max: Infinity,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200",
    bar: "bg-violet-500",
    label: "bg-violet-100 text-violet-700 border-violet-200",
  },
] as const

const BADGE_EMOJI: Record<string, string> = {
  first_concern: "🗣️",
  first_vote: "🗳️",
  helpful_voter: "⭐",
  civic_champion: "🏆",
  community_builder: "🤝",
  verified_citizen: "✅",
  top_contributor: "🥇",
  problem_solver: "💡",
}

const ROLE_CONFIG: Record<
  string,
  { label: string; color: string; emoji: string; permissions: string[] }
> = {
  citizen: {
    label: "Citizen",
    emoji: "🏙️",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    permissions: [
      "Submit civic concerns",
      "Vote on proposals",
      "Comment and quote-reply",
      "Attend assembly events",
    ],
  },
  expert: {
    label: "Expert / Professor",
    emoji: "🎓",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    permissions: [
      "All citizen permissions",
      "Submit solution proposals",
      "Apply for research grants",
      "Access AI-prioritised concern list",
    ],
  },
  govt_authority: {
    label: "Government Authority",
    emoji: "🏛️",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    permissions: [
      "All citizen permissions",
      "Approve / reject solution plans",
      "Assign departments",
      "Publish assembly minutes",
      "View accountability KPIs",
    ],
  },
  ngo: {
    label: "NGO / Civil Society",
    emoji: "🤝",
    color: "bg-teal-50 text-teal-700 border-teal-200",
    permissions: [
      "All citizen permissions",
      "Co-sponsor concerns",
      "Organise events",
      "Submit proposals",
    ],
  },
  admin: {
    label: "Platform Admin",
    emoji: "⚙️",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    permissions: [
      "Full platform access",
      "User management",
      "Content moderation",
      "Crime flag review",
      "Trigger model retraining",
    ],
  },
}

const TABS = ["Overview", "Badges", "Activity", "Settings"] as const
type Tab = (typeof TABS)[number]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getTierProgress(points: number) {
  const tiers = [...TIERS]
  const currentIdx = [...tiers].reverse().findIndex((t) => points >= t.min)
  const current = tiers[tiers.length - 1 - currentIdx] ?? tiers[0]!
  const nextIdx = tiers.findIndex((t) => t.min > points)
  const next = nextIdx !== -1 ? tiers[nextIdx] : null
  if (!next) return { current, next: null, pct: 100 }
  const pct = Math.min(
    100,
    Math.round(((points - current.min) / (next.min - current.min)) * 100)
  )
  return { current, next, pct }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function fmtReason(reason: string) {
  return reason
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
  )
}

// ─── Initials Avatar ───────────────────────────────────────────────────────────

function InitialsAvatar({
  name,
  size = "lg",
}: {
  name: string
  size?: "sm" | "md" | "lg" | "xl"
}) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const cls = {
    sm: "size-9 text-sm",
    md: "size-12 text-base",
    lg: "size-20 text-2xl",
    xl: "size-24 text-3xl",
  }[size]

  return (
    <div
      className={cn(
        "flex shrink-0 select-none items-center justify-center rounded-full bg-primary font-bold text-primary-foreground ring-4 ring-background shadow-md",
        cls
      )}
    >
      {initials}
    </div>
  )
}

// ─── Tab Nav ───────────────────────────────────────────────────────────────────

function TabNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (t: Tab) => void
}) {
  const icons: Record<Tab, React.ReactNode> = {
    Overview: <ChartBar className="size-4" />,
    Badges: <Trophy className="size-4" />,
    Activity: <Clock className="size-4" />,
    Settings: <Gear className="size-4" />,
  }

  return (
    <div className="flex gap-1 rounded-xl border border-border bg-muted/40 p-1">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
            active === tab
              ? "bg-background text-foreground shadow-sm ring-1 ring-border/60"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {icons[tab]}
          <span className="hidden sm:inline">{tab}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Tier Icon ─────────────────────────────────────────────────────────────────

function TierIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  if (name === "Champion")
    return <Crown className={className} weight="fill" />
  if (name === "Expert")
    return <TrendUp className={className} weight="fill" />
  if (name === "Active")
    return <Lightning className={className} weight="fill" />
  return <Star className={className} weight="fill" />
}

// ─── Edit Profile Dialog ───────────────────────────────────────────────────────

function EditProfileDialog({
  open,
  onOpenChange,
  currentName,
  currentAddress,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentName: string
  currentAddress: string
  onSaved: (data: { name: string; address: string }) => void
}) {
  const [name, setName] = useState(currentName)
  const [address, setAddress] = useState(currentAddress)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty.")
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), address: address.trim() }),
      })
      if (!res.ok) {
        const err = (await res.json()) as { error?: string }
        toast.error(err.error ?? "Failed to save.")
        return
      }
      onSaved({ name: name.trim(), address: address.trim() })
      toast.success("Profile updated successfully.")
      onOpenChange(false)
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name and address.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House/Road, Area, Upazila, District"
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2.5 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function UserProfilePage() {
  const { session } = useAuth()
  const user = session?.user

  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("Overview")
  const [editOpen, setEditOpen] = useState(false)
  const [requestedRoles, setRequestedRoles] = useState<Set<string>>(new Set())
  const [localName, setLocalName] = useState<string | null>(null)

  const userId = user?.id ?? ""

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }
    let cancelled = false

    async function load() {
      try {
        const [repRes, badgeRes, extRes] = await Promise.all([
          fetch(`/api/reputation?userId=${encodeURIComponent(userId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/badges?userId=${encodeURIComponent(userId)}`, {
            cache: "no-store",
          }),
          fetch("/api/profile", { cache: "no-store" }),
        ])

        const repData = repRes.ok ? ((await repRes.json()) as ReputationData) : null
        const badgeData = badgeRes.ok
          ? ((await badgeRes.json()) as { badges: EarnedBadge[] })
          : null
        const extData = extRes.ok ? ((await extRes.json()) as ExtendedProfile) : null

        if (!cancelled) {
          setProfileData({
            reputation: repData ?? {
              totalPoints: 0,
              tier: "Newcomer",
              weightMultiplier: 1,
              events: [],
            },
            badges: badgeData?.badges ?? [],
            extended: extData ?? {},
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [userId])

  // ── Loading state (session not resolved yet) ──
  if (session === undefined) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8">
        <Skeleton className="h-52 w-full" />
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // ── Unauthenticated ──
  if (!user) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-5 px-4 py-20 text-center">
        <div className="flex size-24 items-center justify-center rounded-full bg-muted">
          <User className="size-12 text-muted-foreground/50" />
        </div>
        <div>
          <h2 className="text-xl font-bold">You&apos;re not signed in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to view and manage your civic profile.
          </p>
        </div>
        <Link
          href="/login"
          className={cn(buttonVariants(), "rounded-full px-8")}
        >
          Sign in to continue
        </Link>
      </div>
    )
  }

  const role = (user as { role?: string }).role ?? "citizen"
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG.citizen!
  const displayName = localName ?? user.name
  const points = profileData?.reputation.totalPoints ?? 0
  const { current: tier, next: nextTier, pct: tierPct } = getTierProgress(points)

  const stats = [
    {
      label: "Reputation",
      value: isLoading ? null : points,
      suffix: "pts",
      icon: <Star weight="fill" className="size-5" />,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
    },
    {
      label: "Badges",
      value: isLoading ? null : (profileData?.badges.length ?? 0),
      suffix: "",
      icon: <Trophy weight="fill" className="size-5" />,
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/20",
    },
    {
      label: "Vote Weight",
      value: isLoading
        ? null
        : (profileData?.reputation.weightMultiplier ?? 1),
      suffix: "x",
      float: true,
      icon: <Lightning weight="fill" className="size-5" />,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-950/20",
    },
    {
      label: "Trust Score",
      value: isLoading
        ? null
        : Math.round(profileData?.extended.trustScore ?? 100),
      suffix: "%",
      icon: <Shield weight="fill" className="size-5" />,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 pb-12">

      {/* ── Hero Card ───────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-border/50 p-0 shadow-md">
        {/* Banner */}
        <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/25 via-primary/10 to-transparent">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_60%,hsl(var(--primary)/0.2)_0%,transparent_65%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808009_1px,transparent_1px),linear-gradient(to_bottom,#80808009_1px,transparent_1px)] bg-size-[22px_22px]" />
          {/* Tier badge on banner */}
          {!isLoading && (
            <div
              className={cn(
                "absolute right-4 top-4 flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm",
                tier.label
              )}
            >
              <TierIcon name={tier.name} className="size-3.5" />
              {tier.name}
            </div>
          )}
        </div>

        <CardContent className="px-6 pb-6">
          {/* Avatar row */}
          <div className="-mt-12 mb-4 flex items-end justify-between gap-4">
            <InitialsAvatar name={displayName} size="xl" />
            <div className="flex gap-2 pb-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setEditOpen(true)}
              >
                <PencilSimple className="size-4" />
                <span className="hidden sm:inline">Edit Profile</span>
              </Button>
            </div>
          </div>

          {/* Name + verified + role */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {displayName}
              </h1>
              <Badge className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs">
                <CheckCircle className="size-3" weight="fill" />
                Verified
              </Badge>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                  roleConfig.color
                )}
              >
                <span>{roleConfig.emoji}</span>
                {roleConfig.label}
              </span>
            </div>

            {/* Contact details */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Envelope className="size-3.5 shrink-0" />
                {user.email}
              </span>
              {(user as { phoneNumber?: string }).phoneNumber && (
                <span className="flex items-center gap-1.5">
                  <Phone className="size-3.5 shrink-0" />
                  {(user as { phoneNumber?: string }).phoneNumber}
                </span>
              )}
              {profileData?.extended.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5 shrink-0" />
                  {profileData.extended.address}
                </span>
              )}
            </div>

            {/* Identity verification status */}
            <div className="flex flex-wrap gap-2 pt-1">
              {profileData?.extended.nidHash && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                  🪪 NID Registered
                </span>
              )}
              {profileData?.extended.birthCertificateNoHash && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                  📄 Birth Certificate Registered
                </span>
              )}
              {profileData?.extended.createdAt && (
                <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
                  📅 Member since {fmtDate(profileData.extended.createdAt)}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Stats Strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl",
                  s.bg
                )}
              >
                <span className={s.color}>{s.icon}</span>
              </div>
              <div className="min-w-0">
                {s.value === null ? (
                  <Skeleton className="mb-1 h-5 w-12" />
                ) : (
                  <p className="text-xl font-bold leading-none">
                    {"float" in s && s.float
                      ? (s.value as number).toFixed(1)
                      : s.value}
                    {s.suffix}
                  </p>
                )}
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Reputation Progress ──────────────────────────────────────── */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <TierIcon name={tier.name} className={cn("size-5", tier.color)} />
              <span>{tier.name} Tier</span>
            </div>
            <span className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-32" />
              ) : nextTier ? (
                <>{points} pts · {nextTier.min - points} to{" "}
                  <span className="font-medium text-foreground">
                    {nextTier.name}
                  </span>
                </>
              ) : (
                <span className="font-medium text-violet-600">
                  Max tier reached 🎉
                </span>
              )}
            </span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                tier.bar
              )}
              style={{ width: isLoading ? "0%" : `${tierPct}%` }}
            />
          </div>

          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TierIcon name={tier.name} className="size-3" />
              {tier.name}
            </span>
            {nextTier && (
              <span className="flex items-center gap-1">
                <TierIcon name={nextTier.name} className="size-3" />
                {nextTier.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tab Nav ─────────────────────────────────────────────────── */}
      <TabNav active={activeTab} onChange={setActiveTab} />

      {/* ════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "Overview" && (
        <div className="grid gap-5 md:grid-cols-2">

          {/* Role & Permissions */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4 text-primary" weight="fill" />
                Role & Permissions
              </CardTitle>
              <CardDescription>What you can do on the platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
                  roleConfig.color
                )}
              >
                <span>{roleConfig.emoji}</span>
                {roleConfig.label}
              </div>
              <div className="space-y-2">
                {roleConfig.permissions.map((p) => (
                  <div key={p} className="flex items-start gap-2.5">
                    <CheckCircle
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      weight="fill"
                    />
                    <span className="text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Badges preview */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-primary" weight="fill" />
                Recent Badges
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? "Loading…"
                  : `${profileData?.badges.length ?? 0} total badges earned`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : profileData?.badges.length ? (
                <div className="space-y-2">
                  {profileData.badges.slice(0, 3).map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                      <span className="text-2xl">
                        {BADGE_EMOJI[b.badgeKey] ?? "🎖️"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {b.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(b.earnedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {profileData.badges.length > 3 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("Badges")}
                      className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      View all {profileData.badges.length} badges
                      <ArrowRight className="size-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Medal className="size-10 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No badges yet — keep contributing!
                  </p>
                  <Link
                    href="/concerns"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Browse Concerns
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity preview */}
          <Card className="border-border/50 shadow-sm md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="size-4 text-primary" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest reputation events</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : profileData?.reputation.events.length ? (
                <div className="space-y-1">
                  {profileData.reputation.events.slice(0, 5).map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                    >
                      <span className="text-sm text-muted-foreground">
                        {fmtReason(ev.reason)}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground/70">
                          {fmtDate(ev.createdAt)}
                        </span>
                        <span
                          className={cn(
                            "min-w-13 rounded-full px-2 py-0.5 text-center text-xs font-bold",
                            ev.delta >= 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          )}
                        >
                          {ev.delta >= 0 ? "+" : ""}
                          {ev.delta} pts
                        </span>
                      </div>
                    </div>
                  ))}
                  {profileData.reputation.events.length > 5 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("Activity")}
                      className="mt-1 flex w-full items-center justify-center gap-1 py-2 text-xs text-muted-foreground transition-colors hover:text-primary"
                    >
                      View all activity
                      <ArrowRight className="size-3" />
                    </button>
                  )}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No activity yet. Start participating to earn reputation.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          BADGES TAB
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "Badges" && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-primary" weight="fill" />
              All Earned Badges
            </CardTitle>
            <CardDescription>
              Recognition for your civic contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : profileData?.badges.length ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {profileData.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className="group flex items-start gap-4 rounded-xl border border-border/50 bg-linear-to-br from-muted/30 to-transparent p-4 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="text-3xl">
                      {BADGE_EMOJI[badge.badgeKey] ?? "🎖️"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-snug">
                        {badge.label}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {badge.description}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground/60">
                        Earned {fmtDate(badge.earnedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="flex size-24 items-center justify-center rounded-full bg-muted">
                  <Medal className="size-12 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">No badges yet</p>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Submit concerns, vote on proposals, and participate in
                    assemblies to earn your first badge.
                  </p>
                </div>
                <Link
                  href="/concerns"
                  className={cn(buttonVariants())}
                >
                  Explore Concerns
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ACTIVITY TAB
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "Activity" && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-5 text-primary" />
              Reputation Activity
            </CardTitle>
            <CardDescription>
              Your full reputation event history
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : profileData?.reputation.events.length ? (
              <div className="relative pl-6">
                {/* Timeline line */}
                <div className="absolute left-2.5 top-1 bottom-4 w-px bg-border" />

                <div className="space-y-3">
                  {profileData.reputation.events.map((ev) => (
                    <div key={ev.id} className="relative flex items-start gap-4">
                      {/* Dot */}
                      <div
                        className={cn(
                          "absolute -left-4 mt-3 flex size-5 items-center justify-center rounded-full ring-2 ring-background",
                          ev.delta >= 0 ? "bg-emerald-500" : "bg-red-500"
                        )}
                      >
                        <span className="text-[9px] font-black text-white leading-none">
                          {ev.delta >= 0 ? "▲" : "▼"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex min-w-0 flex-1 items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-snug">
                            {fmtReason(ev.reason)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {fmtDate(ev.createdAt)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
                            ev.delta >= 0
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-red-50 text-red-600"
                          )}
                        >
                          {ev.delta >= 0 ? "+" : ""}
                          {ev.delta} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 py-16 text-center">
                <div className="flex size-24 items-center justify-center rounded-full bg-muted">
                  <Clock className="size-12 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">No activity yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start participating to earn reputation points and see your
                    history here.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════
          SETTINGS TAB
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "Settings" && (
        <div className="space-y-5">

          {/* Profile Information */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="size-4 text-primary" weight="fill" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Your personal details on the platform
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditOpen(true)}
                >
                  <PencilSimple className="size-4" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    label: "Full Name",
                    value: displayName,
                    icon: <User className="size-3.5" />,
                  },
                  {
                    label: "Email",
                    value: user.email,
                    icon: <Envelope className="size-3.5" />,
                  },
                  {
                    label: "Phone",
                    value:
                      (user as { phoneNumber?: string }).phoneNumber ??
                      undefined,
                    icon: <Phone className="size-3.5" />,
                    fallback: "Not set",
                  },
                  {
                    label: "Address",
                    value: profileData?.extended.address ?? undefined,
                    icon: <MapPin className="size-3.5" />,
                    fallback: "Not set",
                  },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {field.icon}
                      {field.label}
                    </div>
                    {field.value ? (
                      <p className="text-sm font-medium">{field.value}</p>
                    ) : (
                      <p className="text-sm italic text-muted-foreground">
                        {field.fallback ?? "—"}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Identity status */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Identity Document
                </p>
                <div className="flex flex-wrap gap-2">
                  {profileData?.extended.nidHash ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle className="size-3.5" weight="fill" />
                      NID Registered
                    </span>
                  ) : profileData?.extended.birthCertificateNoHash ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                      <CheckCircle className="size-3.5" weight="fill" />
                      Birth Certificate Registered
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      ⚠️ No identity document on file
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Request Additional Access */}
          {role === "citizen" && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-primary" weight="fill" />
                  Request Additional Access
                </CardTitle>
                <CardDescription>
                  Expand your participation on the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    key: "expert",
                    emoji: "🎓",
                    label: "Expert / Professor",
                    desc: "Requires institutional email (.edu.bd) + NID",
                    accent:
                      "border-blue-200 bg-blue-50/40 hover:border-blue-300 hover:bg-blue-50",
                    done: "border-emerald-300 bg-emerald-50",
                  },
                  {
                    key: "ngo",
                    emoji: "🤝",
                    label: "NGO / Civil Society",
                    desc: "Requires NGO Bureau registration number + NID",
                    accent:
                      "border-teal-200 bg-teal-50/40 hover:border-teal-300 hover:bg-teal-50",
                    done: "border-emerald-300 bg-emerald-50",
                  },
                  {
                    key: "govt_authority",
                    emoji: "🏛️",
                    label: "Government Authority",
                    desc: "Requires official .gov.bd email + admin approval",
                    accent:
                      "border-amber-200 bg-amber-50/40 hover:border-amber-300 hover:bg-amber-50",
                    done: "border-emerald-300 bg-emerald-50",
                  },
                ].map((r) => {
                  const requested = requestedRoles.has(r.key)
                  return (
                    <div
                      key={r.key}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-4 transition-all",
                        requested ? r.done : r.accent
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{r.emoji}</span>
                        <div>
                          <p className="font-medium text-sm">{r.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.desc}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={requested}
                        onClick={() => {
                          setRequestedRoles((prev) => {
                            const next = new Set(prev)
                            next.add(r.key)
                            return next
                          })
                          toast.success(
                            `Request for ${r.label} submitted. Admin will review shortly.`
                          )
                        }}
                        className={cn(
                          "shrink-0 transition-all",
                          requested &&
                            "border-emerald-400 bg-emerald-50 text-emerald-700"
                        )}
                      >
                        {requested ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="size-4" weight="fill" />
                            Requested
                          </span>
                        ) : (
                          "Request"
                        )}
                      </Button>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Edit Profile Dialog ─────────────────────────────────────── */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={displayName}
        currentAddress={profileData?.extended.address ?? ""}
        onSaved={({ name, address }) => {
          setLocalName(name)
          setProfileData((prev) =>
            prev
              ? { ...prev, extended: { ...prev.extended, address } }
              : prev
          )
        }}
      />
    </div>
  )
}
