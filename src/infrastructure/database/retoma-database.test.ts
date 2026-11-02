import { afterEach, describe, expect, it } from 'vitest'
import { activitySchema, type Activity } from '../../domain/models/activity'
import { RetomaDatabase } from './retoma-database'

let databaseSequence = 0
let testDatabases: RetomaDatabase[] = []

function createTestDatabase(): RetomaDatabase {
  databaseSequence += 1

  const database = new RetomaDatabase(`retoma-test-${databaseSequence}`)
  testDatabases.push(database)

  return database
}

function createActivity(overrides: Partial<Activity> = {}): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status: 'active',
    createdAt: new Date('2026-11-02T12:00:00.000Z'),
    updatedAt: new Date('2026-11-02T13:00:00.000Z'),
    ...overrides,
  })
}

afterEach(async () => {
  await Promise.all(testDatabases.map((database) => database.delete()))
  testDatabases.forEach((database) => database.close())
  testDatabases = []
})

describe('RetomaDatabase', () => {
  it('creates and opens an activities database', async () => {
    const database = createTestDatabase()

    await database.open()

    expect(database.isOpen()).toBe(true)
    expect(database.tables.map((table) => table.name)).toContain('activities')
  })

  it('uses id as the primary key and indexes status and updatedAt', () => {
    const database = createTestDatabase()
    const { primKey, indexes } = database.activities.schema

    expect(primKey.keyPath).toBe('id')
    expect(indexes.map((index) => index.name)).toEqual(
      expect.arrayContaining(['status', 'updatedAt']),
    )
  })

  it('writes and reads an activity with Date values intact', async () => {
    const database = createTestDatabase()
    const activity = createActivity()

    await database.activities.add(activity)
    const storedActivity = await database.activities.get(activity.id)

    expect(storedActivity).toEqual(activity)
    expect(storedActivity?.createdAt).toBeInstanceOf(Date)
    expect(storedActivity?.updatedAt).toBeInstanceOf(Date)
  })

  it('stores an activity without an optional resume note', async () => {
    const database = createTestDatabase()
    const activity = createActivity()
    const activityWithoutNote = activitySchema.parse({
      id: activity.id,
      title: activity.title,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    })

    await database.activities.add(activityWithoutNote)
    const storedActivity = await database.activities.get(activityWithoutNote.id)

    expect(storedActivity?.resumeNote).toBeUndefined()
  })

  it('keeps data isolated between database names', async () => {
    const firstDatabase = createTestDatabase()
    const secondDatabase = createTestDatabase()

    await firstDatabase.activities.add(createActivity())

    expect(await firstDatabase.activities.count()).toBe(1)
    expect(await secondDatabase.activities.count()).toBe(0)
  })

  it('cleans a deleted test database before it is reopened', async () => {
    const database = createTestDatabase()
    const databaseName = database.name

    await database.activities.add(createActivity())
    await database.delete()

    const reopenedDatabase = new RetomaDatabase(databaseName)
    testDatabases.push(reopenedDatabase)

    expect(await reopenedDatabase.activities.count()).toBe(0)
  })
})
