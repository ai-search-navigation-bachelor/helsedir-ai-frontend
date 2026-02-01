import { type FormEvent } from 'react'
import { Label, Search as SearchComponent } from '@digdir/designsystemet-react'
import { colors } from '../../styles/dsTokens'

interface HomeSearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function HomeSearchForm({ query, onQueryChange, onSubmit }: HomeSearchFormProps) {
  return (
    <div
      className="px-4 py-8 min-h-[100px] rounded-br-[50px]"
      style={{ backgroundColor: colors.headerBg }}
    >
      <div className="max-w-screen-xl mx-auto">
        <Label htmlFor="home-search" style={{ fontWeight: 'bold' }}>
          Hva leter du etter?
        </Label>
        
        <form onSubmit={onSubmit}>
          <SearchComponent>
            <SearchComponent.Input
              id="home-search"
              aria-label="Søk"
              placeholder="Søk etter innhold…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
            <SearchComponent.Clear
              aria-label="Tøm"
              onClick={(e) => {
                e.preventDefault()
                onQueryChange('')
              }}
            />
            <SearchComponent.Button type="submit" variant="secondary">
              Søk
            </SearchComponent.Button>
          </SearchComponent>
        </form>
      </div>
    </div>
  )
}
