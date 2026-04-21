export interface CommentUser {
  id?: string
  name: string
  isAuthor?: boolean
}

export interface CommentData {
  id: string
  user: CommentUser
  body: string
  upvotes: number
  downvotes: number
  createdAt: string
  parentCommentId?: string
  quoted?: string
  aiPriorityScore?: number
  replies?: CommentData[]
}

export type CommentSortOrder = "popular" | "recent"
