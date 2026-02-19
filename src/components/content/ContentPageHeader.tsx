import { Heading } from '@digdir/designsystemet-react'

type ContentPageHeaderProps = {
  typeLabel: string
  title: string
}

export function ContentPageHeader({ typeLabel, title }: ContentPageHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-800">
          {typeLabel}
        </span>
      </div>
      <Heading level={1} data-size="lg" className="font-title" style={{ marginBottom: 0 }}>
        {title}
      </Heading>
    </header>
  )
}
