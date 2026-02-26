import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { buildContentUrl } from "../../lib/contentUrl";
import type { SearchResultChildGroup } from "../../types";

interface ChildGroupDropdownProps {
  resultId: string;
  resultTitle: string;
  childGroups: SearchResultChildGroup[];
  searchQuery: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onOpenChange: (isOpen: boolean) => void;
}

export function ChildGroupDropdown({
  resultId,
  resultTitle,
  childGroups,
  searchQuery,
  cardRef,
  onOpenChange,
}: ChildGroupDropdownProps) {
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const [pinnedChildGroupKey, setPinnedChildGroupKey] = useState<string | null>(null);
  const [hoveredChildGroupKey, setHoveredChildGroupKey] = useState<string | null>(null);
  const [flippedVerticalGroups, setFlippedVerticalGroups] = useState<Set<string>>(new Set());
  const [flippedHorizontalGroups, setFlippedHorizontalGroups] = useState<Set<string>>(new Set());

  const isAnyGroupOpen = pinnedChildGroupKey !== null || hoveredChildGroupKey !== null;

  // Notify parent whenever open state changes
  useEffect(() => {
    onOpenChange(isAnyGroupOpen);
  }, [isAnyGroupOpen, onOpenChange]);

  // On desktop, correct dropdown placement if it overflows viewport bounds.
  // Runs in useLayoutEffect so the correction happens before browser paint.
  useLayoutEffect(() => {
    const activeKey = pinnedChildGroupKey ?? hoveredChildGroupKey;
    if (!activeKey) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    const el = dropdownEls.current.get(activeKey);
    if (!el) return;
    const rect = el.getBoundingClientRect();

    if (rect.bottom > window.innerHeight - 8) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional layout correction before paint
      setFlippedVerticalGroups((prev) =>
        prev.has(activeKey) ? prev : new Set([...prev, activeKey]),
      );
    }

    if (rect.right > window.innerWidth - 8) {
      setFlippedHorizontalGroups((prev) =>
        prev.has(activeKey) ? prev : new Set([...prev, activeKey]),
      );
    }
  }, [
    pinnedChildGroupKey,
    hoveredChildGroupKey,
  ]);

  // Clean up leave timer on unmount
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  // Close pinned dropdown when clicking outside the card
  useEffect(() => {
    if (!pinnedChildGroupKey) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (cardRef.current?.contains(target)) return;
      setPinnedChildGroupKey(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [pinnedChildGroupKey, cardRef]);

  // On mobile, close floating overlays when the user scrolls the page/content.
  useEffect(() => {
    if (!isAnyGroupOpen) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    const handleScroll = (event: Event) => {
      const activeKey = pinnedChildGroupKey ?? hoveredChildGroupKey;
      const activeDropdownEl = activeKey ? dropdownEls.current.get(activeKey) : null;
      const target = event.target;

      if (
        activeDropdownEl &&
        target instanceof Node &&
        activeDropdownEl.contains(target)
      ) {
        return;
      }

      setPinnedChildGroupKey(null);
      setHoveredChildGroupKey(null);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isAnyGroupOpen, pinnedChildGroupKey, hoveredChildGroupKey]);

  const resetFlipForGroup = (groupKey: string) => {
    setFlippedVerticalGroups((prev) => {
      if (!prev.has(groupKey)) return prev;
      const next = new Set(prev);
      next.delete(groupKey);
      return next;
    });
    setFlippedHorizontalGroups((prev) => {
      if (!prev.has(groupKey)) return prev;
      const next = new Set(prev);
      next.delete(groupKey);
      return next;
    });
  };

  const handleChildGroupToggle = (
    groupKey: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setPinnedChildGroupKey((prev) => (prev === groupKey ? null : groupKey));
    resetFlipForGroup(groupKey);
  };

  const handleChildGroupHover = (groupKey: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (pinnedChildGroupKey && pinnedChildGroupKey !== groupKey) {
      setPinnedChildGroupKey(null);
    }
    // Reset placement flags so the dropdown renders in its default position before measuring.
    resetFlipForGroup(groupKey);
    setHoveredChildGroupKey(groupKey);
  };

  const handleChildGroupLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setHoveredChildGroupKey(null);
    }, 150);
  };

  return (
    <div className="relative z-20 mt-2 flex flex-wrap gap-2">
      {childGroups.map((group) => {
        const items = Array.isArray(group.items) ? group.items : [];
        const groupKey = `${resultId}-${group.info_type}`;
        const isPinnedOpen = pinnedChildGroupKey === groupKey;
        const isHoverOpen =
          pinnedChildGroupKey === null && hoveredChildGroupKey === groupKey;
        const isOpen = isPinnedOpen || isHoverOpen;
        const isFlippedVertical = flippedVerticalGroups.has(groupKey);
        const isFlippedHorizontal = flippedHorizontalGroups.has(groupKey);

        return (
          <div
            key={groupKey}
            data-child-group-key={groupKey}
            className="inline-block md:relative"
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
                inert={!isOpen}
                className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-opacity duration-100 md:mt-0 md:min-w-[20rem] md:w-max md:max-w-[min(42rem,92vw)] md:shadow-lg ${
                  isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } ${
                  isFlippedHorizontal
                    ? "md:left-auto md:right-full md:mr-2 md:ml-0"
                    : "md:left-full md:right-auto md:ml-2 md:mr-0"
                } ${
                  isFlippedVertical
                    ? "md:top-auto md:bottom-0"
                    : "md:top-0 md:bottom-auto"
                }`}
              >
                <div className="relative">
                  <div className="max-h-[min(38vh,14rem)] overflow-x-hidden overflow-y-auto overscroll-contain md:max-h-[min(70vh,32rem)]">
                    {items.map((item) => {
                      const childHref = buildContentUrl(item);

                      return (
                        <Link
                          key={item.id}
                          to={childHref}
                          state={{
                            fromSearch: true,
                            searchQuery,
                            sourceTemasideId: resultId,
                            sourceContentId: item.id,
                            sourceContentTitle: resultTitle,
                            searchCategoryId: group.info_type,
                            searchCategoryName: group.display_name,
                            contentType: item.info_type,
                          }}
                          className="group/item flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm text-[#025169] hover:bg-[#e8f4f8] last:border-b-0"
                        >
                          <span className="min-w-0 break-words group-hover/item:underline">
                            {item.title}
                          </span>
                          <IoArrowForward className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </Link>
                      );
                    })}
                  </div>

                  {items.length > 4 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-white/85 to-transparent md:hidden"
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
