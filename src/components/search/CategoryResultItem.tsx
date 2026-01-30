import { useQuery } from '@tanstack/react-query';
import { ChevronRightIcon } from '@navikt/aksel-icons';
import { getContentApi } from '../../api/search';
import type { ContentDetail } from '../../api/types';

export interface CategoryResultItemProps {
  result: { id: string; title: string };
  searchId?: string;
  variant: 'temaside' | 'retningslinje' | 'regular';
}

export function CategoryResultItem({ result, searchId, variant }: CategoryResultItemProps) {
  const shouldFetch = variant !== 'temaside';

  const { data: content } = useQuery<ContentDetail, Error>({
    queryKey: ['content', result.id, searchId],
    queryFn: async () => getContentApi(result.id, searchId),
    enabled: shouldFetch,
    staleTime: 10 * 60 * 1000,
  });

  const rootLink = content?.links?.find((link) => link.rel === 'root');

  if (variant === 'temaside') {
    return (
      <div className="flex items-center justify-between gap-4">
        <span className="font-semibold text-blue-600">{result.title}</span>
        <ChevronRightIcon className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {result.title}
        </h4>

        <p className="text-sm text-slate-600 mt-1">
          <span className="font-semibold text-slate-900">Hentet fra:</span>{' '}
          {rootLink?.tittel ?? 'Dette er et utdrag fra innholdet.'}
        </p>
      </div>

      <ChevronRightIcon className="h-5 w-5 text-slate-500 group-hover:text-blue-600 transition-colors mt-0.5" />
    </div>
  );
}
