import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";
import { buildContentUrl } from "../../lib/contentUrl";
import { stripTemasidePrefix } from "../../lib/path";
import { ChildGroupDropdown } from "./ChildGroupDropdown";
import type { SearchResult } from "../../types";

interface SearchResultCardProps {
  result: SearchResult & {
    categoryName: string;
    categoryId: string;
  };
  searchQuery: string;
  sourceTemasideId?: string;
  temasidePathById: Map<string, string>;
}

export function SearchResultCard({
  result,
  searchQuery,
  sourceTemasideId,
  temasidePathById,
}: SearchResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isAnyGroupOpen, setIsAnyGroupOpen] = useState(false);

  const isTemaside = result.info_type === "temaside";
  const childGroups = Array.isArray(result.children) ? result.children : [];
  const cardTitle = isTemaside
    ? result.title.toLocaleUpperCase("nb-NO")
    : result.title;
  const categoryLabel = result.categoryName;
  const temasidePath = temasidePathById.get(result.id);
  const normalizedTemasidePath = temasidePath
    ? stripTemasidePrefix(temasidePath)
    : undefined;
  const contentHref = isTemaside
    ? normalizedTemasidePath || buildContentUrl(result)
    : buildContentUrl(result);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setIsAnyGroupOpen(isOpen);
  }, []);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white border-l-[3px] border-[#025169] px-5 py-4 rounded-xl ring-1 ring-gray-100 shadow-sm transition-shadow duration-150 hover:shadow-md"
      style={isAnyGroupOpen ? { zIndex: 100 } : undefined}
    >
      <Link
        to={contentHref}
        state={{
          fromSearch: true,
          searchQuery,
          sourceTemasideId,
          sourceContentId: sourceTemasideId,
          sourceContentTitle: sourceTemasideId ? undefined : result.title,
          searchCategoryId: result.categoryId,
          searchCategoryName: result.categoryName,
          contentType: result.info_type,
        }}
        aria-label={`Åpne ${result.title}`}
        className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#025169]"
      />

      <div className="relative z-10 mb-2 flex items-center justify-between pointer-events-none">
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-[#025169] bg-[#e8f4f8] rounded-full">
          {categoryLabel}
        </span>
        <HiArrowRight
          size={16}
          className="text-[#025169] opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        />
      </div>

      <h3 className="relative z-10 pointer-events-none font-title text-[1.05rem] font-semibold text-gray-900 mb-1 leading-snug">
        {cardTitle}
      </h3>

      {!isTemaside &&
        result.explanation &&
        !result.explanation.toLowerCase().includes("keyword") &&
        !result.explanation.toLowerCase().includes("semantic") &&
        !result.explanation.toLowerCase().includes("fuzzy match") && (
          <p className="relative z-10 pointer-events-none text-sm text-gray-600 line-clamp-2 mt-1">
            {result.explanation}
          </p>
        )}

      {isTemaside && childGroups.length > 0 && (
        <ChildGroupDropdown
          resultId={result.id}
          resultTitle={result.title}
          childGroups={childGroups}
          searchQuery={searchQuery}
          cardRef={cardRef}
          onOpenChange={handleOpenChange}
        />
      )}
    </div>
  );
}
