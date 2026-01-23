import type { ReactNode } from 'react'

import { Divider, CardBlock, SkipLink } from '@digdir/designsystemet-react'

import { AppHeader } from './AppHeader'

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
    </>
  )
}
