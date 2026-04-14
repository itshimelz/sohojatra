import { z } from "zod"

export const createConcernSchema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters long.").max(200, "Title is too long."),
  description: z.string().trim().min(20, "Description must be at least 20 characters long."),
  authorName: z.string().trim().optional(),
  location: z.string().trim().min(5, "Location details are required."),
  locationLat: z.number().min(-90).max(90),
  locationLng: z.number().min(-180).max(180),
  photos: z.array(z.string().url()).optional().default([]),
})

export type CreateConcernInput = z.infer<typeof createConcernSchema>
