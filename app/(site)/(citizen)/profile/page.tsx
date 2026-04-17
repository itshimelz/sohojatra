"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"

interface ReputationData {
  totalPoints: number
  tier: string
  weightMultiplier: number
  events: Array<{ id: string; delta: number; reason: string; createdAt: string }>
}

interface EarnedBadge {
  id: string
  badgeKey: string
  label: string
  description: string
  earnedAt: string
}

interface ProfileData {
  reputation: ReputationData
  badges: EarnedBadge[]
  stats: { totalVotes: number; totalConcerns: number; totalComments: number }
}

const ROLE_PERMISSIONS: Record<string, { label: string; permissions: string[] }> = {
  citizen: {
    label: "Citizen",
    permissions: ["Submit concerns", "Vote on proposals", "Comment and quote-reply", "Attend assembly events"],
  },
  expert: {
    label: "Expert / Professor",
    permissions: ["All citizen permissions", "Submit solution proposals", "Apply for research grants", "Access AI-prioritized concern list"],
  },
  govt_authority: {
    label: "Government Authority",
    permissions: ["All citizen permissions", "Approve/reject solution plans", "Assign departments", "Publish assembly minutes", "View accountability KPIs"],
  },
  ngo: {
    label: "NGO / Civil Society",
    permissions: ["All citizen permissions", "Co-sponsor concerns", "Organize events", "Submit proposals"],
  },
  admin: {
    label: "Platform Admin",
    permissions: ["Full platform access", "User management", "Content moderation queue", "Crime flag review", "Trigger model retraining"],
  },
}

const TIER_COLORS: Record<string, string> = {
  Champion: "bg-purple-100 text-purple-800",
  Expert: "bg-blue-100 text-blue-800",
  Active: "bg-green-100 text-green-800",
  Newcomer: "bg-gray-100 text-gray-700",
}

export default function UserProfilePage() {
  const { session } = useAuth()
  const user = session?.user
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [requestingRole, setRequestingRole] = useState<string | null>(null)

  const userId = user?.id ?? "anonymous"

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [repRes, badgeRes] = await Promise.all([
          fetch(`/api/reputation?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
          fetch(`/api/badges?userId=${encodeURIComponent(userId)}`, { cache: "no-store" }),
        ])
        const repData = repRes.ok ? ((await repRes.json()) as ReputationData) : null
        const badgeData = badgeRes.ok ? ((await badgeRes.json()) as { badges: EarnedBadge[] }) : null

        if (!cancelled) {
          setProfileData({
            reputation: repData ?? { totalPoints: 0, tier: "Newcomer", weightMultiplier: 1, events: [] },
            badges: badgeData?.badges ?? [],
            stats: { totalVotes: 0, totalConcerns: 0, totalComments: 0 },
          })
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    if (userId !== "anonymous") void load()
    else setIsLoading(false)
    return () => {
      cancelled = true
    }
  }, [userId])

  const role = (user as { role?: string } | undefined)?.role ?? "citizen"
  const roleConfig = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.citizen!

  if (!user) {
    return (
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Please{" "}
            <a href="/login" className="text-blue-600 underline">
              sign in
            </a>{" "}
            to view your profile.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
                {!isLoading && profileData && (
                  <Badge className={TIER_COLORS[profileData.reputation.tier] ?? TIER_COLORS.Newcomer!}>
                    {profileData.reputation.tier}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {(user as { phoneNumber?: string }).phoneNumber && (
                <p className="text-muted-foreground text-sm">
                  {(user as { phoneNumber?: string }).phoneNumber}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">
                {isLoading ? "—" : (profileData?.reputation.totalPoints ?? 0)}
              </p>
              <p className="text-muted-foreground text-sm">Reputation Points</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {isLoading ? "—" : (profileData?.badges.length ?? 0)}
              </p>
              <p className="text-muted-foreground text-sm">Badges Earned</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">
                {isLoading ? "—" : `${profileData?.reputation.weightMultiplier.toFixed(1) ?? "1.0"}x`}
              </p>
              <p className="text-muted-foreground text-sm">Vote Weight</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role & Permissions */}
      <Card>
        <CardHeader>
          <CardTitle>Role & Permissions</CardTitle>
          <CardDescription>Your current platform role and what you can do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="text-sm px-3 py-1">{roleConfig.label}</Badge>
          </div>
          <div className="space-y-2">
            {roleConfig.permissions.map((perm, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">{perm}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {!isLoading && profileData && profileData.badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earned Badges</CardTitle>
            <CardDescription>Recognition for your civic contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {profileData.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {badge.label.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{badge.label}</p>
                    <p className="text-xs text-muted-foreground">{badge.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reputation Events */}
      {!isLoading && profileData && profileData.reputation.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest reputation events on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {profileData.reputation.events.slice(0, 10).map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm py-2 border-b border-border/40 last:border-0">
                  <span className="text-muted-foreground">{event.reason.replace(/_/g, " ").toLowerCase()}</span>
                  <span className={`font-semibold ${event.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {event.delta >= 0 ? "+" : ""}{event.delta} pts
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Additional Roles */}
      {role === "citizen" && (
        <Card>
          <CardHeader>
            <CardTitle>Request Additional Access</CardTitle>
            <CardDescription>Expand your participation on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  key: "expert",
                  label: "Expert / Professor",
                  desc: "Requires institutional email (.edu.bd or university domain) + NID",
                },
                {
                  key: "ngo",
                  label: "NGO / Civil Society",
                  desc: "Requires NGO Bureau registration number + NID of representative",
                },
                {
                  key: "govt_authority",
                  label: "Government Authority",
                  desc: "Requires official .gov.bd email + admin approval",
                },
              ].map((r) => (
                <div key={r.key} className="flex items-center justify-between p-3 border rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={requestingRole === r.key}
                    onClick={() => setRequestingRole(r.key)}
                  >
                    {requestingRole === r.key ? "Requested" : "Request"}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
