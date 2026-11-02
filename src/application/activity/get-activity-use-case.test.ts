import { describe, expect, it } from 'vitest'
import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { getActivityUseCase } from './get-activity-use-case'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  readonly getByIdCalls: string[] = []
  getError: Error | undefined

  async add(activity: Activity): Promise<void> {
    if (this.activities.has(activity.id)) {
      throw new Error('An activity with this ID already exists.')
    }

    this.activities.set(activity.id, cloneActivity(activity))
  }

  async getById(id: string): Promise<Activity | undefined> {
    if (this.getError) {
      throw this.getError
    }

    this.getByIdCalls.push(id)
    const activity = this.activities.get(id)

    return activity ? cloneActivity(activity) : undefined
  }

  async getAll(): Promise<Activity[]> {
    return [...this.activities.values()].map(cloneActivity)
  }

  async getByStatus(status: ActivityStatus): Promise<Activity[]> {
    return (await this.getAll()).filter((activity) => activity.status === status)
  }

  async update(activity: Activity): Promise<boolean> {
    if (!this.activities.has(activity.id)) {
      return false
    }

    this.activities.set(activity.id, cloneActivity(activity))

    return true
  }
}

function cloneActivity(activity: Activity): Activity {
  return {
    ...activity,
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(activity.updatedAt),
  }
}

function createActivity(): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    status: 'active',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

describe('getActivityUseCase', () => {
  it('returns an existing activity and delegates its ID to the repository', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity()
    await repository.add(activity)

    await expect(getActivityUseCase(repository, activity.id)).resolves.toEqual(activity)
    expect(repository.getByIdCalls).toEqual([activity.id])
  })

  it('returns undefined when the activity does not exist', async () => {
    const repository = new InMemoryActivityRepository()

    await expect(
      getActivityUseCase(repository, '00000000-0000-4000-8000-000000000000'),
    ).resolves.toBeUndefined()
  })

  it('propagates repository errors', async () => {
    const repository = new InMemoryActivityRepository()
    const persistenceError = new Error('Local storage is unavailable.')
    repository.getError = persistenceError

    await expect(
      getActivityUseCase(repository, '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1'),
    ).rejects.toBe(persistenceError)
  })
})
