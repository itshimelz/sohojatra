"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  roles: string[]
  reputation: number
  contributions: number
  joinDate: string
  verified: boolean
  avatar?: string
}

interface UserRole {
  id: string
  name: string
  permissions: string[]
  since: string
}

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile>({
    id: "u-101",
    name: "Ahmed Rahman",
    email: "ahmed.r@example.com",
    phone: "+880-1700-123456",
    roles: ["Citizen", "Researcher", "Moderator"],
    reputation: 842,
    contributions: 34,
    joinDate: "2024-01-15",
    verified: true,
  })

  const [roles, setRoles] = useState<UserRole[]>([
    {
      id: "r-1",
      name: "Citizen",
      permissions: ["Create concerns", "Vote topics", "Comment"],
      since: "2024-01-15",
    },
    {
      id: "r-2",
      name: "Researcher",
      permissions: ["Apply for grants", "Publish research", "Access data"],
      since: "2024-06-20",
    },
    {
      id: "r-3",
      name: "Moderator",
      permissions: ["Review content", "Flag inappropriate", "Escalate issues"],
      since: "2024-12-01",
    },
  ])

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                {profile.verified && (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                )}
              </div>
              <p className="text-gray-600 text-sm">{profile.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">{profile.reputation}</p>
              <p className="text-gray-600 text-sm">Reputation Points</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">{profile.contributions}</p>
              <p className="text-gray-600 text-sm">Contributions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-purple-600">{roles.length}</p>
              <p className="text-gray-600 text-sm">Active Roles</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{profile.phone}</p>
              </div>
              <div>
                <p className="text-gray-600">Member Since</p>
                <p className="font-medium">{new Date(profile.joinDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles & Permissions */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Roles & Permissions</h2>
        <div className="grid gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{role.name}</CardTitle>
                <CardDescription>Since {new Date(role.since).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {role.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <span className="text-sm">{perm}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Roles to Request */}
      <div>
        <h3 className="text-lg font-bold mb-3">Request Additional Roles</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Academic Partner</p>
                  <p className="text-sm text-gray-600">For university research collaborations</p>
                </div>
                <Button variant="outline" size="sm">
                  Request
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">Government Officer</p>
                  <p className="text-sm text-gray-600">Official capacity from government agency</p>
                </div>
                <Button variant="outline" size="sm">
                  Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
