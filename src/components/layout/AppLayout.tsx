import type { ReactNode } from 'react'

import { Divider, CardBlock, SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'
import { AppSearch } from '../ui/AppSearch'

export type AppLayoutProps = {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
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
        <main id='main-content'>{children}</main>
      </CardBlock>
      <CardBlock
        style={{
          maxWidth: '1200px',
          marginInline: 'auto',
          padding: '0 1rem 1.5rem',
        }}
      >
        <AppSearch placeholder='Søk etter innhold…' />
      </CardBlock>
    </>
  )
}
