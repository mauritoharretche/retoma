import type { Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import type { ActivityEditableFields } from '../../domain/services/activity-lifecycle'
import {
  archiveActivityUseCase,
  restoreActivityUseCase,
  type ActivityStatusTransitionUseCaseResult,
} from './activity-status-use-case'
import { createActivityUseCase } from './create-activity-use-case'
import { getActivityUseCase } from './get-activity-use-case'
import { listActivitiesUseCase, type ListActivitiesInput } from './list-activities-use-case'
import { updateActivityUseCase, type UpdateActivityResult } from './update-activity-use-case'

export interface ActivityUseCases {
  create(input: ActivityEditableFields): Promise<Activity>
  update(id: string, input: ActivityEditableFields): Promise<UpdateActivityResult>
  get(id: string): Promise<Activity | undefined>
  list(input?: ListActivitiesInput): Promise<Activity[]>
  archive(id: string): Promise<ActivityStatusTransitionUseCaseResult>
  restore(id: string): Promise<ActivityStatusTransitionUseCaseResult>
}

export function createActivityUseCases(repository: ActivityRepository): ActivityUseCases {
  return {
    create: (input) => createActivityUseCase(repository, input),
    update: (id, input) => updateActivityUseCase(repository, id, input),
    get: (id) => getActivityUseCase(repository, id),
    list: (input) => listActivitiesUseCase(repository, input),
    archive: (id) => archiveActivityUseCase(repository, id),
    restore: (id) => restoreActivityUseCase(repository, id),
  }
}
