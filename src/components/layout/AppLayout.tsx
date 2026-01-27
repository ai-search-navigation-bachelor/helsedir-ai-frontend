import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { CardBlock, SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'
import { Home } from '../../pages/Home'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const [isSearchVisible, setIsSearchVisible] = useState(isHome)

  useEffect(() => {
    // Oppdater søkebar synlighet basert på side
    setIsSearchVisible(isHome)
  }, [isHome])

  useEffect(() => {
    const handleSearchToggle = () => {
      setIsSearchVisible((prev) => !prev)
    }
    const handleSearchClose = () => {
      setIsSearchVisible(false)
    }
    window.addEventListener('toggleSearch', handleSearchToggle)
    window.addEventListener('closeSearch', handleSearchClose)
    return () => {
      window.removeEventListener('toggleSearch', handleSearchToggle)
      window.removeEventListener('closeSearch', handleSearchClose)
    }
  }, [])

  return (
    <>
      <SkipLink href='#main-content'>Hopp til hovedinnhold</SkipLink>
      <AppHeader />
      {isSearchVisible && !isHome && <Home isSearchBar />}
      {!isHome && (
        <CardBlock
          asChild
          style={{
            maxWidth: '1200px',
            marginInline: 'auto',
            padding: '1.5rem 1rem',
          }}
        >
          <main id='main-content'>
            <Outlet />
          </main>
        </CardBlock>
      )}
      {isHome && (
        <main id='main-content'>
          <Outlet />
        </main>
      )}
    </>
  )
}
