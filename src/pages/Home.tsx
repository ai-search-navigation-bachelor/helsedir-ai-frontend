import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeSearchForm } from '../components/ui/HomeSearchForm'

export function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate(`/search?query=${encodeURIComponent(trimmed)}`)
  }

  return (
    <HomeSearchForm 
      query={query}
      onQueryChange={setQuery}
      onSubmit={onSubmit}
    />
  )
}
