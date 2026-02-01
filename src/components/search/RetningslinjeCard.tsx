import type { CategoryGroup } from '../../types';
import { ExpandableCategoryCard } from './ExpandableCategoryCard';

export function RetningslinjeCard(props: {
  category: CategoryGroup;
}) {
  return (
    <ExpandableCategoryCard
      category={props.category}
    />
  );
}
