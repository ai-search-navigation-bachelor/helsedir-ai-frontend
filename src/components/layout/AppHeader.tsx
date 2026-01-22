import {
  Button,
  CardBlock,
  Link,
} from '@digdir/designsystemet-react'

import { IoIosSearch, IoIosMenu  } from "react-icons/io";
import Hdir_logo from '../../../public/Hdir_logo.svg'

export function AppHeader() {
  return (
    <>
      <div style={{backgroundColor: "blue"}}>
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
                <img src={Hdir_logo} alt='Helsedirektoratet' height={40} />
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
                <IoIosSearch />
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
                  <IoIosMenu />
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
