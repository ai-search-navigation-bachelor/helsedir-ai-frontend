import { useState, useEffect } from 'react'
import { Search as SearchComponent } from '@digdir/designsystemet-react'

interface SearchFormProps {
  initialValue: string
  onSubmit: (query: string) => void
  onClear?: () => void
  placeholder?: string
}

export function SearchForm({ 
  initialValue, 
  onSubmit, 
  onClear,
  placeholder = 'Søk etter innhold…' 
}: SearchFormProps) {
  const [inputValue, setInputValue] = useState(initialValue)

  // Sync input with initial value when it changes
  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  function handleClear(e: React.MouseEvent) {
    e.preventDefault()
    setInputValue('')
    onClear?.()
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
      <SearchComponent>
        <SearchComponent.Input
          name="query"
          aria-label="Søk"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <SearchComponent.Clear
          aria-label="Tøm"
          onClick={handleClear}
        />
        <SearchComponent.Button type="submit" variant="secondary">
          Søk
        </SearchComponent.Button>
      </SearchComponent>
    </form>
  )
}
