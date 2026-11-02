import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Retoma dashboard empty state', () => {
    render(<App />)

    const navigation = screen.getByRole('navigation', {
      name: 'Primary navigation',
    })

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Make space to pick things back up.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Nothing is waiting yet.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add activity' })).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(navigation.querySelectorAll('a')).toHaveLength(1)
    expect(screen.queryByRole('link', { name: 'All activities' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Archived' })).not.toBeInTheDocument()
    expect(screen.getByText('All activities')).toBeInTheDocument()
    expect(screen.getByText('Archived')).toBeInTheDocument()
  })
})
