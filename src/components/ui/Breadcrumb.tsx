import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/components'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** When true, middle items are collapsed behind "..." from the first render. */
  collapsible?: boolean
}

function ItemLabel({ item }: { item: BreadcrumbItem }) {
  return (
    <Link
      to={item.href}
      style={{
        color: '#025169',
        textDecoration: 'underline',
        textDecorationColor: 'rgba(2, 81, 105, 0.25)',
        textUnderlineOffset: '3px',
        transition: 'text-decoration-color 0.2s ease, color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecorationColor = 'rgba(2, 81, 105, 0.7)'
        e.currentTarget.style.color = '#047FA4'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecorationColor = 'rgba(2, 81, 105, 0.25)'
        e.currentTarget.style.color = '#025169'
      }}
    >
      <span
        title={item.label}
        className="block max-w-[clamp(14rem,30vw,26rem)] truncate"
      >
        {item.label}
      </span>
    </Link>
  )
}

function Separator() {
  return (
    <span aria-hidden style={{ margin: '0 8px', color: '#94a3b8', userSelect: 'none' }}>
      /
    </span>
  )
}

export function Breadcrumb({ items, collapsible = false }: BreadcrumbProps) {
  const [expanded, setExpanded] = useState(false)

  // Filter out current page (non-navigable)
  const navigable = items.filter((item) => item.href !== '#')
  if (navigable.length === 0) return null

  const shouldCollapse = collapsible && !expanded && navigable.length >= 2

  return (
    <nav
      aria-label="Brodsmulesti"
      style={{ marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}
    >
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          rowGap: '4px',
        }}
      >
        {/* First item */}
        <li style={{ display: 'inline-flex', alignItems: 'center' }}>
          <ItemLabel item={navigable[0]} />
        </li>

        {shouldCollapse ? (
          <>
            {/* Ellipsis */}
            <li style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Separator />
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Vis hele brodsmulestien"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#025169',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  textDecoration: 'underline',
                  textDecorationColor: 'rgba(2, 81, 105, 0.25)',
                  textUnderlineOffset: '3px',
                  transition: 'text-decoration-color 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecorationColor = 'rgba(2, 81, 105, 0.7)'
                  e.currentTarget.style.color = '#047FA4'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecorationColor = 'rgba(2, 81, 105, 0.25)'
                  e.currentTarget.style.color = '#025169'
                }}
              >
                ...
              </button>
            </li>
            {/* Last item */}
            <li style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Separator />
              <ItemLabel item={navigable[navigable.length - 1]} />
            </li>
          </>
        ) : (
          navigable.slice(1).map((item, i) => (
            <li key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Separator />
              <ItemLabel item={item} />
            </li>
          ))
        )}
      </ol>
    </nav>
  )
}
