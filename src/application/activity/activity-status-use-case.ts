import type { Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import {
  archiveActivity,
  restoreActivity,
  type ActivityStatusTransitionResult,
} from '../../domain/services/activity-status'

export type ActivityStatusTransitionUseCaseResult =
  | { kind: 'updated'; activity: Activity }
  | { kind: 'not-found' }
  | { kind: 'invalid-transition' }

export function archiveActivityUseCase(
  repository: ActivityRepository,
  id: string,
): Promise<ActivityStatusTransitionUseCaseResult> {
  return runActivityStatusTransition(repository, id, archiveActivity)
}

export function restoreActivityUseCase(
  repository: ActivityRepository,
  id: string,
): Promise<ActivityStatusTransitionUseCaseResult> {
  return runActivityStatusTransition(repository, id, restoreActivity)
}

async function runActivityStatusTransition(
  repository: ActivityRepository,
  id: string,
  transition: (activity: Activity) => ActivityStatusTransitionResult,
): Promise<ActivityStatusTransitionUseCaseResult> {
  const existingActivity = await repository.getById(id)

  if (!existingActivity) {
    return { kind: 'not-found' }
  }

  const transitionResult = transition(existingActivity)

  if (transitionResult.kind === 'invalid-transition') {
    return transitionResult
  }

  const wasUpdated = await repository.update(transitionResult.activity)

  if (!wasUpdated) {
    return { kind: 'not-found' }
  }

  return { kind: 'updated', activity: transitionResult.activity }
}
