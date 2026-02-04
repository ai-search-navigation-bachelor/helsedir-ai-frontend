import { Alert, Paragraph } from '@digdir/designsystemet-react';
import { SearchResultCard } from './SearchResultCard';
import type { SearchResult } from '../../types';

interface SearchResultsListProps {
  results: Array<SearchResult & {
    categoryName: string;
    categoryId: string;
  }>;
  searchQuery: string;
  searchId?: string;
}

export function SearchResultsList({ results, searchQuery, searchId }: SearchResultsListProps) {
  return (
    <>
      {/* Results Count */}
      <div className="mb-6">
        <Paragraph className="text-gray-700">
          {results.length} treff på {searchQuery}
        </Paragraph>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <Alert>
          <Paragraph>Ingen resultater funnet i denne kategorien.</Paragraph>
        </Alert>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <SearchResultCard
              key={`${result.id}-${index}`}
              result={result}
              searchId={searchId}
            />
          ))}
        </div>
      )}
    </>
  );
}
