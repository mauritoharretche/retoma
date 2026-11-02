import { activitySchema, type Activity, type ActivityStatus } from '../models/activity'

export type ActivityStatusTransitionResult =
  | { kind: 'success'; activity: Activity }
  | { kind: 'invalid-transition' }

export function archiveActivity(activity: Activity): ActivityStatusTransitionResult {
  return transitionActivityStatus(activity, 'active', 'archived')
}

export function restoreActivity(activity: Activity): ActivityStatusTransitionResult {
  return transitionActivityStatus(activity, 'archived', 'active')
}

function transitionActivityStatus(
  activity: Activity,
  expectedStatus: ActivityStatus,
  nextStatus: ActivityStatus,
): ActivityStatusTransitionResult {
  if (activity.status !== expectedStatus) {
    return { kind: 'invalid-transition' }
  }

  return {
    kind: 'success',
    activity: activitySchema.parse({
      id: activity.id,
      title: activity.title,
      resumeNote: activity.resumeNote,
      status: nextStatus,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(),
    }),
  }
}
