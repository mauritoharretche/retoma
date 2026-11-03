import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import {
  archiveActivityUseCase,
  restoreActivityUseCase,
} from './activity-status-use-case'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  readonly getByIdCalls: string[] = []
  readonly updateCalls: Activity[] = []
  getByIdError: Error | undefined
  updateError: Error | undefined
  updateReturnsFalse = false

  async add(activity: Activity): Promise<void> {
    if (this.activities.has(activity.id)) {
      throw new Error('An activity with this ID already exists.')
    }

    this.activities.set(activity.id, cloneActivity(activity))
  }

  async getById(id: string): Promise<Activity | undefined> {
    if (this.getByIdError) {
      throw this.getByIdError
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
    if (this.updateError) {
      throw this.updateError
    }

    this.updateCalls.push(cloneActivity(activity))

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

function createActivity(status: ActivityStatus): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status,
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

describe('activity status use cases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('archives an active activity and persists the transitioned entity', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('active')
    const originalActivity = cloneActivity(activity)
    await repository.add(activity)

    const result = await archiveActivityUseCase(repository, activity.id)

    expect(result).toEqual({
      kind: 'updated',
      activity: {
        id: activity.id,
        title: activity.title,
        resumeNote: activity.resumeNote,
        status: 'archived',
        createdAt: activity.createdAt,
        updatedAt: new Date('2026-11-05T10:00:00.000Z'),
      },
    })
    expect(repository.updateCalls).toHaveLength(1)
    if (result.kind === 'updated') {
      expect(await repository.getById(activity.id)).toEqual(result.activity)
    }
    expect(activity).toEqual(originalActivity)
  })

  it('restores an archived activity and persists the transitioned entity', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('archived')
    const originalActivity = cloneActivity(activity)
    await repository.add(activity)

    const result = await restoreActivityUseCase(repository, activity.id)

    expect(result).toEqual({
      kind: 'updated',
      activity: {
        id: activity.id,
        title: activity.title,
        resumeNote: activity.resumeNote,
        status: 'active',
        createdAt: activity.createdAt,
        updatedAt: new Date('2026-11-05T10:00:00.000Z'),
      },
    })
    expect(repository.updateCalls).toHaveLength(1)
    if (result.kind === 'updated') {
      expect(await repository.getById(activity.id)).toEqual(result.activity)
    }
    expect(activity).toEqual(originalActivity)
  })

  it('returns not-found without updating when an activity does not exist', async () => {
    const repository = new InMemoryActivityRepository()

    await expect(
      archiveActivityUseCase(repository, '00000000-0000-4000-8000-000000000000'),
    ).resolves.toEqual({ kind: 'not-found' })
    expect(repository.updateCalls).toEqual([])
  })

  it('returns invalid-transition without updating an already archived activity', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('archived')
    await repository.add(activity)

    await expect(archiveActivityUseCase(repository, activity.id)).resolves.toEqual({
      kind: 'invalid-transition',
    })
    expect(repository.updateCalls).toEqual([])
  })

  it('returns invalid-transition without updating an already active activity', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('active')
    await repository.add(activity)

    await expect(restoreActivityUseCase(repository, activity.id)).resolves.toEqual({
      kind: 'invalid-transition',
    })
    expect(repository.updateCalls).toEqual([])
  })

  it('returns not-found when persistence reports a concurrent deletion', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('active')
    repository.updateReturnsFalse = true
    await repository.add(activity)

    await expect(archiveActivityUseCase(repository, activity.id)).resolves.toEqual({
      kind: 'not-found' })
    expect(repository.updateCalls).toHaveLength(1)
  })

  it('propagates the original repository read error', async () => {
    const repository = new InMemoryActivityRepository()
    const repositoryError = new Error('Local storage is unavailable.')
    repository.getByIdError = repositoryError

    await expect(
      archiveActivityUseCase(repository, '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1'),
    ).rejects.toBe(repositoryError)
  })

  it('propagates the original repository update error', async () => {
    const repository = new InMemoryActivityRepository()
    const activity = createActivity('active')
    const repositoryError = new Error('Local storage is unavailable.')
    repository.updateError = repositoryError
    await repository.add(activity)

    await expect(archiveActivityUseCase(repository, activity.id)).rejects.toBe(repositoryError)
  })
})
