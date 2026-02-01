import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon } from '@navikt/aksel-icons';
import { getContent } from '../../api';
import type { ContentDetail } from '../../types';
import { useSearchStore } from '../../stores/searchStore';

export interface CategoryResultItemProps {
  result: { id: string; title: string };
  searchId?: string;
  variant: 'temaside' | 'retningslinje' | 'regular';
}

export function CategoryResultItem({ result, searchId, variant }: CategoryResultItemProps) {
  const storedSearchId = useSearchStore((state) => state.searchId);
  const effectiveSearchId = searchId || storedSearchId || undefined;
  
  const shouldFetch = variant !== 'temaside';

  const { data: content } = useQuery<ContentDetail, Error>({
    queryKey: ['content', result.id, effectiveSearchId],
    queryFn: async () => getContent(result.id, effectiveSearchId),
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000,
  });

  const rootLinkTitle = content?.links?.find((link) => link.rel === 'root')?.tittel;

  if (variant === 'temaside') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ fontWeight: '600', color: '#0f172a' }}>{result.title}</span>
        <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748b', flexShrink: 0 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4 style={{ fontWeight: '600', color: '#0f172a', margin: 0 }}>
          {result.title}
        </h4>

        <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px', margin: '4px 0 0 0' }}>
          <span style={{ fontWeight: '500', color: '#334155' }}>Hentet fra:</span>{' '}
          {rootLinkTitle ?? 'Dette er et utdrag fra innholdet.'}
        </p>
      </div>

      <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
    </div>
  );
}
