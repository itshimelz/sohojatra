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
  downvotes: number
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
