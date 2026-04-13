"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface OpenDataset {
  count: number
  data: Array<Record<string, any>>
}

interface DataStats {
  totalConcerns: number
  totalProposals: number
  totalResearch: number
  totalAwards: number
  averageConcernVotes: number
  topConcerns: Array<{ rank: number; title: string; votes: number }>
}

export default function OpenDataPortalPage() {
  const [stats, setStats] = useState<DataStats | null>(null)
  const [datasets, setDatasets] = useState<Record<string, OpenDataset>>({})
  const [activeTab, setActiveTab] = useState<"stats" | "concerns" | "proposals" | "research" | "awards">
    ("stats")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/open-data")
        const data = await res.json()

        setStats(data.datasets.statistics)
        setDatasets({
          concerns: data.datasets.concerns,
          proposals: data.datasets.proposals,
          research: data.datasets.researchProblems,
          awards: data.datasets.awards,
        })
      } catch (error) {
        console.error("Failed to load open data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const downloadDataset = (datasetName: string) => {
    const dataStr = JSON.stringify(datasets[datasetName], null, 2)
    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(dataStr))
    element.setAttribute("download", `${datasetName}-${new Date().toISOString().split("T")[0]}.json`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (loading) {
    return <div className="text-center py-12">Loading open data...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Open Data Portal</h1>
        <p className="text-gray-600">
          Access civic data and research datasets under CC BY 4.0 license
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        {["stats", "concerns", "proposals", "research", "awards"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Statistics View */}
      {activeTab === "stats" && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Concerns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalConcerns}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Proposals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalProposals}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Research Problems</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalResearch}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Awards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalAwards}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "stats" && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Top Concerns by Votes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topConcerns.map((concern) => (
                <div key={concern.rank} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-lg font-bold">
                      #{concern.rank}
                    </Badge>
                    <span className="text-sm">{concern.title}</span>
                  </div>
                  <span className="font-semibold text-green-600">{concern.votes} votes</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Views */}
      {activeTab !== "stats" && datasets[activeTab] && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</CardTitle>
              <CardDescription>{datasets[activeTab].count} records available</CardDescription>
            </div>
            <Button onClick={() => downloadDataset(activeTab)}>Download JSON</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    {Object.keys(datasets[activeTab].data[0] || {})
                      .slice(0, 4)
                      .map((key) => (
                        <th key={key} className="text-left py-2 px-2 font-medium">
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {datasets[activeTab].data.slice(0, 10).map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {Object.values(item)
                        .slice(0, 4)
                        .map((val, vidx) => (
                          <td key={vidx} className="py-2 px-2 text-gray-700">
                            {typeof val === "object" ? JSON.stringify(val) : String(val).slice(0, 40)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {datasets[activeTab].data.length > 10 && (
              <p className="text-gray-600 text-sm mt-3">
                Showing 10 of {datasets[activeTab].count} records. Download full dataset as JSON.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>API Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="font-medium mb-2">Endpoints:</p>
            <ul className="space-y-1 text-gray-600">
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data</code> - Full dataset
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data?dataset=concerns</code> - Concerns only
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data?dataset=proposals</code> - Proposals only
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data?dataset=research</code> - Research problems
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data?dataset=awards</code> - Awards
              </li>
              <li>
                <code className="bg-gray-100 px-2 py-1">/api/open-data?dataset=statistics</code> - Statistics only
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-2">License:</p>
            <p className="text-gray-600">All data is available under Creative Commons Attribution 4.0 International</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
