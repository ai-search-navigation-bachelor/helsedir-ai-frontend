import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ds } from '../../styles/dsTokens'

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
  /** Semantic group for visual separation: home, tema, parent, current */
  group?: 'home' | 'tema' | 'parent' | 'current'
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  /** When true, middle items are collapsed behind "..." from the first render. */
  collapsible?: boolean
}

const linkColor = ds.color('logobla-1', 'base-default')
const linkHoverColor = ds.color('logobla-2', 'base-default')

function ItemLabel({ item }: { item: BreadcrumbItem }) {
  return (
    <Link
      to={item.href}
      style={{
        color: linkColor,
        textDecoration: 'underline',
        textDecorationColor: ds.color('logobla-1', 'border-subtle'),
        textUnderlineOffset: '3px',
        transition: 'text-decoration-color 0.2s ease, color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecorationColor = ds.color('logobla-1', 'border-default')
        e.currentTarget.style.color = linkHoverColor
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecorationColor = ds.color('logobla-1', 'border-subtle')
        e.currentTarget.style.color = linkColor
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

  const totalLabelLength = navigable.reduce((sum, item) => sum + item.label.trim().length, 0)
  const shouldCollapse =
    collapsible &&
    navigable.length >= 3 &&
    !expanded &&
    (
      navigable.length >= 5 ||
      (navigable.length >= 4 && totalLabelLength > 80) ||
      totalLabelLength > 110
    )

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
                  color: linkColor,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  padding: '0 4px',
                  borderRadius: '4px',
                  textDecoration: 'underline',
                  textDecorationColor: ds.color('logobla-1', 'border-subtle'),
                  textUnderlineOffset: '3px',
                  transition: 'text-decoration-color 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecorationColor = ds.color('logobla-1', 'border-default')
                  e.currentTarget.style.color = linkHoverColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecorationColor = ds.color('logobla-1', 'border-subtle')
                  e.currentTarget.style.color = linkColor
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
          navigable.slice(1).map((item) => (
            <li key={item.href || item.label} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <Separator />
              <ItemLabel item={item} />
            </li>
          ))
        )}
      </ol>
    </nav>
  )
}
