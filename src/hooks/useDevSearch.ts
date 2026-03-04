import { useState, useEffect, useRef } from 'react'
import { search, searchKeyword } from '../api/search'
import type { SlotState, ResultStats } from '../types/dev'
import { DEFAULT_CONFIG, HELSEDIR_STYLE_CONFIG } from '../constants/dev'
import { computeStats, computeRankMap, getRankDiff } from '../components/dev/utils'

function initialSlot(config: SlotState['config']): SlotState {
  return { config, response: null, loading: false, error: null }
}

export interface DevSearchReturn {
  query: string
  setQuery: (q: string) => void
  slotA: SlotState
  setSlotA: React.Dispatch<React.SetStateAction<SlotState>>
  slotB: SlotState
  setSlotB: React.Dispatch<React.SetStateAction<SlotState>>
  slotHelsedir: SlotState
  isLoading: boolean
  hasResults: boolean
  statsA: ResultStats | null
  statsB: ResultStats | null
  statsHelsedir: ResultStats | null
  rankMapA: Map<string, number>
  rankMapB: Map<string, number>
  getRankDiff: typeof getRankDiff
  runSearch: () => Promise<void>
}

export function useDevSearch(): DevSearchReturn {
  const [query, setQuery] = useState('')
  const [slotA, setSlotA] = useState<SlotState>(() => initialSlot({ ...DEFAULT_CONFIG }))
  const [slotB, setSlotB] = useState<SlotState>(() => initialSlot({ ...DEFAULT_CONFIG }))
  const [slotHelsedir, setSlotHelsedir] = useState<SlotState>(() =>
    initialSlot({ ...HELSEDIR_STYLE_CONFIG }),
  )

  const abortRef = useRef<{ a?: AbortController; b?: AbortController; h?: AbortController }>({})

  useEffect(() => {
    return () => {
      abortRef.current.a?.abort()
      abortRef.current.b?.abort()
      abortRef.current.h?.abort()
    }
  }, [])

  async function runSearch() {
    const trimmed = query.trim()
    if (!trimmed) return

    abortRef.current.a?.abort()
    abortRef.current.b?.abort()
    abortRef.current.h?.abort()

    const controllerA = new AbortController()
    const controllerB = new AbortController()
    const controllerH = new AbortController()
    abortRef.current = { a: controllerA, b: controllerB, h: controllerH }

    setSlotA((s) => ({ ...s, loading: true, error: null }))
    setSlotB((s) => ({ ...s, loading: true, error: null }))
    setSlotHelsedir((s) => ({ ...s, loading: true, error: null }))

    const [resultA, resultB, resultH] = await Promise.allSettled([
      search(trimmed, { signal: controllerA.signal, limit: 20, log: false, method: 'hybrid', ...slotA.config }),
      search(trimmed, { signal: controllerB.signal, limit: 20, log: false, method: 'hybrid', ...slotB.config }),
      searchKeyword(trimmed, { signal: controllerH.signal, limit: 20 }),
    ])

    if (resultA.status === 'fulfilled') {
      setSlotA((s) => ({ ...s, loading: false, response: resultA.value }))
    } else if ((resultA.reason as Error)?.name !== 'AbortError') {
      setSlotA((s) => ({ ...s, loading: false, error: 'Søk A feilet. Sjekk konsollen for detaljer.' }))
    }

    if (resultB.status === 'fulfilled') {
      setSlotB((s) => ({ ...s, loading: false, response: resultB.value }))
    } else if ((resultB.reason as Error)?.name !== 'AbortError') {
      setSlotB((s) => ({ ...s, loading: false, error: 'Søk B feilet. Sjekk konsollen for detaljer.' }))
    }

    if (resultH.status === 'fulfilled') {
      setSlotHelsedir((s) => ({ ...s, loading: false, response: resultH.value }))
    } else if ((resultH.reason as Error)?.name !== 'AbortError') {
      setSlotHelsedir((s) => ({ ...s, loading: false, error: 'Helsedir-søk feilet. Sjekk konsollen for detaljer.' }))
    }
  }

  const isLoading = slotA.loading || slotB.loading || slotHelsedir.loading
  const hasResults =
    slotA.response !== null || slotB.response !== null || slotHelsedir.response !== null

  const statsA = slotA.response ? computeStats(slotA.response) : null
  const statsB = slotB.response ? computeStats(slotB.response) : null
  const statsHelsedir = slotHelsedir.response ? computeStats(slotHelsedir.response) : null

  const rankMapA = slotA.response
    ? computeRankMap(slotA.response.results)
    : new Map<string, number>()
  const rankMapB = slotB.response
    ? computeRankMap(slotB.response.results)
    : new Map<string, number>()

  return {
    query,
    setQuery,
    slotA,
    setSlotA,
    slotB,
    setSlotB,
    slotHelsedir,
    isLoading,
    hasResults,
    statsA,
    statsB,
    statsHelsedir,
    rankMapA,
    rankMapB,
    getRankDiff,
    runSearch,
  }
}
