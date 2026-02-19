import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { HiArrowRight } from "react-icons/hi2";
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
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const [pinnedChildGroupKey, setPinnedChildGroupKey] = useState<string | null>(null);
  const [hoveredChildGroupKey, setHoveredChildGroupKey] = useState<string | null>(null);
  const [flippedGroups, setFlippedGroups] = useState<Set<string>>(new Set());

  const isTemaside = result.info_type === "temaside";
  const childGroups = Array.isArray(result.children) ? result.children : [];
  const isAnyGroupOpen = pinnedChildGroupKey !== null || hoveredChildGroupKey !== null;
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

  // After each render, check if the active dropdown (positioned at top-0) overflows the
  // viewport bottom. If so, flip it upward. Skip the check once already flipped to avoid
  // an infinite loop. Runs in useLayoutEffect so the correction happens before browser paint.
  useLayoutEffect(() => {
    const activeKey = pinnedChildGroupKey ?? hoveredChildGroupKey;
    if (!activeKey || flippedGroups.has(activeKey)) return;

    const el = dropdownEls.current.get(activeKey);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.bottom > window.innerHeight - 8) {
      setFlippedGroups((prev) => new Set([...prev, activeKey]));
    }
  }, [pinnedChildGroupKey, hoveredChildGroupKey, flippedGroups]);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleChildGroupToggle = (
    groupKey: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setPinnedChildGroupKey((prev) => (prev === groupKey ? null : groupKey));
  };

  const handleChildGroupHover = (groupKey: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (pinnedChildGroupKey && pinnedChildGroupKey !== groupKey) {
      setPinnedChildGroupKey(null);
    }
    // Reset flip so the dropdown renders at top-0 and useLayoutEffect can measure correctly.
    setFlippedGroups((prev) => {
      if (!prev.has(groupKey)) return prev;
      const next = new Set(prev);
      next.delete(groupKey);
      return next;
    });
    setHoveredChildGroupKey(groupKey);
  };

  const handleChildGroupLeave = () => {
    leaveTimerRef.current = setTimeout(() => {
      setHoveredChildGroupKey(null);
    }, 150);
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
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [pinnedChildGroupKey]);

  return (
    <div
      ref={cardRef}
      className="group relative bg-white border-l-[3px] border-[#025169] px-5 py-4 rounded-xl ring-1 ring-gray-100 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
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
        <div className="relative z-20 mt-2 flex flex-wrap gap-2">
          {childGroups.map((group) => {
            const items = Array.isArray(group.items) ? group.items : [];
            const groupKey = `${result.id}-${group.info_type}`;
            const isPinnedOpen = pinnedChildGroupKey === groupKey;
            const isHoverOpen =
              pinnedChildGroupKey === null && hoveredChildGroupKey === groupKey;
            const isOpen = isPinnedOpen || isHoverOpen;
            const isFlipped = flippedGroups.has(groupKey);

            return (
              <div
                key={groupKey}
                data-child-group-key={groupKey}
                className="relative inline-block"
                onMouseEnter={() => handleChildGroupHover(groupKey)}
                onMouseLeave={handleChildGroupLeave}
              >
                <button
                  type="button"
                  onClick={(event) => handleChildGroupToggle(groupKey, event)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors duration-100 ${
                    isOpen
                      ? "border-[#025169] bg-[#025169] text-white"
                      : "border-slate-300 bg-white text-[#025169] hover:border-[#025169] hover:bg-[#e8f4f8]"
                  }`}
                >
                  <span className="shrink-0">{group.display_name}</span>
                  <IoArrowForward className="h-3.5 w-3.5 shrink-0" />
                </button>

                {items.length > 0 && (
                  <div
                    ref={(el) => {
                      if (el) dropdownEls.current.set(groupKey, el);
                      else dropdownEls.current.delete(groupKey);
                    }}
                    className={`absolute left-full ml-2 z-20 min-w-[20rem] w-max max-w-[min(42rem,92vw)] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden transition-opacity duration-100 ${
                      isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    } ${isFlipped ? "bottom-0 top-auto" : "top-0"}`}
                  >
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
                          className="group/item flex w-full items-center justify-between gap-3 px-4 py-2.5 text-sm text-[#025169] hover:bg-[#e8f4f8] border-b border-slate-100 last:border-b-0"
                        >
                          <span className="group-hover/item:underline">
                            {item.title}
                          </span>
                          <IoArrowForward className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </Link>
                      );
                    })}
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
