import { ChevronDownIcon } from '@navikt/aksel-icons'
import { useSearchStore } from '../../stores/searchStore'
import type { SearchFilters } from '../../stores/searchStore'

// Placeholder options - these should come from API or constants
const TEMA_OPTIONS = [
  { value: '', label: 'Tema' },
  { value: 'helse', label: 'Helse' },
  { value: 'omsorg', label: 'Omsorg' },
  { value: 'forebygging', label: 'Forebygging' },
]

export function FilterBar() {
  const filters = useSearchStore((state) => state.filters)
  const setFilters = useSearchStore((state) => state.setFilters)

  const handleTemaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilters: SearchFilters = {
      ...filters,
      tema: e.target.value || undefined,
    }
    setFilters(newFilters)
  }

  return (
    <div className="flex gap-3 mb-4 -mt-3.5">
      <div className="relative">
        <select
          value={filters.tema || ''}
          onChange={handleTemaChange}
          className="appearance-none px-4 py-2 pr-9 border-2 border-slate-300 rounded-full bg-white text-slate-700 text-sm cursor-pointer hover:border-slate-400 transition-colors"
          style={{ minWidth: '140px' }}
        >
          {TEMA_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" />
      </div>
    </div>
  )
}
