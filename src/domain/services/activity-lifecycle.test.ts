import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  activityEditableFieldsSchema,
  activitySchema,
  type Activity,
} from '../models/activity'
import { createActivity, updateActivity } from './activity-lifecycle'

const generatedId = 'c36c7f70-9bbf-47b5-8262-7e8f4aa4c4d0'

const createExistingActivity = (): Activity =>
  activitySchema.parse({
    id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
    title: 'Learn watercolour painting',
    resumeNote: 'Practice wet-on-wet skies.',
    status: 'archived',
    createdAt: new Date('2026-11-01T12:00:00.000Z'),
    updatedAt: new Date('2026-11-01T13:00:00.000Z'),
  })

describe('activity lifecycle operations', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00.000Z'))
    vi.spyOn(globalThis.crypto, 'randomUUID').mockReturnValue(generatedId)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('createActivity', () => {
    it('generates an ID, starts active, and creates independent coherent dates', () => {
      const activity = createActivity({ title: 'Learn watercolour painting' })

      expect(activity.id).toBe(generatedId)
      expect(activity.status).toBe('active')
      expect(activity.createdAt).toEqual(new Date('2026-11-02T12:00:00.000Z'))
      expect(activity.updatedAt).toEqual(activity.createdAt)
      expect(activity.createdAt).not.toBe(activity.updatedAt)
    })

    it('normalizes the title and resume note', () => {
      const editableFields = activityEditableFieldsSchema.parse({
        title: '  Learn watercolour painting  ',
        resumeNote: '  Practice wet-on-wet skies.  ',
      })
      const activity = createActivity(editableFields)

      expect(activity.title).toBe('Learn watercolour painting')
      expect(activity.resumeNote).toBe('Practice wet-on-wet skies.')
    })

    it('rejects invalid editable fields', () => {
      expect(() => createActivity({ title: '   ' })).toThrow()
      expect(() => createActivity({ title: 'Valid title', resumeNote: 'a'.repeat(501) })).toThrow()
    })
  })

  describe('updateActivity', () => {
    it('updates the title', () => {
      const updated = updateActivity(createExistingActivity(), {
        title: 'Learn gouache painting',
        resumeNote: 'Practice wet-on-wet skies.',
      })

      expect(updated.title).toBe('Learn gouache painting')
    })

    it('updates and normalizes the resume note', () => {
      const updated = updateActivity(createExistingActivity(), {
        title: 'Learn watercolour painting',
        resumeNote: '  Mix a limited palette.  ',
      })

      expect(updated.resumeNote).toBe('Mix a limited palette.')
    })

    it('preserves immutable fields and refreshes updatedAt', () => {
      const existing = createExistingActivity()
      vi.setSystemTime(new Date('2026-11-02T15:00:00.000Z'))

      const updated = updateActivity(existing, {
        title: 'Learn gouache painting',
        resumeNote: existing.resumeNote,
      })

      expect(updated.id).toBe(existing.id)
      expect(updated.status).toBe(existing.status)
      expect(updated.createdAt).toEqual(existing.createdAt)
      expect(updated.createdAt).not.toBe(existing.createdAt)
      expect(updated.updatedAt).toEqual(new Date('2026-11-02T15:00:00.000Z'))
    })

    it('clears the resume note when it is omitted from the complete editable state', () => {
      const updated = updateActivity(createExistingActivity(), {
        title: 'Learn watercolour painting',
      })

      expect(updated.resumeNote).toBeUndefined()
    })

    it('rejects invalid editable fields', () => {
      const existing = createExistingActivity()

      expect(() => updateActivity(existing, { title: '   ' })).toThrow()
      expect(() =>
        updateActivity(existing, {
          title: 'Valid title',
          resumeNote: 'a'.repeat(501),
        }),
      ).toThrow()
    })

    it('does not mutate the original activity', () => {
      const existing = createExistingActivity()
      const originalTitle = existing.title
      const originalNote = existing.resumeNote
      const originalUpdatedAt = new Date(existing.updatedAt)

      const updated = updateActivity(existing, {
        title: 'Learn gouache painting',
        resumeNote: 'Mix a limited palette.',
      })

      expect(existing.title).toBe(originalTitle)
      expect(existing.resumeNote).toBe(originalNote)
      expect(existing.updatedAt).toEqual(originalUpdatedAt)
      expect(updated).not.toBe(existing)
    })
  })
})
