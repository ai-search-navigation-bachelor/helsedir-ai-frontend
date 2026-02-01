import { Outlet, useLocation } from 'react-router-dom'

import { CardBlock, SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'

export function AppLayout() {
  const location = useLocation()
  const isHome = location.pathname === '/'

  return (
    <>
      <SkipLink href='#main-content'>Hopp til hovedinnhold</SkipLink>
      <AppHeader />
      {!isHome && (
        <main id='main-content'>
          <Outlet />
        </main>
      )}
      {isHome && (
        <main id='main-content'>
          <Outlet />
        </main>
      )}
    </>
  )
}
