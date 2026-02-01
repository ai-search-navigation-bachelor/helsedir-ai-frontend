import { Paragraph } from '@digdir/designsystemet-react';
import type { CategoryGroup } from '../../api/categorized';

export function TemaSideCard(props: { category: CategoryGroup; searchQuery: string; searchId?: string }) {
  return (
    <div className="border-b border-slate-200 pb-6">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
        <Paragraph style={{ color: '#64748b', margin: 0 }}>
          Temaside – Kommer snart
        </Paragraph>
      </div>
    </div>
  );
}
