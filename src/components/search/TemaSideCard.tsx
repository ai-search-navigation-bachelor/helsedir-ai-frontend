import type { CategoryGroup } from '../../api/categorized';
import { ExpandableCategoryCard } from './ExpandableCategoryCard';

export function TemaSideCard(props: { category: CategoryGroup; searchQuery: string; searchId?: string }) {
  return (
    <ExpandableCategoryCard
      category={props.category}
      searchQuery={props.searchQuery}
      searchId={props.searchId}
      variant="temaside"
      badgeSuffix="artikler"
      subtitle="Temaside"
      previewCount={3}
    />
  );
}
