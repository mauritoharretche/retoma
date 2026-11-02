import { activitySchema, type Activity } from '../models/activity'

export type ActivityEditableFields = Pick<Activity, 'title' | 'resumeNote'>

export function createActivity({ title, resumeNote }: ActivityEditableFields): Activity {
  const now = new Date()

  return activitySchema.parse({
    id: globalThis.crypto.randomUUID(),
    title,
    resumeNote,
    status: 'active',
    createdAt: new Date(now),
    updatedAt: new Date(now),
  })
}

export function updateActivity(
  activity: Activity,
  { title, resumeNote }: ActivityEditableFields,
): Activity {
  return activitySchema.parse({
    id: activity.id,
    title,
    resumeNote,
    status: activity.status,
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(),
  })
}
