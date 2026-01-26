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
