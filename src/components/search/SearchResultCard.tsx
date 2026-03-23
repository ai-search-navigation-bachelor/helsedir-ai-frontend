import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { HiArrowRight } from "react-icons/hi2";
import { buildContentUrl } from "../../lib/contentUrl";
import { getDisplayTitle } from "../../lib/displayTitle";
import { ChildGroupDropdown } from "./ChildGroupDropdown";
import { useRolesQuery } from "../../hooks/queries/useRolesQuery";
import { useRoleStore } from "../../stores/roleStore";
import { RoleIcon } from "../../utils/roleIcons";
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

function getFullSourceTitle(source?: {
  title?: string | null;
  tittel?: string | null;
  display_title?: string | null;
  short_title?: string | null;
  kortTittel?: string | null;
} | null) {
  const candidates = [
    source?.title,
    source?.tittel,
    source?.display_title,
    source?.short_title,
    source?.kortTittel,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
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

  const { data: roles } = useRolesQuery();
  const selectedRole = useRoleStore((s) => s.role);
  const roleDisplayNames = new Map(roles?.map((r) => [r.slug, r.display_name]));
  const roleTags = result.role_tags ?? [];

  const isTemaside = result.info_type === "temaside";
  const childGroups = Array.isArray(result.children) ? result.children : [];
  const resultTitle = getDisplayTitle(result, result.title);
  const cardTitle = isTemaside
    ? resultTitle.toLocaleUpperCase("nb-NO")
    : resultTitle;
  const categoryLabel = result.categoryName;
  const temasidePath = temasidePathById.get(result.id);
  const contentHref = isTemaside
    ? temasidePath || buildContentUrl(result)
    : buildContentUrl(result);
  const documentUrl = result.document_url?.trim() || "";
  const isPdfOnly = Boolean(result.is_pdf_only && documentUrl);
  const sourceContent = result.root_publication ?? result.parent ?? null;
  const sourceTitle = getFullSourceTitle(sourceContent);
  const normalizedResultTitle = resultTitle.trim().toLocaleLowerCase("nb-NO");
  const normalizedSourceTitle = sourceTitle.toLocaleLowerCase("nb-NO");
  const isSelfSource =
    sourceContent?.id === result.id ||
    (Boolean(normalizedSourceTitle) && normalizedSourceTitle === normalizedResultTitle);
  const hasSource = !isTemaside && Boolean(sourceTitle) && !isSelfSource;

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
          aria-label={`Åpne PDF-dokument for ${resultTitle} i ny fane`}
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
            sourceContentTitle: sourceTemasideId ? undefined : resultTitle,
            searchCategoryId: result.categoryId,
            searchCategoryName: result.categoryName,
            contentType: result.info_type,
            skipHelsedirFallback: Boolean(result.is_pdf_only && documentUrl),
          }}
          aria-label={`Åpne ${resultTitle}`}
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
              {"PDF"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {roleTags.map((slug) => (
            <span
              key={slug}
              title={roleDisplayNames.get(slug) ?? slug}
              style={{
                opacity: slug === selectedRole ? 1 : 0.35,
                color: slug === selectedRole ? '#025169' : '#64748b',
                transition: 'opacity 0.15s ease',
                display: 'inline-flex',
              }}
            >
              <RoleIcon slug={slug} size={13} />
            </span>
          ))}
          <HiArrowRight
            size={16}
            className="text-[#025169] opacity-0 transition-opacity duration-150 group-hover:opacity-100"
          />
        </div>
      </div>

      <h3 className="relative z-10 mb-1 font-title text-[1.05rem] font-semibold leading-snug text-gray-900 pointer-events-none">
        {cardTitle}
      </h3>

      {hasSource && (
        <p className="relative z-10 mt-3 text-xs pointer-events-none">
          <span className="font-semibold text-slate-600">Hentet fra:</span>{" "}
          <span className="text-slate-500">{sourceTitle}</span>
        </p>
      )}

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
          resultTitle={resultTitle}
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
