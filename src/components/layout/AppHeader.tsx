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
      <div
        className='site-header'
        style={{ backgroundColor: colors.headerBg, color: colors.headerFg }}
      >
        <header>
          <CardBlock style={{ padding: '2rem' }}>
            <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-6">
              <Link
                to='/'
                aria-label='Helsedirektoratet'
                className="flex items-center gap-3 flex-shrink-0"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                <picture>
                  <source srcSet='/hdir_logo_small.svg' media='(max-width: 580px)' />
                  <img src='/Hdir_logo.svg' alt='Helsedirektoratet' className="h-8" />
                </picture>
              </Link>

              <div className="flex gap-3 items-center">
                <Button
                  variant='secondary'
                  onClick={() => {
                    window.dispatchEvent(new Event('toggleSearch'))
                  }}
                  aria-label='Søk'
                  className='site-header__button'
                  style={{
                    backgroundColor: ds.color('hvit', 'surface-default'),
                    border: `2px solid ${ds.color('logobla-1', 'base-hover')}`,
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
                  <IoSearch size={18} />
                </Button>
                <Button
                  variant='secondary'
                  aria-label='Meny'
                  className='site-header__button'
                  style={{
                    backgroundColor: ds.color('hvit', 'surface-default'),
                    border: `2px solid ${ds.color('logobla-1', 'base-hover')}`,
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
                  <IoMenu size={18} />
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
