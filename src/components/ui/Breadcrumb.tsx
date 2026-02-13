import { Breadcrumbs } from '@digdir/designsystemet-react'
import { Link } from 'react-router-dom'
import type { BreadcrumbItem } from '../../types/components'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  leadingAction?: {
    label: string
    href: string
  }
}

export function Breadcrumb({ items, leadingAction }: BreadcrumbProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <Breadcrumbs>
        <Breadcrumbs.List className="flex flex-wrap items-center gap-2 text-sm">
          {leadingAction && (
            <Breadcrumbs.Item className="min-w-0">
              <Breadcrumbs.Link asChild>
                <Link
                  to={leadingAction.href}
                  className="inline-flex items-center gap-1.5 bg-[#D9ECF5] px-3 py-2 font-medium text-[#0A5B78] transition-colors hover:bg-[#C7E4F1]"
                  style={{
                    clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)',
                  }}
                >
                  <span aria-hidden>←</span>
                  <span className="truncate">{leadingAction.label}</span>
                </Link>
              </Breadcrumbs.Link>
            </Breadcrumbs.Item>
          )}

          {items.map((item, index) => {
            const isFirst = index === 0
            const isLast = index === items.length - 1
            const isNonNavigable = item.href === '#'
            const clipPath = isFirst
              ? 'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)'
              : 'polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)'

            const segmentClass = isLast
              ? 'bg-[#8DC7DD] text-[#0A3D52]'
              : 'bg-[#D9ECF5] text-[#0A5B78] hover:bg-[#C7E4F1]'

            const label = (
              <span
                title={item.label}
                className="block max-w-[clamp(12rem,30vw,24rem)] truncate leading-5"
              >
                {item.label}
              </span>
            )
            const content = (
              <span
                className={`inline-flex min-w-0 items-center gap-1.5 px-4 py-2 font-medium ${segmentClass}`}
                style={{ clipPath }}
              >
                {label}
                {item.icon}
              </span>
            )

            return (
              <Breadcrumbs.Item key={index} className="min-w-0">
                {isLast || isNonNavigable ? (
                  content
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
