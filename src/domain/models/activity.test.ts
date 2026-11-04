import { describe, expect, it } from 'vitest'
import { activityEditableFieldsSchema, activitySchema } from './activity'

const createActivityInput = () => ({
  id: '9a2b4e6c-3f85-4eaa-9e1d-5e1e675344a1',
  title: 'Learn watercolour painting',
  resumeNote: 'Practice wet-on-wet skies.',
  status: 'active' as const,
  createdAt: new Date('2026-11-02T12:00:00.000Z'),
  updatedAt: new Date('2026-11-02T13:00:00.000Z'),
})

describe('activitySchema', () => {
  it('accepts a valid activity', () => {
    const activity = createActivityInput()

    expect(activitySchema.parse(activity)).toEqual(activity)
  })

  it('rejects an invalid UUID', () => {
    expect(
      activitySchema.safeParse({ ...createActivityInput(), id: 'not-a-uuid' }).success,
    ).toBe(false)
  })

  it('rejects an empty title', () => {
    expect(
      activitySchema.safeParse({ ...createActivityInput(), title: '' }).success,
    ).toBe(false)
  })

  it('rejects a title made only of spaces', () => {
    expect(
      activitySchema.safeParse({ ...createActivityInput(), title: '   ' }).success,
    ).toBe(false)
  })

  it('rejects a title longer than 100 characters', () => {
    expect(
      activitySchema.safeParse({
        ...createActivityInput(),
        title: 'a'.repeat(101),
      }).success,
    ).toBe(false)
  })

  it('trims a valid title', () => {
    const activity = activitySchema.parse({
      ...createActivityInput(),
      title: '  Learn watercolour painting  ',
    })

    expect(activity.title).toBe('Learn watercolour painting')
  })

  it('rejects an invalid status', () => {
    expect(
      activitySchema.safeParse({ ...createActivityInput(), status: 'paused' }).success,
    ).toBe(false)
  })

  it('accepts an absent optional resume note', () => {
    const activity = createActivityInput()
    const activityWithoutNote = {
      id: activity.id,
      title: activity.title,
      status: activity.status,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }

    expect(activitySchema.parse(activityWithoutNote).resumeNote).toBeUndefined()
  })

  it('trims a valid resume note', () => {
    const activity = activitySchema.parse({
      ...createActivityInput(),
      resumeNote: '  Practice wet-on-wet skies.  ',
    })

    expect(activity.resumeNote).toBe('Practice wet-on-wet skies.')
  })

  it('rejects a resume note longer than 500 characters', () => {
    expect(
      activitySchema.safeParse({
        ...createActivityInput(),
        resumeNote: 'a'.repeat(501),
      }).success,
    ).toBe(false)
  })

  it('accepts valid Date objects', () => {
    const activity = activitySchema.parse(createActivityInput())

    expect(activity.createdAt).toBeInstanceOf(Date)
    expect(activity.updatedAt).toBeInstanceOf(Date)
  })

  it('rejects invalid Date objects', () => {
    expect(
      activitySchema.safeParse({
        ...createActivityInput(),
        createdAt: new Date('invalid'),
      }).success,
    ).toBe(false)
  })

  it('rejects date strings', () => {
    expect(
      activitySchema.safeParse({
        ...createActivityInput(),
        createdAt: '2026-11-02T12:00:00.000Z',
        updatedAt: '2026-11-02T13:00:00.000Z',
      }).success,
    ).toBe(false)
  })
})

describe('activityEditableFieldsSchema', () => {
  it('accepts editable input without id, status, or dates', () => {
    expect(
      activityEditableFieldsSchema.parse({
        title: 'Learn watercolour painting',
      }),
    ).toEqual({ title: 'Learn watercolour painting' })
  })

  it('normalizes title and resume note', () => {
    expect(
      activityEditableFieldsSchema.parse({
        title: '  Learn watercolour painting  ',
        resumeNote: '  Practice wet-on-wet skies.  ',
      }),
    ).toEqual({
      title: 'Learn watercolour painting',
      resumeNote: 'Practice wet-on-wet skies.',
    })
  })

  it('rejects empty, whitespace-only, and overlong titles', () => {
    expect(activityEditableFieldsSchema.safeParse({ title: '' }).success).toBe(false)
    expect(activityEditableFieldsSchema.safeParse({ title: '   ' }).success).toBe(false)
    expect(activityEditableFieldsSchema.safeParse({ title: 'a'.repeat(101) }).success).toBe(
      false,
    )
  })

  it('accepts an absent note and rejects an overlong note', () => {
    expect(activityEditableFieldsSchema.parse({ title: 'Learn watercolour painting' })).toEqual({
      title: 'Learn watercolour painting',
    })
    expect(
      activityEditableFieldsSchema.safeParse({
        title: 'Learn watercolour painting',
        resumeNote: 'a'.repeat(501),
      }).success,
    ).toBe(false)
  })
})
