"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface AssemblyEvent {
  id: string
  title: string
  date: string
  time: string
  location: string
  organizer: string
  attendees: number
  topic: string
  status: "Upcoming" | "Ongoing" | "Completed"
}

export default function AssemblyEventsPage() {
  const [events, setEvents] = useState<AssemblyEvent[]>([
    {
      id: "ae-1",
      title: "Ward 50 Town Hall - Infrastructure Planning",
      date: "2026-04-20",
      time: "18:00 - 20:00",
      location: "Community Center, Mirpur 10",
      organizer: "DMC Ward Commissioner",
      attendees: 87,
      topic: "Drainage & Street Maintenance Budget Review",
      status: "Upcoming",
    },
    {
      id: "ae-2",
      title: "City Assembly Q&A: Waste Management",
      date: "2026-04-18",
      time: "10:00 - 12:00",
      location: "City Hall, Main Building",
      organizer: "Dhaka City Corporation",
      attendees: 156,
      topic: "Waste collection and disposal policies",
      status: "Upcoming",
    },
    {
      id: "ae-3",
      title: "Public Hearing - Traffic Safety Measures",
      date: "2026-03-28",
      time: "15:00 - 17:00",
      location: "Bangla Motor Station",
      organizer: "DMP & DMC",
      attendees: 203,
      topic: "New lane markings and signal timing",
      status: "Completed",
    },
  ])

  const statusColors: Record<string, string> = {
    Upcoming: "bg-blue-100 text-blue-800",
    Ongoing: "bg-yellow-100 text-yellow-800",
    Completed: "bg-green-100 text-green-800",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assembly Events</h1>
        <p className="text-gray-600">Civic meetings and town halls with government bodies</p>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{event.title}</CardTitle>
                  <CardDescription>{event.organizer}</CardDescription>
                </div>
                <Badge className={statusColors[event.status]}>{event.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Topic:</p>
              <p className="text-sm text-gray-600">{event.topic}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Date & Time</p>
                  <p className="font-medium">{event.date}</p>
                  <p className="text-gray-700">{event.time}</p>
                </div>
                <div>
                  <p className="text-gray-600">Location</p>
                  <p className="font-medium">{event.location}</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div>
                  <p className="text-gray-600">Expected Attendees</p>
                  <p className="font-medium">{event.attendees} registered</p>
                </div>
                <Button variant="outline" className="h-8">
                  {event.status === "Completed" ? "View Minutes" : "Register"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
