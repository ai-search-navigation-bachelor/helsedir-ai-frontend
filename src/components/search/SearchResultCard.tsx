import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { stripTemasidePrefix } from "../../lib/path";
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

function getCategoryRootPath(path?: string) {
  if (!path) return undefined;
  const normalizedPath = stripTemasidePrefix(path);
  const segments = normalizedPath.split("/").filter(Boolean);
  if (segments.length === 0) return undefined;
  return `/${segments[0]}`;
}

export function SearchResultCard({
  result,
  searchQuery,
  sourceTemasideId,
  temasidePathById,
}: SearchResultCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pinnedChildGroupKey, setPinnedChildGroupKey] = useState<string | null>(
    null,
  );
  const [hoveredChildGroupKey, setHoveredChildGroupKey] = useState<
    string | null
  >(null);
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
  const sourceTemasidePath = sourceTemasideId
    ? temasidePathById.get(sourceTemasideId)
    : undefined;
  const sourceCategoryPath = getCategoryRootPath(sourceTemasidePath);
  const contentHref = isTemaside
    ? normalizedTemasidePath || `/content/${result.id}`
    : sourceCategoryPath
      ? `${sourceCategoryPath}/${result.id}`
      : `/content/${result.id}`;

  const handleChildGroupToggle = (
    groupKey: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setPinnedChildGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  const handleChildGroupHover = (groupKey: string) => {
    if (pinnedChildGroupKey && pinnedChildGroupKey !== groupKey) {
      setPinnedChildGroupKey(null);
    }
    setHoveredChildGroupKey(groupKey);
  };

  const handleChildGroupLeave = (groupKey: string) => {
    if (hoveredChildGroupKey === groupKey) {
      setHoveredChildGroupKey(null);
    }
  };

  useEffect(() => {
    if (!pinnedChildGroupKey) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (cardRef.current?.contains(target)) return;

      event.preventDefault();
      event.stopPropagation();
      setPinnedChildGroupKey(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown,
        true,
      );
    };
  }, [pinnedChildGroupKey]);

  return (
    <div
      ref={cardRef}
      className="relative bg-white border-l-4 border-[#047FA4] p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
        className="absolute inset-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#005F73]"
      />

      <div className="relative z-10 mb-2 pointer-events-none">
        <span className="inline-block px-2.5 py-0.5 text-xs font-medium text-[#047FA4] bg-[#e6f2f6] rounded-md">
          {categoryLabel}
        </span>
      </div>

      <h3 className="relative z-10 pointer-events-none text-lg font-semibold text-gray-900 mb-2 leading-snug">
        {cardTitle}
      </h3>

      {!isTemaside &&
        result.explanation &&
        !result.explanation.toLowerCase().includes("keyword") &&
        !result.explanation.toLowerCase().includes("semantic") &&
        !result.explanation.toLowerCase().includes("fuzzy match") && (
          <p className="relative z-10 pointer-events-none text-sm text-gray-700 line-clamp-2">
            {result.explanation}
          </p>
        )}

      {isTemaside && childGroups.length > 0 && (
        <div className="relative z-20 mt-2 flex flex-wrap gap-2">
          {childGroups.map((group) => {
            const items = Array.isArray(group.items) ? group.items : [];
            const groupKey = `${result.id}-${group.info_type}`;
            const isPinnedOpen = pinnedChildGroupKey === groupKey;
            const isHoverOpen =
              pinnedChildGroupKey === null && hoveredChildGroupKey === groupKey;
            const isOpen = isPinnedOpen || isHoverOpen;

            return (
              <div
                key={groupKey}
                data-child-group-key={groupKey}
                className="relative inline-block"
                onMouseEnter={() => handleChildGroupHover(groupKey)}
                onMouseLeave={() => handleChildGroupLeave(groupKey)}
              >
                <button
                  type="button"
                  onClick={(event) => handleChildGroupToggle(groupKey, event)}
                  className="inline-flex min-w-[14.25rem] max-w-full items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <span className="font-semibold text-slate-600 shrink-0">
                    {group.display_name}
                  </span>
                  <IoArrowForward className="h-4 w-4 text-sky-700 shrink-0" />
                </button>

                {items.length > 0 && (
                  <div
                    className={`${isOpen ? "block" : "hidden"} absolute left-0 top-full mt-0 md:left-full md:top-[-0.35rem] md:mt-0 md:ml-0 z-20 w-[min(42rem,92vw)] rounded-lg border border-slate-200 bg-white shadow-lg py-1 overflow-hidden`}
                  >
                    <div className="space-y-1">
                      {items.map((item) => {
                        const childCategoryPath = getCategoryRootPath(temasidePath);
                        const childHref = childCategoryPath
                          ? `${childCategoryPath}/${item.id}`
                          : `/content/${item.id}`;

                        return (
                          <Link
                            key={item.id}
                            to={childHref}
                            state={{
                              fromSearch: true,
                              searchQuery,
                              sourceTemasideId: result.id,
                              sourceContentId: result.id,
                              sourceContentTitle: result.title,
                              searchCategoryId: group.info_type,
                              searchCategoryName: group.display_name,
                              contentType: item.info_type,
                            }}
                            className="group/item block w-full px-3 py-1.5 text-left text-sm text-sky-800 hover:bg-sky-50 cursor-pointer"
                          >
                            <span className="inline-flex w-full items-center justify-between gap-2">
                              <span className="truncate group-hover/item:underline">
                                {item.title}
                              </span>
                              <IoArrowForward className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
