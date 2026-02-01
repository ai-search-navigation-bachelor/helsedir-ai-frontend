import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons'

interface SearchFormProps {
  initialValue: string
  onSubmit: (query: string) => void
  onClear?: () => void
  placeholder?: string
}

export function SearchForm({
  initialValue,
  onSubmit,
  onClear,
  placeholder = 'Søk etter innhold…'
}: SearchFormProps) {
  const [inputValue, setInputValue] = useState(initialValue)
  const [isHoveringIcon, setIsHoveringIcon] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  // Sync input with initial value when it changes
  useEffect(() => {
    setInputValue(initialValue)
  }, [initialValue])

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = inputValue.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  function handleClear() {
    setInputValue('')
    onClear?.()
  }

  function handleIconClick() {
    const trimmed = inputValue.trim()
    if (trimmed) {
      onSubmit(trimmed)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="relative">
        <input
          type="text"
          name="query"
          aria-label="Søk"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-4 py-3 pr-24 border rounded-lg text-base transition-all"
          style={{
            borderColor: isFocused ? '#3b82f6' : '#cbd5e1',
            boxShadow: isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
            outline: 'none'
          }}
        />

        {/* Clear button (X) */}
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-14 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
            aria-label="Tøm"
          >
            <XMarkIcon className="w-5 h-5 text-slate-500" />
          </button>
        )}

        {/* Magnifying glass icon button */}
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
      </div>
    </form>
  )
}
