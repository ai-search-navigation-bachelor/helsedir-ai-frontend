import { useId, useRef, useState, useEffect, useCallback, forwardRef } from 'react'
import { IoSearch, IoClose } from 'react-icons/io5'
import { ds, colors } from '../../styles/dsTokens'
import { useSearchSuggestionsQuery } from '../../hooks/queries/useSearchSuggestionsQuery'
import type { SearchFormProps } from '../../types/components'

export const SearchForm = forwardRef<HTMLInputElement, SearchFormProps>(
  ({ query, onQueryChange, onSubmit, onClear, onSuggestionSelect }, ref) => {
    const inputId = useId()
    const [isFocused, setIsFocused] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const formRef = useRef<HTMLFormElement>(null)
    const dropdownRef = useRef<HTMLUListElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)

    const { data } = useSearchSuggestionsQuery(query, showSuggestions)
    const suggestions = data?.suggestions ?? []
    const prevSuggestionsLengthRef = useRef(suggestions.length)

    if (prevSuggestionsLengthRef.current !== suggestions.length) {
      prevSuggestionsLengthRef.current = suggestions.length
      if (activeIndex !== -1) {
        queueMicrotask(() => setActiveIndex(-1))
      }
    }

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
          {before}
          <strong style={{ fontWeight: 600, color: '#025169' }}>{match}</strong>
          {after}
        </>
      )
    }

    const listboxId = `${inputId}-suggestions`
    const hasQuery = query.trim().length > 0

    return (
      <div style={{ backgroundColor: colors.headerBg }}>
        <div className="max-w-7xl mx-auto px-12 pt-4 pb-10">
          <label
            htmlFor={inputId}
            className="block mb-3 font-title"
            style={{
              fontSize: '1.05rem',
              fontWeight: 600,
              color: '#025169',
              letterSpacing: '-0.01em',
            }}
          >
            Hva leter du etter?
          </label>

          <form ref={formRef} onSubmit={handleSubmit}>
            <div ref={wrapperRef} className="relative">
              <div
                className="flex items-center bg-white overflow-hidden transition-all"
                style={{
                  borderRadius: '12px',
                  border: isFocused
                    ? '2px solid #047FA4'
                    : '2px solid transparent',
                  boxShadow: isFocused
                    ? '0 0 0 3px rgba(4, 127, 164, 0.12), 0 1px 3px rgba(0, 0, 0, 0.04)'
                    : '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                <input
                  ref={ref}
                  type="text"
                  id={inputId}
                  name="query"
                  aria-label="Sæk"
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
                  className="w-full bg-transparent outline-none"
                  style={{
                    padding: '14px 16px',
                    fontSize: '1rem',
                    color: '#1e293b',
                    lineHeight: 1.5,
                  }}
                />

                {/* Clear button */}
                {hasQuery && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="shrink-0 flex items-center justify-center transition-colors"
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      color: '#64748b',
                      marginRight: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f1f5f9'
                      e.currentTarget.style.color = '#334155'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                      e.currentTarget.style.color = '#64748b'
                    }}
                    aria-label="Tom"
                  >
                    <IoClose size={18} />
                  </button>
                )}

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleIconClick}
                  className="shrink-0 flex items-center justify-center transition-all"
                  style={{
                    height: '38px',
                    borderRadius: '10px',
                    marginRight: '6px',
                    padding: hasQuery ? '0 18px' : '0 12px',
                    gap: '6px',
                    backgroundColor: hasQuery ? '#025169' : 'transparent',
                    color: hasQuery ? '#ffffff' : '#64748b',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: hasQuery ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (hasQuery) {
                      e.currentTarget.style.backgroundColor = '#047FA4'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasQuery) {
                      e.currentTarget.style.backgroundColor = '#025169'
                    }
                  }}
                  aria-label="Søk"
                >
                  {hasQuery && <span>Søk</span>}
                  {!hasQuery && <IoSearch size={18} />}
                </button>
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  id={listboxId}
                  role="listbox"
                  className="absolute z-50 left-0 right-0"
                  style={{
                    marginTop: '6px',
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)',
                    overflow: 'hidden',
                    padding: '4px',
                  }}
                >
                  {suggestions.map((suggestion, index) => {
                    const isActive = index === activeIndex
                    return (
                      <li
                        key={suggestion.id}
                        id={`${listboxId}-option-${index}`}
                        role="option"
                        aria-selected={isActive}
                        onMouseDown={(e) => {
                          e.preventDefault()
                          handleSelectSuggestion(suggestion.id)
                        }}
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                        className="flex items-center justify-between cursor-pointer transition-colors"
                        style={{
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          color: '#1e293b',
                          backgroundColor: isActive ? '#f0f7fa' : 'transparent',
                          borderLeft: isActive ? '3px solid #047FA4' : '3px solid transparent',
                        }}
                      >
                        <span style={{ lineHeight: 1.4 }}>
                          {highlightMatch(suggestion.title)}
                        </span>
                        <span
                          className="shrink-0"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: ds.color('logobla-1', 'surface-tinted'),
                            color: '#025169',
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                            marginLeft: '12px',
                          }}
                        >
                          Temaside
                        </span>
                      </li>
                    )
                  })}
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
