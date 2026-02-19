import type { ReactNode } from 'react'
import { Heading } from '@digdir/designsystemet-react'
import { Breadcrumb } from '../../ui/Breadcrumb'
import type { BreadcrumbItem } from '../../../types/components'

interface TemasideHubStatusViewProps {
  title: string
  breadcrumbItems?: BreadcrumbItem[]
  details?: ReactNode
}

export function TemasideHubStatusView({ title, breadcrumbItems, details }: TemasideHubStatusViewProps) {
  return (
    <div className="mx-auto max-w-5xl p-6">
      {breadcrumbItems && breadcrumbItems.length > 0 && <Breadcrumb items={breadcrumbItems} />}
      <Heading level={2} data-size="md">{title}</Heading>
      {details && <p className="mt-2 text-sm text-slate-600">{details}</p>}
    </div>
  )
}
