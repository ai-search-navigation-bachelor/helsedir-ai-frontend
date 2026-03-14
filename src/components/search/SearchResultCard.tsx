import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";
import { buildContentUrl } from "../../lib/contentUrl";
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
  onPinChange?: (cardId: string, hasPinned: boolean) => void;
  shouldClearPin?: boolean;
}

function isPdfHref(href: string) {
  return /\.pdf(?:$|[?#])/i.test(href);
}

export function SearchResultCard({
  result,
  searchQuery,
  sourceTemasideId,
  temasidePathById,
  onPinChange,
  shouldClearPin = false,
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
  const contentHref = isTemaside
    ? temasidePath || buildContentUrl(result)
    : buildContentUrl(result);
  const documentUrl = result.document_url?.trim() || "";
  const isPdfOnly = Boolean(result.is_pdf_only && documentUrl);
  const isPdfDocument = isPdfHref(documentUrl);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setIsAnyGroupOpen(isOpen);
  }, []);

  const handlePinChange = useCallback((hasPinned: boolean) => {
    onPinChange?.(result.id, hasPinned);
  }, [onPinChange, result.id]);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white border-l-[3px] border-[#025169] px-5 py-4 rounded-xl ring-1 ring-gray-100 shadow-sm transition-shadow duration-150 hover:shadow-md"
      style={isAnyGroupOpen ? { zIndex: 100 } : undefined}
    >
      {isPdfOnly ? (
        <a
          href={documentUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Åpne dokument for ${result.title} i ny fane`}
          className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#025169]"
        />
      ) : (
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
            skipHelsedirFallback: Boolean(result.is_pdf_only && documentUrl),
          }}
          aria-label={`Åpne ${result.title}`}
          className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#025169]"
        />
      )}

      <div className="relative z-10 mb-2 flex items-center justify-between pointer-events-none">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block rounded-full bg-[#e8f4f8] px-2.5 py-0.5 text-xs font-medium text-[#025169]">
            {categoryLabel}
          </span>
          {isPdfOnly && (
            <span className="inline-block rounded-full bg-[#fff7ed] px-2.5 py-0.5 text-xs font-medium text-[#7c2d12]">
              {isPdfDocument ? "PDF" : "Dokument"}
            </span>
          )}
        </div>
        <HiArrowRight
          size={16}
          className="text-[#025169] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        />
      </div>

      <h3 className="relative z-10 mb-1 font-title text-[1.05rem] font-semibold leading-snug text-gray-900 pointer-events-none">
        {cardTitle}
      </h3>

      {!isTemaside &&
        result.explanation &&
        !result.explanation.toLowerCase().includes("keyword") &&
        !result.explanation.toLowerCase().includes("semantic") &&
        !result.explanation.toLowerCase().includes("fuzzy match") && (
          <p className="relative z-10 mt-1 line-clamp-2 text-sm text-gray-600 pointer-events-none">
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
          onPinChange={handlePinChange}
          shouldClearPin={shouldClearPin}
        />
      )}
    </div>
  );
}
