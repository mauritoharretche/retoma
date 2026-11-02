import type { Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'

export function getActivityUseCase(
  repository: ActivityRepository,
  id: string,
): Promise<Activity | undefined> {
  return repository.getById(id)
}
