import type { Activity, ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'

export interface ListActivitiesInput {
  status?: ActivityStatus
}

export function listActivitiesUseCase(
  repository: ActivityRepository,
  input: ListActivitiesInput = {},
): Promise<Activity[]> {
  if (input.status) {
    return repository.getByStatus(input.status)
  }

  return repository.getAll()
}
