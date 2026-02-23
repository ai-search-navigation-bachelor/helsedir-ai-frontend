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
  const [flippedGroups, setFlippedGroups] = useState<Set<string>>(new Set());

  const isAnyGroupOpen = pinnedChildGroupKey !== null || hoveredChildGroupKey !== null;

  // Notify parent whenever open state changes
  useEffect(() => {
    onOpenChange(isAnyGroupOpen);
  }, [isAnyGroupOpen, onOpenChange]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional layout correction before paint
      setFlippedGroups((prev) => new Set([...prev, activeKey]));
    }
  }, [pinnedChildGroupKey, hoveredChildGroupKey, flippedGroups]);

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

  return (
    <div className="relative z-20 mt-2 flex flex-wrap gap-2">
      {childGroups.map((group) => {
        const items = Array.isArray(group.items) ? group.items : [];
        const groupKey = `${resultId}-${group.info_type}`;
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
                {...(!isOpen ? { inert: true } : {})}
                className={`absolute left-full ml-2 z-20 min-w-[20rem] w-max max-w-[min(42rem,92vw)] rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden transition-opacity duration-100 ${
                  isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } ${isFlipped ? "bottom-0 top-auto" : "top-0"}`}
              >
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
                        sourceContentId: resultId,
                        sourceContentTitle: resultTitle,
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
  );
}
