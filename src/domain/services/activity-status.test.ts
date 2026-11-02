import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { activitySchema, type Activity } from '../models/activity'
import { archiveActivity, restoreActivity } from './activity-status'

function createActivity(status: Activity['status']): Activity {
  return activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status,
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })
}

function expectSuccessfulTransition(
  result: ReturnType<typeof archiveActivity>,
): Activity {
  expect(result.kind).toBe('success')

  if (result.kind !== 'success') {
    throw new Error('Expected a successful status transition.')
  }

  return result.activity
}

describe('activity status transitions', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-04T15:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('archiveActivity', () => {
    it('archives an active activity while preserving its immutable fields', () => {
      const activity = createActivity('active')
      const archivedActivity = expectSuccessfulTransition(archiveActivity(activity))

      expect(archivedActivity).toEqual({
        id: activity.id,
        title: activity.title,
        resumeNote: activity.resumeNote,
        status: 'archived',
        createdAt: activity.createdAt,
        updatedAt: new Date('2026-11-04T15:00:00.000Z'),
      })
    })

    it('uses independent Date objects without mutating the original activity', () => {
      const activity = createActivity('active')
      const originalCreatedAt = new Date(activity.createdAt)
      const originalUpdatedAt = new Date(activity.updatedAt)
      const archivedActivity = expectSuccessfulTransition(archiveActivity(activity))

      expect(archivedActivity.createdAt).not.toBe(activity.createdAt)
      expect(archivedActivity.updatedAt).not.toBe(activity.updatedAt)
      expect(activity).toEqual({
        id: activity.id,
        title: 'Learn watercolour painting',
        resumeNote: 'Practice wet-on-wet skies.',
        status: 'active',
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      })
    })

    it('returns invalid-transition for an activity that is already archived', () => {
      expect(archiveActivity(createActivity('archived'))).toEqual({
        kind: 'invalid-transition',
      })
    })
  })

  describe('restoreActivity', () => {
    it('restores an archived activity while preserving its immutable fields', () => {
      const activity = createActivity('archived')
      const restoredActivity = expectSuccessfulTransition(restoreActivity(activity))

      expect(restoredActivity).toEqual({
        id: activity.id,
        title: activity.title,
        resumeNote: activity.resumeNote,
        status: 'active',
        createdAt: activity.createdAt,
        updatedAt: new Date('2026-11-04T15:00:00.000Z'),
      })
    })

    it('uses independent Date objects without mutating the original activity', () => {
      const activity = createActivity('archived')
      const originalCreatedAt = new Date(activity.createdAt)
      const originalUpdatedAt = new Date(activity.updatedAt)
      const restoredActivity = expectSuccessfulTransition(restoreActivity(activity))

      expect(restoredActivity.createdAt).not.toBe(activity.createdAt)
      expect(restoredActivity.updatedAt).not.toBe(activity.updatedAt)
      expect(activity).toEqual({
        id: activity.id,
        title: 'Learn watercolour painting',
        resumeNote: 'Practice wet-on-wet skies.',
        status: 'archived',
        createdAt: originalCreatedAt,
        updatedAt: originalUpdatedAt,
      })
    })

    it('returns invalid-transition for an activity that is already active', () => {
      expect(restoreActivity(createActivity('active'))).toEqual({
        kind: 'invalid-transition',
      })
    })
  })
})
