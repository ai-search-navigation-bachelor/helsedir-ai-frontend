import { Alert, Paragraph, Spinner } from "@digdir/designsystemet-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  total?: number;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function SearchResultsList({
  results,
  searchQuery,
  activeTab = "all",
  activeTabLabel,
  total,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: SearchResultsListProps) {
  const temasidePathById = useTemasidePathMap();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const handleCardPinChange = useCallback(
    (cardId: string, isActive: boolean) => {
      setActiveCardId(isActive ? cardId : null);
    },
    [],
  );

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

  // Infinite scroll: observe sentinel element
  useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, hasNextPage, isFetchingNextPage]);

  const normalizedLabel = (activeTabLabel || "")
    .trim()
    .toLocaleLowerCase("nb-NO");
  const displayCount = total ?? results.length;
  const resultsLabel =
    activeTab === "all" || !normalizedLabel
      ? `${displayCount} treff på "${searchQuery}"`
      : `${displayCount} ${normalizedLabel}-treff på "${searchQuery}"`;

  return (
    <>
      {/* Results Count */}
      <div className="mb-3">
        <Paragraph className="text-sm text-gray-700">{resultsLabel}</Paragraph>
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
              onPinChange={handleCardPinChange}
              shouldClearPin={
                activeCardId !== null && activeCardId !== result.id
              }
            />
          ))}

          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} aria-hidden="true" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Spinner aria-label="Laster flere resultater" data-size="md" />
            </div>
          )}
        </div>
      )}
    </>
  );
}
