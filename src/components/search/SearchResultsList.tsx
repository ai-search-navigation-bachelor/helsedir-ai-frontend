import { Alert, Paragraph } from "@digdir/designsystemet-react";
import { useMemo } from "react";
import { SearchResultCard } from "./SearchResultCard";
import { useTemasidePathMap } from "../../hooks/queries/useTemasidePathMap";
import type { SearchResult } from "../../types";

interface SearchResultsListProps {
  results: Array<
    SearchResult & {
      categoryName: string;
      categoryId: string;
    }
  >;
  searchQuery: string;
  activeTab?: string;
  activeTabLabel?: string;
}

export function SearchResultsList({
  results,
  searchQuery,
  activeTab = "all",
  activeTabLabel,
}: SearchResultsListProps) {
  const temasidePathById = useTemasidePathMap();

  const sourceTemasideByContentId = useMemo(() => {
    const map = new Map<string, string>();

    results.forEach((result) => {
      if (result.info_type !== "temaside" || !Array.isArray(result.children)) {
        return;
      }

      result.children.forEach((group) => {
        if (!Array.isArray(group.items)) {
          return;
        }

        group.items.forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, result.id);
          }
        });
      });
    });

    return map;
  }, [results]);

  const normalizedLabel = (activeTabLabel || "").trim().toLocaleLowerCase("nb-NO");
  const resultsLabel =
    activeTab === "all" || !normalizedLabel
      ? `${results.length} treff på ${searchQuery}`
      : `${results.length} ${normalizedLabel} treff på ${searchQuery}`;

  return (
    <>
      {/* Results Count */}
      <div className="mb-3">
        <Paragraph className="text-sm text-gray-700">
          {resultsLabel}
        </Paragraph>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <Alert>
          <Paragraph>Ingen resultater funnet i denne kategorien.</Paragraph>
        </Alert>
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((result, index) => (
            <SearchResultCard
              key={`${result.id}-${index}`}
              result={result}
              searchQuery={searchQuery}
              sourceTemasideId={sourceTemasideByContentId.get(result.id)}
              temasidePathById={temasidePathById}
            />
          ))}
        </div>
      )}
    </>
  );
}
