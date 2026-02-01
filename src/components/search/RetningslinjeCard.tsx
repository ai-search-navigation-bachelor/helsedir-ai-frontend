import type { CategoryGroup } from '../../types';
import { ExpandableCategoryCard } from './ExpandableCategoryCard';

export function RetningslinjeCard(props: {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
}) {
  return (
    <ExpandableCategoryCard
      category={props.category}
      searchQuery={props.searchQuery}
      searchId={props.searchId}
      variant="retningslinje"
      badgeSuffix="artikler"
      subtitle="Nasjonal faglig retningslinje"
      previewCount={3}
    />
  );
}
