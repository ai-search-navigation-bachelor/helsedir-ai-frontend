import { Breadcrumbs } from '@digdir/designsystemet-react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/components'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <Breadcrumbs>
        <Breadcrumbs.List className="min-w-0 flex-nowrap text-sm">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            const isNonNavigable = item.href === '#'
            const label = (
              <span
                title={item.label}
                className="block max-w-[clamp(18rem,36vw,30rem)] truncate leading-5"
              >
                {item.label}
              </span>
            )
            const content = (
              <span className="inline-flex min-w-0 items-center gap-1.5 underline">
                {label}
                {item.icon}
              </span>
            )

            return (
              <Breadcrumbs.Item key={index} className="min-w-0">
                {isLast || isNonNavigable ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5 text-slate-700">
                    {label}
                    {item.icon}
                  </span>
                ) : (
                  <Breadcrumbs.Link asChild>
                    <Link to={item.href} className="min-w-0">
                      {content}
                    </Link>
                  </Breadcrumbs.Link>
                )}
              </Breadcrumbs.Item>
            )
          })}
        </Breadcrumbs.List>
      </Breadcrumbs>
    </div>
  )
}
