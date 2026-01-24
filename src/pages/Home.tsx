import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading, Paragraph, Search } from '@digdir/designsystemet-react'

export function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      navigate(`/search?searchquery=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <>
      <Paragraph>
        Hva leter du etter?
      </Paragraph>

      <form onSubmit={handleSubmit}>
        <Search>
          <Search.Input
            aria-label='Søk'
            placeholder='Søk…'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search.Button type='submit' variant='secondary'>
            Søk
          </Search.Button>
        </Search>
      </form>
    </>
  )
}
