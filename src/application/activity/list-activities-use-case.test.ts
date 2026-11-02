import { describe, expect, it } from 'vitest'
import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { listActivitiesUseCase } from './list-activities-use-case'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  getAllCalls = 0
  readonly getByStatusCalls: ActivityStatus[] = []
  getAllError: Error | undefined
  getByStatusError: Error | undefined

  async add(activity: Activity): Promise<void> {
    if (this.activities.has(activity.id)) {
      throw new Error('An activity with this ID already exists.')
    }

    this.activities.set(activity.id, cloneActivity(activity))
  }

  async getById(id: string): Promise<Activity | undefined> {
    const activity = this.activities.get(id)

    return activity ? cloneActivity(activity) : undefined
  }

  async getAll(): Promise<Activity[]> {
    if (this.getAllError) {
      throw this.getAllError
    }

    this.getAllCalls += 1

    return [...this.activities.values()].map(cloneActivity)
  }

  async getByStatus(status: ActivityStatus): Promise<Activity[]> {
    if (this.getByStatusError) {
      throw this.getByStatusError
    }

    this.getByStatusCalls.push(status)

    return [...this.activities.values()]
      .filter((activity) => activity.status === status)
      .map(cloneActivity)
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

function createActivity(id: string, status: ActivityStatus): Activity {
  return activitySchema.parse({
    id,
    title: `Activity ${id.slice(-1)}`,
    status,
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

describe('listActivitiesUseCase', () => {
  it('delegates to getAll without imposing an order', async () => {
    const repository = new InMemoryActivityRepository()
    const activeActivity = createActivity('00000000-0000-4000-8000-000000000001', 'active')
    const archivedActivity = createActivity('00000000-0000-4000-8000-000000000002', 'archived')
    await repository.add(activeActivity)
    await repository.add(archivedActivity)

    const activities = await listActivitiesUseCase(repository)

    expect(activities).toHaveLength(2)
    expect(activities).toEqual(expect.arrayContaining([activeActivity, archivedActivity]))
    expect(repository.getAllCalls).toBe(1)
    expect(repository.getByStatusCalls).toEqual([])
  })

  it('delegates a status filter to getByStatus', async () => {
    const repository = new InMemoryActivityRepository()
    const activeActivity = createActivity('00000000-0000-4000-8000-000000000001', 'active')
    const archivedActivity = createActivity('00000000-0000-4000-8000-000000000002', 'archived')
    await repository.add(activeActivity)
    await repository.add(archivedActivity)

    await expect(listActivitiesUseCase(repository, { status: 'archived' })).resolves.toEqual([
      archivedActivity,
    ])
    expect(repository.getAllCalls).toBe(0)
    expect(repository.getByStatusCalls).toEqual(['archived'])
  })

  it('returns an empty list when no activities match', async () => {
    const repository = new InMemoryActivityRepository()

    await expect(listActivitiesUseCase(repository, { status: 'active' })).resolves.toEqual([])
  })

  it('propagates errors from both query operations', async () => {
    const repository = new InMemoryActivityRepository()
    const getAllError = new Error('Local storage is unavailable.')
    repository.getAllError = getAllError

    await expect(listActivitiesUseCase(repository)).rejects.toBe(getAllError)

    const getByStatusError = new Error('Local storage is unavailable.')
    repository.getByStatusError = getByStatusError

    await expect(
      listActivitiesUseCase(repository, { status: 'active' }),
    ).rejects.toBe(getByStatusError)
  })
})
