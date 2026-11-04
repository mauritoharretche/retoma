import {
  activityEditableFieldsSchema,
  activitySchema,
  type Activity,
  type ActivityEditableFields,
} from '../models/activity'

export type { ActivityEditableFields } from '../models/activity'

export function createActivity(input: ActivityEditableFields): Activity {
  const { title, resumeNote } = activityEditableFieldsSchema.parse(input)
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
  input: ActivityEditableFields,
): Activity {
  const { title, resumeNote } = activityEditableFieldsSchema.parse(input)

  return activitySchema.parse({
    id: activity.id,
    title,
    resumeNote,
    status: activity.status,
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(),
  })
}
