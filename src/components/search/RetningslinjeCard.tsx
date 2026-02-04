import type { CategoryGroup } from '../../types';
import { ExpandableCategoryCard } from './ExpandableCategoryCard';

export function RetningslinjeCard(props: {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
}) {
  return (
    <ExpandableCategoryCard category={props.category} />
  );
}
