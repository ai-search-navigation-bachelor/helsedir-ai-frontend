import { useRef, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { search, searchKeyword } from '../api/search'
import type { SlotState, ResultStats } from '../types/dev'
import { DEFAULT_CONFIG, HELSEDIR_STYLE_CONFIG } from '../constants/dev'
import { computeStats, computeRankMap, getRankDiff } from '../components/dev/utils'

function initialSlot(config: SlotState['config']): SlotState {
  return { config, usedConfig: null, response: null, loading: false, error: null }
}

interface SearchRun {
  runId: number
  query: string
  configA: SlotState['config']
  configB: SlotState['config']
}

function isAbortLikeError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' || error.name === 'CanceledError')
  )
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
  const pendingRunRef = useRef<SearchRun | null>(null)
  const runIdRef = useRef(0)

  const [queryA, queryB, queryH] = useQueries({
    queries: [
      {
        queryKey: ['dev-search', 'a'],
        enabled: false,
        retry: false,
        queryFn: ({ signal }) => {
          const run = pendingRunRef.current
          if (!run) throw new Error('Mangler aktivt søk for Konfig A')
          return search(run.query, {
            signal,
            limit: 100,
            log: false,
            method: 'hybrid',
            ...run.configA,
            role: run.configA.role ?? undefined,
          })
        },
      },
      {
        queryKey: ['dev-search', 'b'],
        enabled: false,
        retry: false,
        queryFn: ({ signal }) => {
          const run = pendingRunRef.current
          if (!run) throw new Error('Mangler aktivt søk for Konfig B')
          return search(run.query, {
            signal,
            limit: 100,
            log: false,
            method: 'hybrid',
            ...run.configB,
            role: run.configB.role ?? undefined,
          })
        },
      },
      {
        queryKey: ['dev-search', 'keyword'],
        enabled: false,
        retry: false,
        queryFn: ({ signal }) => {
          const run = pendingRunRef.current
          if (!run) throw new Error('Mangler aktivt søk for Helsedir')
          return searchKeyword(run.query, { signal, limit: 100 })
        },
      },
    ],
  })

  async function runSearch() {
    const trimmed = query.trim()
    if (!trimmed) return

    const runId = ++runIdRef.current
    pendingRunRef.current = {
      runId,
      query: trimmed,
      configA: { ...slotA.config },
      configB: { ...slotB.config },
    }

    setSlotA((s) => ({ ...s, loading: true, error: null }))
    setSlotB((s) => ({ ...s, loading: true, error: null }))
    setSlotHelsedir((s) => ({ ...s, loading: true, error: null }))

    const [resultA, resultB, resultH] = await Promise.allSettled([
      queryA.refetch(),
      queryB.refetch(),
      queryH.refetch(),
    ])

    if (runId !== runIdRef.current) {
      return
    }

    if (resultA.status === 'fulfilled' && resultA.value.status === 'success') {
      setSlotA((s) => ({ ...s, loading: false, response: resultA.value.data ?? null, usedConfig: pendingRunRef.current?.configA ?? null }))
    } else {
      const error =
        resultA.status === 'fulfilled' ? resultA.value.error : resultA.reason
      setSlotA((s) => ({
        ...s,
        loading: false,
        error: isAbortLikeError(error) ? null : 'Søk A feilet. Sjekk konsollen for detaljer.',
      }))
    }

    if (resultB.status === 'fulfilled' && resultB.value.status === 'success') {
      setSlotB((s) => ({ ...s, loading: false, response: resultB.value.data ?? null, usedConfig: pendingRunRef.current?.configB ?? null }))
    } else {
      const error =
        resultB.status === 'fulfilled' ? resultB.value.error : resultB.reason
      setSlotB((s) => ({
        ...s,
        loading: false,
        error: isAbortLikeError(error) ? null : 'Søk B feilet. Sjekk konsollen for detaljer.',
      }))
    }

    if (resultH.status === 'fulfilled' && resultH.value.status === 'success') {
      setSlotHelsedir((s) => ({ ...s, loading: false, response: resultH.value.data ?? null }))
    } else {
      const error =
        resultH.status === 'fulfilled' ? resultH.value.error : resultH.reason
      setSlotHelsedir((s) => ({
        ...s,
        loading: false,
        error: isAbortLikeError(error) ? null : 'Helsedir-søk feilet. Sjekk konsollen for detaljer.',
      }))
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
