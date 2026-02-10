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
  const isSearchPinnedOpen = isHome || isSearchPage
  const layoutKey = isSearchPinnedOpen ? 'search-pinned' : 'search-free'

  return (
    <AppLayoutInner
      key={layoutKey}
      isHome={isHome}
      isSearchPinnedOpen={isSearchPinnedOpen}
    />
  )
}

type AppLayoutInnerProps = {
  isHome: boolean
  isSearchPinnedOpen: boolean
}

function AppLayoutInner({ isHome, isSearchPinnedOpen }: AppLayoutInnerProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(isSearchPinnedOpen)

  useEffect(() => {
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
  }, [isSearchPinnedOpen])

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
