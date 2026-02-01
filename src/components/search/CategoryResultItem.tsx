import { ChevronRightIcon } from '@navikt/aksel-icons';

export interface CategoryResultItemProps {
  result: { id: string; title: string };
  variant: 'temaside' | 'retningslinje' | 'regular';
}

export function CategoryResultItem({ result, variant }: CategoryResultItemProps) {

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
          <span style={{ fontWeight: '500', color: '#334155' }}>Hentet fra:</span> ...
        </p>
      </div>

      <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
    </div>
  );
}
