import { Outlet } from 'react-router-dom'

import { Divider, CardBlock, SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'

export function AppLayout() {
  return (
    <>
      <SkipLink href='#main-content'>Hopp til hovedinnhold</SkipLink>
      <AppHeader />
      <Divider />
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
    </>
  )
}
