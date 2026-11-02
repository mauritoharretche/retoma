import type { Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import {
  type ActivityEditableFields,
  updateActivity,
} from '../../domain/services/activity-lifecycle'

export type UpdateActivityResult =
  | { kind: 'updated'; activity: Activity }
  | { kind: 'not-found' }

export async function updateActivityUseCase(
  repository: ActivityRepository,
  id: string,
  input: ActivityEditableFields,
): Promise<UpdateActivityResult> {
  const existingActivity = await repository.getById(id)

  if (!existingActivity) {
    return { kind: 'not-found' }
  }

  const updatedActivity = updateActivity(existingActivity, input)
  const wasUpdated = await repository.update(updatedActivity)

  if (!wasUpdated) {
    return { kind: 'not-found' }
  }

  return { kind: 'updated', activity: updatedActivity }
}
