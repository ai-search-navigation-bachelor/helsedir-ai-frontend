import { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons'
import { Checkbox } from '@digdir/designsystemet-react'
import { useSearchStore } from '../../stores/searchStore'
import { TEMA_OPTIONS } from '../../constants/categories'
import type { SearchFilters } from '../../stores/searchStore'

export function FilterBar() {
  const filters = useSearchStore((state) => state.filters)
  const setFilters = useSearchStore((state) => state.setFilters)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Ensure filters are initialized on mount
  useEffect(() => {
    if (filters.tema === undefined) {
      // tema: undefined means all temas are selected (no filter)
      // This is the default state - no need to change anything
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Default to all temas selected if none are set
  const allTemaValues = TEMA_OPTIONS.map(t => t.value)
  const selectedTemas = filters.tema || allTemaValues

  const handleTemaToggle = (temaValue: string) => {
    const newTemas = selectedTemas.includes(temaValue)
      ? selectedTemas.filter(t => t !== temaValue)
      : [...selectedTemas, temaValue]

    const newFilters: SearchFilters = {
      ...filters,
      tema: newTemas.length === allTemaValues.length ? undefined : newTemas,
    }
    setFilters(newFilters)
  }

  const handleSelectAll = () => {
    const newFilters: SearchFilters = {
      ...filters,
      tema: undefined, // undefined means all selected
    }
    setFilters(newFilters)
  }

  const handleDeselectAll = () => {
    const newFilters: SearchFilters = {
      ...filters,
      tema: [],
    }
    setFilters(newFilters)
  }

  const allSelected = selectedTemas.length === allTemaValues.length
  const noneSelected = selectedTemas.length === 0

  const displayText = allSelected
    ? 'Alle temaer'
    : noneSelected
    ? 'Ingen temaer valgt'
    : selectedTemas.length === 1
    ? TEMA_OPTIONS.find(opt => opt.value === selectedTemas[0])?.label || 'Tema'
    : `${selectedTemas.length} temaer valgt`

  return (
    <div className="mb-4 -mt-3.5">
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 pr-9 border-2 border-slate-300 rounded-full bg-white text-slate-700 text-sm hover:border-slate-400 transition-colors"
          style={{ minWidth: '200px' }}
        >
          <span>{displayText}</span>
          {isOpen ? (
            <ChevronUpIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          ) : (
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
          )}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white border-2 border-slate-300 rounded-lg shadow-lg z-10 p-2"
            style={{ minWidth: '280px' }}
          >
            {/* Select/Deselect all buttons */}
            <div className="flex gap-2 pb-2 mb-2 border-b border-slate-200">
              <button
                onClick={handleSelectAll}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors text-center"
              >
                Velg alle
              </button>
              <button
                onClick={handleDeselectAll}
                className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors text-center"
              >
                Fjern alle
              </button>
            </div>

            <div className="space-y-0.5">
              {TEMA_OPTIONS.map((tema) => (
                <label
                  key={tema.value}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer"
                >
                  <Checkbox
                    checked={selectedTemas.includes(tema.value)}
                    onChange={() => handleTemaToggle(tema.value)}
                    size="sm"
                  />
                  <span className="text-xs text-slate-700 leading-tight">{tema.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
