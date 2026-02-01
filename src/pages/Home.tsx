import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeSearchForm } from '../components/ui/HomeSearchForm'

export function Home() {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  // Add home-page class to body on mount, remove on unmount
  useEffect(() => {
    document.body.classList.add('home-page')
    return () => {
      document.body.classList.remove('home-page')
    }
  }, [])

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
