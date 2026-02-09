import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { Home } from '../../pages/Home'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearchPage = location.pathname === '/search'
  const [isSearchVisible, setIsSearchVisible] = useState(isHome || isSearchPage)

  useEffect(() => {
    // Open search by default on home and search page, close on other pages.
    setIsSearchVisible(isHome || isSearchPage)
  }, [isHome, isSearchPage])

  useEffect(() => {
    const isSearchPinnedOpen = isHome || isSearchPage

    const handleSearchToggle = () => {
      if (isSearchPinnedOpen) {
        setIsSearchVisible(true)
        return
      }
      setIsSearchVisible((prev) => !prev)
    }
    const handleSearchClose = () => {
      if (isSearchPinnedOpen) return
      setIsSearchVisible(false)
    }
    window.addEventListener('toggleSearch', handleSearchToggle)
    window.addEventListener('closeSearch', handleSearchClose)
    return () => {
      window.removeEventListener('toggleSearch', handleSearchToggle)
      window.removeEventListener('closeSearch', handleSearchClose)
    }
  }, [isHome, isSearchPage])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SkipLink href='#main-content'>Hopp til hovedinnhold</SkipLink>
      <AppHeader />
      {isSearchVisible && !isHome && <Home isSearchBar />}
      {!isHome && (
        <main id='main-content' style={{ overflow: 'visible', flex: 1 }}>
          <Outlet />
        </main>
      )}
      {isHome && (
        <main id='main-content' className='page-shell__main page-shell__main--home' style={{ overflow: 'visible', flex: 1 }}>
          <Outlet />
        </main>
      )}
      <AppFooter />
    </div>
  )
}
