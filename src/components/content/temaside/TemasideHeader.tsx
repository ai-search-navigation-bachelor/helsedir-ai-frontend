import { ds } from '../../../styles/dsTokens'

interface TemasideHeaderProps {
  title: string
  parentLabel?: string | null
}

export function TemasideHeader({ title, parentLabel }: TemasideHeaderProps) {
  return (
    <header className="pb-1">
      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: ds.color('logobla-1', 'base-default') }}>
        Temaside{parentLabel ? ` · ${parentLabel}` : ''}
      </p>
      <h1 className="text-3xl font-bold text-gray-900 leading-tight font-title">{title}</h1>
    </header>
  )
}
