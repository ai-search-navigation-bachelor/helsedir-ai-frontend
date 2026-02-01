import { Breadcrumbs } from '@digdir/designsystemet-react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/components'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <Breadcrumbs style={{ marginBottom: '24px' }}>
      <Breadcrumbs.List>
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          const content = (
            <span className="inline-flex items-center gap-1.5 underline">
              {item.label}
              {item.icon}
            </span>
          )

          return (
            <Breadcrumbs.Item key={index}>
              {isLast ? (
                <span className="inline-flex items-center gap-1.5">
                  {item.label}
                  {item.icon}
                </span>
              ) : (
                <Breadcrumbs.Link asChild>
                  <Link to={item.href}>
                    {content}
                  </Link>
                </Breadcrumbs.Link>
              )}
            </Breadcrumbs.Item>
          )
        })}
      </Breadcrumbs.List>
    </Breadcrumbs>
  )
}
