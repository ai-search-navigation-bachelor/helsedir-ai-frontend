import { Paragraph } from '@digdir/designsystemet-react';
import type { CategoryGroup } from '../../types';

export function TemaSideCard(props: {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
}) {
  return (
    <div id={`category-${props.category.category}`} className="mb-6">
      <div className="bg-white border border-slate-200 rounded-lg">
        {/* Category header */}
        <div className="px-5 py-4 border-b border-slate-200">
          <div className="font-semibold text-slate-900 text-lg mb-1">
            {props.category.display_name}
          </div>
          <div className="text-sm text-slate-500">
            {props.category.count} treff
          </div>
        </div>

        <div className="px-5 pb-5 pt-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
            <Paragraph style={{ color: '#64748b', margin: 0 }}>
              Temaside – Kommer snart
            </Paragraph>
          </div>
        </div>
      </div>
    </div>
  );
}
