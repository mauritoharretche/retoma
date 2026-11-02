import { afterEach, describe, expect, it } from 'vitest'
import { activitySchema, type Activity } from '../../domain/models/activity'
import type { ActivityRepository } from '../../domain/repositories/activity-repository'
import { DexieActivityRepository } from './dexie-activity-repository'
import { RetomaDatabase } from './retoma-database'

let activitySequence = 0
let databaseSequence = 0
let testDatabases: RetomaDatabase[] = []

function createTestDatabase(): RetomaDatabase {
  databaseSequence += 1

  const database = new RetomaDatabase(`retoma-repository-test-${databaseSequence}`)
  testDatabases.push(database)

  return database
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  activitySequence += 1

  return activitySchema.parse({
    id: `00000000-0000-4000-8000-${String(activitySequence).padStart(12, '0')}`,
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status: 'active',
    createdAt: new Date('2026-11-02T12:00:00.000Z'),
    updatedAt: new Date('2026-11-02T13:00:00.000Z'),
    ...overrides,
  })
}

function createRepository(): { database: RetomaDatabase; repository: ActivityRepository } {
  const database = createTestDatabase()

  return {
    database,
    repository: new DexieActivityRepository(database),
  }
}

afterEach(async () => {
  await Promise.all(testDatabases.map((database) => database.delete()))
  testDatabases.forEach((database) => database.close())
  testDatabases = []
})

describe('DexieActivityRepository', () => {
  it('adds and retrieves an activity while preserving Date values', async () => {
    const { repository } = createRepository()
    const activity = createActivity()

    await repository.add(activity)
    const storedActivity = await repository.getById(activity.id)

    expect(storedActivity).toEqual(activity)
    expect(storedActivity?.createdAt).toBeInstanceOf(Date)
    expect(storedActivity?.updatedAt).toBeInstanceOf(Date)
  })

  it('does not mutate an activity passed to add', async () => {
    const { repository } = createRepository()
    const activity = createActivity()
    const originalActivity = {
      ...activity,
      createdAt: new Date(activity.createdAt),
      updatedAt: new Date(activity.updatedAt),
    }

    await repository.add(activity)

    expect(activity).toEqual(originalActivity)
  })

  it('rejects duplicate activity IDs without overwriting the existing record', async () => {
    const { repository } = createRepository()
    const activity = createActivity()

    await repository.add(activity)

    await expect(
      repository.add({ ...activity, title: 'A different title' }),
    ).rejects.toThrow()
    expect(await repository.getById(activity.id)).toEqual(activity)
  })

  it('stores an activity without an optional resume note', async () => {
    const { repository } = createRepository()
    const activity = createActivity()
    const activityWithoutNote = activitySchema.parse({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    })

    await repository.add(activityWithoutNote)

    expect((await repository.getById(activityWithoutNote.id))?.resumeNote).toBeUndefined()
  })

  it('returns undefined when an activity ID does not exist', async () => {
    const { repository } = createRepository()

    await expect(
      repository.getById('00000000-0000-4000-8000-000000000000'),
    ).resolves.toBeUndefined()
  })

  it('returns an empty list when no activities exist', async () => {
    const { repository } = createRepository()

    await expect(repository.getAll()).resolves.toEqual([])
  })

  it('returns all active and archived activities', async () => {
    const { repository } = createRepository()
    const activeActivity = createActivity()
    const archivedActivity = createActivity({ status: 'archived' })

    await repository.add(activeActivity)
    await repository.add(archivedActivity)

    const activities = await repository.getAll()

    expect(activities).toHaveLength(2)
    expect(activities).toEqual(expect.arrayContaining([activeActivity, archivedActivity]))
  })

  it('uses the status index to return only active activities', async () => {
    const { repository } = createRepository()
    const activeActivity = createActivity()
    const archivedActivity = createActivity({ status: 'archived' })

    await repository.add(activeActivity)
    await repository.add(archivedActivity)

    await expect(repository.getByStatus('active')).resolves.toEqual([activeActivity])
  })

  it('uses the status index to return only archived activities', async () => {
    const { repository } = createRepository()
    const activeActivity = createActivity()
    const archivedActivity = createActivity({ status: 'archived' })

    await repository.add(activeActivity)
    await repository.add(archivedActivity)

    await expect(repository.getByStatus('archived')).resolves.toEqual([archivedActivity])
  })

  it('returns an empty list when no activity has the requested status', async () => {
    const { repository } = createRepository()

    await expect(repository.getByStatus('archived')).resolves.toEqual([])
  })

  it('updates an existing activity by replacing the complete record', async () => {
    const { repository } = createRepository()
    const activity = createActivity()
    const updatedActivity = activitySchema.parse({
      ...activity,
      title: 'Learn gouache painting',
      resumeNote: 'Mix a limited palette.',
      updatedAt: new Date('2026-11-03T10:00:00.000Z'),
    })

    await repository.add(activity)

    await expect(repository.update(updatedActivity)).resolves.toBe(true)
    const storedActivity = await repository.getById(activity.id)

    expect(storedActivity).toEqual(updatedActivity)
    expect(storedActivity?.createdAt).toBeInstanceOf(Date)
    expect(storedActivity?.updatedAt).toBeInstanceOf(Date)
    expect(storedActivity?.createdAt).toEqual(activity.createdAt)
    expect(storedActivity?.updatedAt).toEqual(updatedActivity.updatedAt)
  })

  it('does not mutate an activity passed to update', async () => {
    const { repository } = createRepository()
    const activity = createActivity()
    const updatedActivity = activitySchema.parse({
      ...activity,
      title: 'Learn gouache painting',
      resumeNote: 'Mix a limited palette.',
      updatedAt: new Date('2026-11-03T10:00:00.000Z'),
    })
    const originalUpdatedActivity = {
      ...updatedActivity,
      createdAt: new Date(updatedActivity.createdAt),
      updatedAt: new Date(updatedActivity.updatedAt),
    }

    await repository.add(activity)
    await repository.update(updatedActivity)

    expect(updatedActivity).toEqual(originalUpdatedActivity)
  })

  it('returns false and does not create a missing activity during update', async () => {
    const { database, repository } = createRepository()

    await expect(repository.update(createActivity())).resolves.toBe(false)
    expect(await database.activities.count()).toBe(0)
  })

  it('removes a previous resume note when the replacement activity omits it', async () => {
    const { repository } = createRepository()
    const activity = createActivity()
    const replacementWithoutNote = activitySchema.parse({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: new Date('2026-11-03T10:00:00.000Z'),
    })

    await repository.add(activity)
    await repository.update(replacementWithoutNote)

    expect((await repository.getById(activity.id))?.resumeNote).toBeUndefined()
  })

  it('rejects invalid activities at the persistence boundary', async () => {
    const { repository } = createRepository()
    const invalidActivity = { ...createActivity(), title: '   ' }

    await expect(repository.add(invalidActivity)).rejects.toThrow()
    await expect(repository.update(invalidActivity)).rejects.toThrow()
  })
})
