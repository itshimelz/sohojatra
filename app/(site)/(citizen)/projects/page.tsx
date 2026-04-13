"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ProjectDeliverable {
  id: string
  title: string
  ministry: string
  status: "Planning" | "In Progress" | "On Hold" | "Completed"
  progress: number
  deadline: string
  owner: string
}

export default function ProjectTrackerPage() {
  const [projects, setProjects] = useState<ProjectDeliverable[]>([
    {
      id: "pt-1",
      title: "Drainage system rehabilitation - Mirpur Zone",
      ministry: "Ministry of Local Government",
      status: "In Progress",
      progress: 65,
      deadline: "30 Jun 2026",
      owner: "Eng. Karim Hossain",
    },
    {
      id: "pt-2",
      title: "Street lighting modernization - South Dhaka",
      ministry: "Dhaka City Corporation",
      status: "Planning",
      progress: 15,
      deadline: "15 Aug 2026",
      owner: "Ms. Nazma Akhter",
    },
    {
      id: "pt-3",
      title: "Footpath safety audit - All wards",
      ministry: "Ministry of Local Government",
      status: "Completed",
      progress: 100,
      deadline: "31 Mar 2026",
      owner: "Dr. Rafiq Hasan",
    },
    {
      id: "pt-4",
      title: "Waste management pilot - Ward 50",
      ministry: "Dhaka City Corporation",
      status: "On Hold",
      progress: 42,
      deadline: "31 Jul 2026",
      owner: "Eng. Arif Khan",
    },
  ])

  const statusColors: Record<string, string> = {
    Planning: "bg-blue-100 text-blue-800",
    "In Progress": "bg-yellow-100 text-yellow-800",
    "On Hold": "bg-orange-100 text-orange-800",
    Completed: "bg-green-100 text-green-800",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Tracker</h1>
        <p className="text-gray-600">Monitor ongoing civic infrastructure projects</p>
      </div>

      <div className="grid gap-4">
        {projects.map((project) => (
          <Card key={project.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{project.title}</CardTitle>
                  <CardDescription>{project.ministry}</CardDescription>
                </div>
                <Badge className={statusColors[project.status]}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-semibold">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Project Owner</p>
                  <p className="font-medium">{project.owner}</p>
                </div>
                <div>
                  <p className="text-gray-600">Target Deadline</p>
                  <p className="font-medium">{project.deadline}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
