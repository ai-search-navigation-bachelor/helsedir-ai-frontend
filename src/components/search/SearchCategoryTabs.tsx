import { Tabs } from '@digdir/designsystemet-react';
import {
  TEMASIDE_CATEGORY,
  RETNINGSLINJE_CATEGORY,
  ANBEFALINGER_CATEGORY,
  REGELVERK_CATEGORY,
  RAD_CATEGORY,
} from '../../constants/categories';

// Hardcoded category order
const FIXED_CATEGORIES = [
  { id: TEMASIDE_CATEGORY, label: 'Temaside' },
  { id: RETNINGSLINJE_CATEGORY, label: 'Nasjonalfaglig retningslinje' },
  { id: ANBEFALINGER_CATEGORY, label: 'Anbefaling' },
  { id: REGELVERK_CATEGORY, label: 'Regelverk' },
  { id: RAD_CATEGORY, label: 'Råd' },
];

interface SearchCategoryTabsProps {
  activeTab: string;
  categoryCounts: Record<string, number>;
  onTabChange: (value: string) => void;
}

export function SearchCategoryTabs({ activeTab, categoryCounts, onTabChange }: SearchCategoryTabsProps) {
  return (
    <div className="mb-6">
      <Tabs value={activeTab} onChange={onTabChange}>
        <Tabs.List>
          <Tabs.Tab value="all">
            Alle
            <span className="ml-2 text-gray-600">{categoryCounts['all'] || 0}</span>
          </Tabs.Tab>
          
          {FIXED_CATEGORIES.map(category => (
            <Tabs.Tab key={category.id} value={category.id}>
              {category.label}
              <span className="ml-2 text-gray-600">{categoryCounts[category.id] || 0}</span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
    </div>
  );
}

export { FIXED_CATEGORIES };
