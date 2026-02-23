import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heading, Paragraph, Search } from '@digdir/designsystemet-react'
import type { ContentCategoryGroup } from '../constants/contentRoutes'

interface CategoryLandingPageProps {
  group: ContentCategoryGroup
}

export function CategoryLandingPage({ group }: CategoryLandingPageProps) {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(
      `/search?query=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(group.searchCategoryId)}`,
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-12 pt-8 pb-12">
      <Heading level={1} data-size="xl" style={{ marginBottom: '0.5rem' }}>
        {group.label}
      </Heading>
      <Paragraph data-size="md" style={{ marginBottom: '2rem', color: '#444' }}>
        {group.subtitle}
      </Paragraph>

      <form onSubmit={handleSubmit} style={{ maxWidth: '36rem' }}>
        <Search>
          <Search.Input
            id={`search-${group.pathPrefix}`}
            placeholder={`Søk i ${group.label.toLowerCase()}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search.Clear onClick={() => setQuery('')} />
          <Search.Button type="submit">Søk</Search.Button>
        </Search>
      </form>
    </div>
  )
}
