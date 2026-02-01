import { type FormEvent, useState, forwardRef } from 'react'
import { MagnifyingGlassIcon, XMarkIcon } from '@navikt/aksel-icons'
import { colors } from '../../styles/dsTokens'

interface HomeSearchFormProps {
  query: string
  onQueryChange: (query: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export const HomeSearchForm = forwardRef<HTMLInputElement, HomeSearchFormProps>(
  ({ query, onQueryChange, onSubmit }, ref) => {
    const [isHoveringIcon, setIsHoveringIcon] = useState(false)
    const [isFocused, setIsFocused] = useState(false)

    function handleIconClick() {
      if (query.trim()) {
        const event = new Event('submit', { bubbles: true, cancelable: true }) as any
        onSubmit(event)
      }
    }

    function handleClear() {
      onQueryChange('')
    }

    return (
      <div
        className="rounded-br-[50px]"
        style={{ backgroundColor: colors.headerBg }}
      >
        <div className="max-w-screen-xl mx-auto px-8 pt-5 pb-8">
          <label htmlFor="home-search" className="block font-bold mb-2">
            Hva leter du etter?
          </label>

          <form onSubmit={onSubmit} className="mb-6">
            <div className="relative">
              <input
                ref={ref}
                type="text"
                id="home-search"
                name="query"
                aria-label="Søk"
              placeholder="Søk etter innhold…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className={`w-full px-4 py-3 pr-24 border rounded-lg text-base transition-all bg-white outline-none ${
                isFocused
                  ? 'border-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.1)]'
                  : 'border-slate-300 shadow-none'
              }`}
            />

            {/* Clear button (X) */}
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
      </div>
    </div>
    )
  }
)

HomeSearchForm.displayName = 'HomeSearchForm'
