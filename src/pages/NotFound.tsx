import { Link } from 'react-router-dom'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { HiArrowLeft } from 'react-icons/hi2'
import { ds } from '../styles/dsTokens'

export function NotFound() {
  return (
    <div
      className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-12"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: '7rem',
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: ds.color('logobla-2', 'base-default'),
          opacity: 0.18,
          marginBottom: '-0.25rem',
          userSelect: 'none',
        }}
      >
        404
      </p>

      <Heading level={1} data-size="lg" style={{ marginBottom: '0.5rem' }}>
        Siden ble ikke funnet
      </Heading>

      <Paragraph
        data-size="md"
        style={{ marginBottom: '2.5rem', color: '#64748b', maxWidth: '28rem' }}
      >
        Beklager, vi finner ikke siden du leter etter. Den kan ha blitt flyttet eller fjernet.
      </Paragraph>

      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.7rem 1.6rem',
          borderRadius: '0.5rem',
          backgroundColor: ds.color('logobla-1', 'base-default'),
          color: ds.color('logobla-1', 'base-contrast-default'),
          fontSize: '0.95rem',
          fontWeight: 500,
          textDecoration: 'none',
          transition: 'background-color 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-hover')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = ds.color('logobla-1', 'base-default')
        }}
      >
        <HiArrowLeft size={16} />
        Gå til forsiden
      </Link>
    </div>
  )
}
