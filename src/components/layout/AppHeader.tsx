import {
  Button,
  CardBlock,
} from '@digdir/designsystemet-react'
import { Link } from 'react-router-dom'

import { colors, ds } from '../../styles/dsTokens'

import { IoSearch, IoMenu } from 'react-icons/io5'

export function AppHeader() {
  return (
    <>
      <div style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}>
        <header>
          <CardBlock style={{ padding: '2rem 1rem' }}>
            <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-6">
              <Link
                to='/'
                aria-label='Helsedirektoratet'
                className="flex items-center gap-3"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <img src='/Hdir_logo.svg' alt='Helsedirektoratet' className="h-10" />
              </Link>

              <div className="flex gap-3 items-center">
                <Button
                  variant='secondary'
                  style={{
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: ds.color('hvit', 'surface-default'),
                    border: `2px solid ${ds.color('logobla-1', 'base-hover')}`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
                    e.currentTarget.style.color = ds.color('logobla-1', 'base-contrast-default')
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('hvit', 'surface-default')
                    e.currentTarget.style.color = ds.color('logobla-1', 'text-default')
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-active')
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
                  }}
                >
                  Søk
                <IoSearch />
                </Button>
                <Button
                  variant='secondary'
                  style={{
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    backgroundColor: ds.color('hvit', 'surface-default'),
                    border: `2px solid ${ds.color('logobla-1', 'base-hover')}`,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
                    e.currentTarget.style.color = ds.color('logobla-1', 'base-contrast-default')
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('hvit', 'surface-default')
                    e.currentTarget.style.color = ds.color('logobla-1', 'text-default')
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-active')
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
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
