import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heading,
  Paragraph,
  Search as SearchComponent,
} from '@digdir/designsystemet-react'
import { colors } from '../styles/dsTokens'

export function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/search?searchquery=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div 
      style={{ 
        backgroundColor: colors.headerBg,
        padding: '2rem 1rem',
        minHeight: '200px',
        borderBottomRightRadius: '50px',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Heading 
          level={1} 
          data-size='xl' 
          style={{ 
            marginBottom: '1rem',
            textAlign: 'center'
          }}
        >
          Søk i Helsedirektoratets innhold
        </Heading>
        <Paragraph 
          style={{ 
            marginBottom: '2rem', 
            color: '#666',
            textAlign: 'center'
          }}
        >
          Søk etter retningslinjer, pakkeforløp, diagnoser og annet helsefaglig innhold.
        </Paragraph>
        
        <form onSubmit={onSubmit}>
          <SearchComponent>
            <SearchComponent.Input
              aria-label='Søk'
              placeholder='Søk etter innhold…'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchComponent.Clear
              aria-label='Tøm'
              onClick={(e) => {
                e.preventDefault()
                setQuery('')
              }}
            />
            <SearchComponent.Button type='submit' variant='secondary'>
              Søk
            </SearchComponent.Button>
          </SearchComponent>
        </form>
      </div>
    </div>
  )
}
