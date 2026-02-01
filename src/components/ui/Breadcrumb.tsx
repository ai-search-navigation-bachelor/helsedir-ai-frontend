import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/components'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav style={{ marginBottom: '24px' }}>
      <ol 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          fontSize: '14px',
          color: '#64748b'
        }}
      >
        {items.map((item, index) => (
          <li key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {index > 0 && <span>/</span>}
            {index === items.length - 1 ? (
              <span style={{ color: '#0f172a', fontWeight: '500' }}>
                - {item.label}
              </span>
            ) : (
              <Link 
                to={item.href}
                style={{ 
                  color: '#2563eb', 
                  textDecoration: 'none',
                  fontWeight: '500',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {item.icon}
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
