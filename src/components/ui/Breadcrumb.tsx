import { Link } from 'react-router-dom'
import { ds } from '../../styles/dsTokens'

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
  metaLabel?: string
  /** Semantic group for visual separation: home, tema, parent, current */
  group?: 'home' | 'tema' | 'parent' | 'current'
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
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
      <span className="flex min-w-0 flex-col">
        {item.metaLabel && (
          <span
            className="mb-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.08em]"
            style={{ color: '#64748b' }}
          >
            {item.metaLabel}
          </span>
        )}
        <span
          title={item.label}
          className="block max-w-[clamp(14rem,30vw,26rem)] truncate"
        >
          {item.label}
        </span>
      </span>
    </Link>
  )
}

function Separator() {
  return (
    <span
      aria-hidden
      style={{
        margin: '0 8px 2px',
        color: '#94a3b8',
        userSelect: 'none',
        alignSelf: 'flex-end',
        lineHeight: 1,
      }}
    >
      /
    </span>
  )
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  // Filter out current page (non-navigable)
  const navigable = items.filter((item) => item.href !== '#')
  if (navigable.length === 0) return null

  return (
    <nav
      aria-label="Brodsmulesti"
      style={{ marginBottom: '20px', fontSize: '0.9rem', lineHeight: 1.5 }}
    >
      <ol
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          rowGap: '4px',
        }}
      >
        {/* First item */}
        <li style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
          <ItemLabel item={navigable[0]} />
        </li>
        {navigable.slice(1).map((item) => (
          <li key={item.href || item.label} style={{ display: 'inline-flex', alignItems: 'flex-end' }}>
            <Separator />
            <ItemLabel item={item} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
