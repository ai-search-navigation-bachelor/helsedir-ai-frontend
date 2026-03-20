import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDevModels, selectDevModel } from '../../api/training'

export function useDevModelsQuery() {
  return useQuery({
    queryKey: ['dev-models'],
    queryFn: ({ signal }) => getDevModels(signal),
    staleTime: 60_000,
  })
}

export function useSelectDevModel() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (presetId: number) => selectDevModel(presetId),
    onSuccess: (_data, presetId) => {
      queryClient.setQueryData(['dev-models'], (old: Awaited<ReturnType<typeof getDevModels>> | undefined) =>
        old?.map((m) => ({ ...m, active: m.preset_id === presetId })),
      )
    },
  })
}
