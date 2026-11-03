import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activitySchema, type Activity, type ActivityStatus } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { createActivityUseCases } from './activity-use-cases'

class InMemoryActivityRepository implements ActivityRepository {
  readonly activities = new Map<string, Activity>()
  addError: Error | undefined
  getByIdError: Error | undefined
  updateError: Error | undefined

  async add(activity: Activity): Promise<void> {
    if (this.addError) {
      throw this.addError
    }

    if (this.activities.has(activity.id)) {
      throw new Error('An activity with this ID already exists.')
    }

    this.activities.set(activity.id, cloneActivity(activity))
  }

  async getById(id: string): Promise<Activity | undefined> {
    if (this.getByIdError) {
      throw this.getByIdError
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

function createArchivedActivity(): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    status: 'archived',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

describe('createActivityUseCases', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-06T10:00:00.000Z'))
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(
      'c36c7f70-9bbf-47b5-8262-7e8f4aa4c4d0',
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('connects all operations to the same repository instance', async () => {
    const repository = new InMemoryActivityRepository()
    const activityUseCases = createActivityUseCases(repository)

    expect(Object.keys(activityUseCases).sort()).toEqual([
      'archive',
      'create',
      'get',
      'list',
      'restore',
      'update',
    ])

    const createdActivity = await activityUseCases.create({
      title: '  Learn watercolour painting  ',
      resumeNote: '  Practice wet-on-wet skies.  ',
    })

    await expect(activityUseCases.get(createdActivity.id)).resolves.toEqual(createdActivity)
    await expect(activityUseCases.list()).resolves.toEqual([createdActivity])

    const updateResult = await activityUseCases.update(createdActivity.id, {
      title: 'Learn gouache painting',
      resumeNote: 'Mix a limited palette.',
    })
    expect(updateResult.kind).toBe('updated')

    const archiveResult = await activityUseCases.archive(createdActivity.id)
    expect(archiveResult.kind).toBe('updated')
    await expect(activityUseCases.list({ status: 'archived' })).resolves.toEqual([
      expect.objectContaining({
        id: createdActivity.id,
        status: 'archived',
        title: 'Learn gouache painting',
      }),
    ])

    const restoreResult = await activityUseCases.restore(createdActivity.id)
    expect(restoreResult.kind).toBe('updated')
    await expect(activityUseCases.get(createdActivity.id)).resolves.toEqual(
      expect.objectContaining({
        id: createdActivity.id,
        status: 'active',
        title: 'Learn gouache painting',
        resumeNote: 'Mix a limited palette.',
      }),
    )
  })

  it('preserves discriminated outcomes from update and status operations', async () => {
    const repository = new InMemoryActivityRepository()
    const activityUseCases = createActivityUseCases(repository)

    await expect(
      activityUseCases.update('00000000-0000-4000-8000-000000000000', {
        title: 'Learn gouache painting',
      }),
    ).resolves.toEqual({ kind: 'not-found' })

    const archivedActivity = createArchivedActivity()
    await repository.add(archivedActivity)

    await expect(activityUseCases.archive(archivedActivity.id)).resolves.toEqual({
      kind: 'invalid-transition',
    })
    await expect(
      activityUseCases.restore('00000000-0000-4000-8000-000000000000'),
    ).resolves.toEqual({ kind: 'not-found' })
  })

  it('propagates repository errors without hiding their cause', async () => {
    const repository = new InMemoryActivityRepository()
    const activityUseCases = createActivityUseCases(repository)
    const addError = new Error('Local storage is unavailable.')
    repository.addError = addError

    await expect(
      activityUseCases.create({ title: 'Learn watercolour painting' }),
    ).rejects.toBe(addError)

    const getByIdError = new Error('Local storage is unavailable.')
    repository.getByIdError = getByIdError

    await expect(
      activityUseCases.get('9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1'),
    ).rejects.toBe(getByIdError)
  })
})
