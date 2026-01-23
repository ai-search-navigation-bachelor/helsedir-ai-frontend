import {
  Button,
  CardBlock,
  Link,
} from '@digdir/designsystemet-react'

import { colors } from '../../styles/dsTokens'

import { IoSearch, IoMenu } from 'react-icons/io5'

export function AppHeader() {
  return (
    <>
      <div style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}>
        <header>
          <CardBlock style={{ padding: '2rem 1rem' }}>
            <div
              style={{
                maxWidth: '1100px',
                marginInline: 'auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.5rem',
              }}
            >
              <Link
                href='/'
                aria-label='Helsedirektoratet'
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  textDecoration: 'none',
                }}
              >
                <img src='/Hdir_logo.svg' alt='Helsedirektoratet' height={40} />
              </Link>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <Button
                  variant='secondary'
                  data-color='hvit'
                  style={{
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',

                  }}
                >
                <IoSearch />
                  Søk
                </Button>
                <Button
                  variant='secondary'
                  style={{
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <IoMenu />
                  Meny
                </Button>
              </div>
            </div>
          </CardBlock>
        </header>
      </div>
    </>
  )
}
