import { type FormEvent, forwardRef } from 'react'
import { Label, Search as SearchComponent } from '@digdir/designsystemet-react'
import { colors } from '../../styles/dsTokens'

interface HomeSearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const HomeSearchForm = forwardRef<HTMLInputElement, HomeSearchFormProps>(
  ({ query, onQueryChange, onSubmit }, ref) => {
    return (
      <div 
        style={{ 
          backgroundColor: colors.headerBg,
          padding: '2rem 1rem',
          minHeight: '100px',
          borderBottomRightRadius: '50px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Label htmlFor="home-search" style={{ fontWeight: 'bold' }}>
            Hva leter du etter?
          </Label>
          
          <form onSubmit={onSubmit}>
            <SearchComponent>
              <SearchComponent.Input
                ref={ref}
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
)

HomeSearchForm.displayName = 'HomeSearchForm'
