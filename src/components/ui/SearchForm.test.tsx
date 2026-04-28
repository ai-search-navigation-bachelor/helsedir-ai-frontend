import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from './SearchForm'
import { useSearchSuggestionsQuery } from '../../hooks/queries/useSearchSuggestionsQuery'

vi.mock('../../hooks/queries/useSearchSuggestionsQuery', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useSearchSuggestionsQuery: vi.fn().mockReturnValue({ data: undefined } as any),
}))

const mockSuggestions = [
  { id: '1', title: 'Diabetes type 2', path: '/diabetes-type-2' },
  { id: '2', title: 'Diabetes type 1', path: '/diabetes-type-1' },
]

function renderSearchForm(overrides: Partial<React.ComponentProps<typeof SearchForm>> = {}) {
  const props = {
    query: '',
    onQueryChange: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onClear: vi.fn(),
    onSuggestionSelect: vi.fn(),
    ...overrides,
  }
  render(<SearchForm {...props} />)
  return props
}

describe('SearchForm', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSearchSuggestionsQuery).mockReturnValue({ data: undefined } as any)
    vi.clearAllMocks()
  })

  it('renders the search input', () => {
    renderSearchForm()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders the label "Hva leter du etter?"', () => {
    renderSearchForm()
    expect(screen.getByText('Hva leter du etter?')).toBeInTheDocument()
  })

  it('calls onQueryChange when the user types', async () => {
    const user = userEvent.setup()
    const { onQueryChange } = renderSearchForm()
    await user.type(screen.getByRole('combobox'), 'diabetes')
    expect(onQueryChange).toHaveBeenCalled()
  })

  it('does not show the clear button when query is empty', () => {
    renderSearchForm({ query: '' })
    expect(screen.queryByLabelText('Tom')).not.toBeInTheDocument()
  })

  it('shows the clear button when query is non-empty', () => {
    renderSearchForm({ query: 'diabetes' })
    expect(screen.getByLabelText('Tom')).toBeInTheDocument()
  })

  it('calls onClear when the clear button is clicked', async () => {
    const user = userEvent.setup()
    const { onClear } = renderSearchForm({ query: 'diabetes' })
    await user.click(screen.getByLabelText('Tom'))
    expect(onClear).toHaveBeenCalled()
  })

  it('shows "Søk" text on the submit button when query is non-empty', () => {
    renderSearchForm({ query: 'diabetes' })
    expect(screen.getByText('Søk')).toBeInTheDocument()
  })
})

describe('SearchForm keyboard navigation', () => {
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(useSearchSuggestionsQuery).mockReturnValue({ data: { suggestions: mockSuggestions } } as any)
  })

  it('shows the suggestions listbox after typing', async () => {
    const user = userEvent.setup()
    renderSearchForm({ query: 'diabetes' })
    await user.type(screen.getByRole('combobox'), 'x')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
  })

  it('ArrowDown sets focus to the first suggestion', async () => {
    const user = userEvent.setup()
    renderSearchForm({ query: 'diabetes' })
    const input = screen.getByRole('combobox')
    await user.type(input, 'x')
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('option-0'))
  })

  it('ArrowDown wraps from last suggestion back to first', async () => {
    const user = userEvent.setup()
    renderSearchForm({ query: 'diabetes' })
    const input = screen.getByRole('combobox')
    await user.type(input, 'x')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('option-0'))
  })

  it('Escape closes the suggestions listbox', async () => {
    const user = userEvent.setup()
    renderSearchForm({ query: 'diabetes' })
    await user.type(screen.getByRole('combobox'), 'x')
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('Enter on an active suggestion calls onSuggestionSelect with correct id and path', async () => {
    const user = userEvent.setup()
    const { onSuggestionSelect } = renderSearchForm({ query: 'diabetes' })
    const input = screen.getByRole('combobox')
    await user.type(input, 'x')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    expect(onSuggestionSelect).toHaveBeenCalledWith('1', '/diabetes-type-2')
  })
})
