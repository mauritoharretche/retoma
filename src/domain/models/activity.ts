import { z } from 'zod'

export const activityStatusSchema = z.enum(['active', 'archived'])

export const activitySchema = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(100),
  resumeNote: z.string().trim().max(500).optional(),
  status: activityStatusSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type ActivityStatus = z.infer<typeof activityStatusSchema>
export type Activity = z.infer<typeof activitySchema>
