import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { updateActivityUseCase } from './update-activity-use-case'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  readonly updateCalls: Activity[] = []
  getError: Error | undefined
  updateError: Error | undefined
  updateReturnsFalse = false

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
    if (this.updateError) {
      throw this.updateError
    }

    this.updateCalls.push(activity)

    if (this.updateReturnsFalse || !this.activities.has(activity.id)) {
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

function createExistingActivity(): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status: 'archived',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

describe('updateActivityUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T15:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('updates and persists an existing activity while preserving immutable fields', async () => {
    const repository = new InMemoryActivityRepository()
    const existingActivity = createExistingActivity()
    await repository.add(existingActivity)

    const result = await updateActivityUseCase(repository, existingActivity.id, {
      title: '  Learn gouache painting  ',
      resumeNote: '  Mix a limited palette.  ',
    })

    expect(result).toEqual({
      kind: 'updated',
      activity: {
        id: existingActivity.id,
        title: 'Learn gouache painting',
        resumeNote: 'Mix a limited palette.',
        status: 'archived',
        createdAt: new Date('2026-11-01T12:00:00.000Z'),
        updatedAt: new Date('2026-11-04T15:00:00.000Z'),
      },
    })
    expect(repository.updateCalls).toHaveLength(1)
    if (result.kind === 'updated') {
      expect(await repository.getById(existingActivity.id)).toEqual(result.activity)
    }
  })

  it('clears the previous resume note when it is omitted', async () => {
    const repository = new InMemoryActivityRepository()
    const existingActivity = createExistingActivity()
    await repository.add(existingActivity)

    const result = await updateActivityUseCase(repository, existingActivity.id, {
      title: 'Learn gouache painting',
    })

    expect(result).toMatchObject({
      kind: 'updated',
      activity: { resumeNote: undefined },
    })
    expect((await repository.getById(existingActivity.id))?.resumeNote).toBeUndefined()
  })

  it('returns not-found without attempting an update when the activity is absent', async () => {
    const repository = new InMemoryActivityRepository()

    await expect(
      updateActivityUseCase(repository, 'missing-activity', { title: 'Learn gouache painting' }),
    ).resolves.toEqual({ kind: 'not-found' })
    expect(repository.updateCalls).toEqual([])
  })

  it('returns not-found when persistence reports a concurrent deletion', async () => {
    const repository = new InMemoryActivityRepository()
    const existingActivity = createExistingActivity()
    repository.updateReturnsFalse = true
    await repository.add(existingActivity)

    await expect(
      updateActivityUseCase(repository, existingActivity.id, {
        title: 'Learn gouache painting',
      }),
    ).resolves.toEqual({ kind: 'not-found' })
    expect(repository.updateCalls).toHaveLength(1)
  })

  it('propagates validation and persistence errors', async () => {
    const repository = new InMemoryActivityRepository()
    const existingActivity = createExistingActivity()
    await repository.add(existingActivity)

    await expect(
      updateActivityUseCase(repository, existingActivity.id, { title: '   ' }),
    ).rejects.toThrow()
    expect(repository.updateCalls).toEqual([])

    const persistenceError = new Error('Local storage is unavailable.')
    repository.updateError = persistenceError

    await expect(
      updateActivityUseCase(repository, existingActivity.id, {
        title: 'Learn gouache painting',
      }),
    ).rejects.toBe(persistenceError)
  })

  it('propagates lookup errors', async () => {
    const repository = new InMemoryActivityRepository()
    const lookupError = new Error('Local storage is unavailable.')
    repository.getError = lookupError

    await expect(
      updateActivityUseCase(repository, '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1', {
        title: 'Learn gouache painting',
      }),
    ).rejects.toBe(lookupError)
  })
})
