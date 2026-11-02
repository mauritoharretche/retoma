import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Activity, ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { createActivityUseCase } from './create-activity-use-case'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  readonly addCalls: Activity[] = []
  addError: Error | undefined

  async add(activity: Activity): Promise<void> {
    if (this.addError) {
      throw this.addError
    }

    if (this.activities.has(activity.id)) {
      throw new Error('An activity with this ID already exists.')
    }

    this.addCalls.push(activity)
    this.activities.set(activity.id, cloneActivity(activity))
  }

  async getById(id: string): Promise<Activity | undefined> {
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

describe('createActivityUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T12:00:00.000Z'))
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      'c36c7f70-9bbf-47b5-8262-7e8f4aa4c4d0',
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('creates, normalizes, persists, and returns an active activity', async () => {
    const repository = new InMemoryActivityRepository()

    const activity = await createActivityUseCase(repository, {
      title: '  Learn watercolour painting  ',
      resumeNote: '  Practice wet-on-wet skies.  ',
    })

    expect(activity).toMatchObject({
      id: 'c36c7f70-9bbf-47b5-8262-7e8f4aa4c4d0',
      title: 'Learn watercolour painting',
      resumeNote: 'Practice wet-on-wet skies.',
      status: 'active',
    })
    expect(activity.createdAt).toEqual(new Date('2026-11-04T12:00:00.000Z'))
    expect(activity.updatedAt).toEqual(activity.createdAt)
    expect(repository.addCalls).toEqual([activity])
    expect(await repository.getById(activity.id)).toEqual(activity)
  })

  it('propagates validation errors without persisting an activity', async () => {
    const repository = new InMemoryActivityRepository()

    await expect(
      createActivityUseCase(repository, { title: '   ' }),
    ).rejects.toThrow()
    expect(repository.addCalls).toEqual([])
    expect(await repository.getAll()).toEqual([])
  })

  it('propagates persistence errors', async () => {
    const repository = new InMemoryActivityRepository()
    const persistenceError = new Error('Local storage is unavailable.')
    repository.addError = persistenceError

    await expect(
      createActivityUseCase(repository, { title: 'Learn watercolour painting' }),
    ).rejects.toBe(persistenceError)
  })
})
