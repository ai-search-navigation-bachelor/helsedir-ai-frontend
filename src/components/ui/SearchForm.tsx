import { useId, useRef, useState, useEffect, useCallback, forwardRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons'
import { colors } from '../../styles/dsTokens'
import { useSearchSuggestionsQuery } from '../../hooks/queries/useSearchSuggestionsQuery'
import type { SearchFormProps } from '../../types/components'

export const SearchForm = forwardRef<HTMLInputElement, SearchFormProps>(
  ({ query, onQueryChange, onSubmit, onClear, onSuggestionSelect }, ref) => {
    const inputId = useId()
    const [isHoveringIcon, setIsHoveringIcon] = useState(false)
    const [isFocused, setIsFocused] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const formRef = useRef<HTMLFormElement>(null)
    const dropdownRef = useRef<HTMLUListElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const { data } = useSearchSuggestionsQuery(query, showSuggestions)
    const suggestions = data?.suggestions ?? []
    const prevSuggestionsLengthRef = useRef(suggestions.length)

    // Reset active index when suggestions change (during render is safe here)
    if (prevSuggestionsLengthRef.current !== suggestions.length) {
      prevSuggestionsLengthRef.current = suggestions.length
      // This is a derived state reset, not a side effect - safe during render
      if (activeIndex !== -1) {
        // Use a microtask to avoid setState during render warning
        queueMicrotask(() => setActiveIndex(-1))
      }
    }

    // Close dropdown on click outside
    const handleClickOutside = useCallback((e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }, [])

    useEffect(() => {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [handleClickOutside])

    function handleIconClick() {
      if (query.trim()) {
        formRef.current?.requestSubmit()
      }
    }

    function handleClear() {
      onQueryChange('')
      setShowSuggestions(false)
      onClear?.()
      if (typeof ref === 'object' && ref?.current) {
        ref.current.focus()
      }
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
      setShowSuggestions(false)
      onSubmit(e)
    }

    function handleSelectSuggestion(id: string) {
      setShowSuggestions(false)
      onSuggestionSelect?.(id)
    }

    function handleKeyDown(e: React.KeyboardEvent) {
      if (!showSuggestions || suggestions.length === 0) return

      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : -1))
        return
      }

      if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault()
        handleSelectSuggestion(suggestions[activeIndex].id)
      }
    }

    function highlightMatch(title: string) {
      const trimmed = query.trim()
      if (!trimmed) return title

      const index = title.toLowerCase().indexOf(trimmed.toLowerCase())
      if (index === -1) return title

      const before = title.slice(0, index)
      const match = title.slice(index, index + trimmed.length)
      const after = title.slice(index + trimmed.length)

      return (
        <>
          {before}<strong style={{ fontWeight: 700 }}>{match}</strong>{after}
        </>
      )
    }

    const listboxId = `${inputId}-suggestions`

    return (
      <div className="rounded-br-[50px]" style={{ backgroundColor: colors.headerBg }}>
        <div className="max-w-screen-xl mx-auto px-12 pt-3 pb-8">
          <label htmlFor={inputId} className="block font-bold mb-2 text-base font-title">
            Hva leter du etter?
          </label>

          <form ref={formRef} onSubmit={handleSubmit} className="mb-6">
            <div ref={wrapperRef} className="relative">
              <input
                ref={ref}
                type="text"
                id={inputId}
                name="query"
                aria-label="Søk"
                placeholder="Søk etter innhold..."
                value={query}
                onChange={(e) => {
                  onQueryChange(e.target.value)
                  setShowSuggestions(true)
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onKeyDown={handleKeyDown}
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls={listboxId}
                aria-activedescendant={
                  activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
                }
                aria-autocomplete="list"
                autoComplete="off"
                className={`w-full px-4 py-3 pr-24 border rounded-lg text-base transition-all bg-white outline-none ${
                  isFocused
                    ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                    : 'border-slate-300 shadow-none'
                }`}
              />

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                  aria-label="Tøm"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-500" />
                </button>
              )}

              <button
                type="button"
                onClick={handleIconClick}
                onMouseEnter={() => setIsHoveringIcon(true)}
                onMouseLeave={() => setIsHoveringIcon(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all cursor-pointer"
                style={{
                  backgroundColor: isHoveringIcon ? '#f1f5f9' : 'transparent',
                  border: isHoveringIcon ? '1px solid #cbd5e1' : '1px solid transparent',
                }}
                aria-label="Søk"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-600" />
              </button>

              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  id={listboxId}
                  role="listbox"
                  className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden"
                >
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={suggestion.id}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        handleSelectSuggestion(suggestion.id)
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(-1)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer text-sm transition-colors ${
                        index === activeIndex
                          ? 'bg-slate-100'
                          : 'hover:bg-slate-50'
                      }`}
                      style={{ color: '#003a4f' }}
                    >
                      <span>{highlightMatch(suggestion.title)}</span>
                      <span
                        className="shrink-0 text-xs px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: '#e6f2f6',
                          color: '#005f73',
                          fontWeight: 500,
                        }}
                      >
                        Temaside
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </form>
        </div>
      </div>
    )
  }
)

SearchForm.displayName = 'SearchForm'
