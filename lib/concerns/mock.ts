export type ConcernStatus =
  | "Submitted"
  | "Under Review"
  | "Resolved"
  | "Rejected"

export interface StatusUpdate {
  id: string
  status: ConcernStatus
  note?: string
  timestamp: string
  author: string
}

export interface Concern {
  id: string
  title: string
  description: string
  status: ConcernStatus
  upvotes: number
  hasUpvoted: boolean
  createdAt: string
  author: {
    name: string
    avatar?: string
  }
  location: {
    lat: number
    lng: number
    address?: string
  }
  photos: string[]
  updates: StatusUpdate[]
}

export const MOCK_CONCERNS: Concern[] = [
  {
    id: "c-001",
    title: "Open manhole on Mirpur 10 roundabout",
    description:
      "There is a completely open manhole near the metro rail station entrance. It is extremely dangerous for pedestrians, especially at night when the streetlights are dim.",
    status: "Under Review",
    upvotes: 142,
    hasUpvoted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
    author: {
      name: "Ahmed R.",
    },
    location: {
      lat: 23.8069,
      lng: 90.3687,
      address: "Mirpur 10, Dhaka",
    },
    photos: ["https://placehold.co/600x400/png?text=Open+Manhole"],
    updates: [
      {
        id: "u-001",
        status: "Submitted",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        author: "Ahmed R.",
      },
      {
        id: "u-002",
        status: "Under Review",
        note: "Assigned to DNCC Ward 14 maintenance team for inspection.",
        timestamp: new Date(
          Date.now() - 1000 * 60 * 60 * 24 * 1.5
        ).toISOString(),
        author: "DNCC Admin",
      },
    ],
  },
  {
    id: "c-002",
    title: "Illegal waste dumping near school",
    description:
      "Every night, unknown trucks are dumping industrial waste near the Dhanmondi Boys School wall. The smell is unbearable and it's a major health hazard for the students.",
    status: "Submitted",
    upvotes: 85,
    hasUpvoted: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    author: {
      name: "Fatima S.",
    },
    location: {
      lat: 23.7461,
      lng: 90.3742,
      address: "Dhanmondi, Dhaka",
    },
    photos: ["https://placehold.co/600x400/png?text=Waste+Dump"],
    updates: [
      {
        id: "u-003",
        status: "Submitted",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        author: "Fatima S.",
      },
    ],
  },
  {
    id: "c-003",
    title: "Broken streetlight causing accidents",
    description:
      "The main streetlight at the Banani intersection has been broken for 3 weeks. There have been two minor collisions already.",
    status: "Resolved",
    upvotes: 210,
    hasUpvoted: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
    author: {
      name: "Kamrul H.",
    },
    location: {
      lat: 23.794,
      lng: 90.4043,
      address: "Banani, Dhaka",
    },
    photos: ["https://placehold.co/600x400/png?text=Broken+Light"],
    updates: [
      {
        id: "u-004",
        status: "Submitted",
        timestamp: new Date(
          Date.now() - 1000 * 60 * 60 * 24 * 10
        ).toISOString(),
        author: "Kamrul H.",
      },
      {
        id: "u-005",
        status: "Under Review",
        note: "Forwarded to DESCO electrical division.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
        author: "City Admin",
      },
      {
        id: "u-006",
        status: "Resolved",
        note: "The streetlight bulb has been replaced and the circuit board repaired.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        author: "DESCO Field Team",
      },
    ],
  },
]
