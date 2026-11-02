import type { Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import {
  createActivity,
  type ActivityEditableFields,
} from '../../domain/services/activity-lifecycle'

export async function createActivityUseCase(
  repository: ActivityRepository,
  input: ActivityEditableFields,
): Promise<Activity> {
  const activity = createActivity(input)

  await repository.add(activity)

  return activity
}
