import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'
import { AppFooter } from './AppFooter'
import { SearchShell } from '../ui'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'
  const isSearchPage = location.pathname === '/search'
  const isSearchPinnedOpen = isHome || isSearchPage
  const layoutKey = isSearchPinnedOpen ? 'search-pinned' : 'search-free'

  return (
    <AppLayoutInner
      key={layoutKey}
      isSearchPinnedOpen={isSearchPinnedOpen}
    />
  )
}

type AppLayoutInnerProps = {
  isSearchPinnedOpen: boolean
}

function AppLayoutInner({ isSearchPinnedOpen }: AppLayoutInnerProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(isSearchPinnedOpen)
  const [searchFocusRequest, setSearchFocusRequest] = useState(0)

  useEffect(() => {
    const handleSearchToggle = () => {
      setSearchFocusRequest((prev) => prev + 1)
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
      <AppHeader searchVisible={isSearchVisible} />
      {isSearchVisible && <SearchShell focusRequest={searchFocusRequest} />}
      <main id='main-content' style={{ overflow: 'visible', flex: 1 }}>
        <Outlet />
      </main>
      <AppFooter />
    </div>
  )
}
