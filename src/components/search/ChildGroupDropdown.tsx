import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { IoArrowForward } from "react-icons/io5";
import { buildContentUrl } from "../../lib/contentUrl";
import { getDisplayTitle } from "../../lib/displayTitle";
import type { SearchResultChildGroup } from "../../types";

const MOBILE_MAX_WIDTH_PX = 767;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH_PX}px)`;

const DROPDOWN_MARGIN_PX = 4; // gap between chip and dropdown
const DROPDOWN_MIN_WIDTH_PX = 240; // floor so list is never too narrow
const DROPDOWN_MAX_HEIGHT_PX = 512; // matches md:max-h-[min(70vh,32rem)]
const DROPDOWN_VIEWPORT_BUFFER_PX = 8; // minimum clearance from viewport edges

interface ChildGroupDropdownProps {
  resultId: string;
  resultTitle: string;
  childGroups: SearchResultChildGroup[];
  searchQuery: string;
  cardRef: RefObject<HTMLDivElement | null>;
  onOpenChange: (isOpen: boolean) => void;
  onPinChange?: (hasPinned: boolean) => void;
  shouldClearPin?: boolean;
}

export function ChildGroupDropdown({
  resultId,
  resultTitle,
  childGroups,
  searchQuery,
  cardRef,
  onOpenChange,
  onPinChange,
  shouldClearPin = false,
}: ChildGroupDropdownProps) {
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipWrapperEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const [pinnedChildGroupKey, setInternalPinnedKey] = useState<string | null>(null);
  const [hoveredChildGroupKey, setHoveredChildGroupKey] = useState<string | null>(null);
  const [flippedVerticalGroups, setFlippedVerticalGroups] = useState<Set<string>>(new Set());
  const [dropdownMaxWidths, setDropdownMaxWidths] = useState<Map<string, number>>(new Map());

  // Reset internal pin state when shouldClearPin becomes true.
  // Uses useState to track previous prop value — the React-recommended pattern
  // for "storing information from previous renders" (react.dev/reference/react/useState).
  const [prevShouldClearPin, setPrevShouldClearPin] = useState(shouldClearPin);
  if (prevShouldClearPin !== shouldClearPin) {
    setPrevShouldClearPin(shouldClearPin);
    if (shouldClearPin && pinnedChildGroupKey !== null) {
      setInternalPinnedKey(null);
    }
  }

  const effectivePinnedChildGroupKey = shouldClearPin ? null : pinnedChildGroupKey;
  const isAnyGroupOpen = effectivePinnedChildGroupKey !== null || hoveredChildGroupKey !== null;

  useEffect(() => {
    onOpenChange(isAnyGroupOpen);
  }, [isAnyGroupOpen, onOpenChange]);

  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    onPinChange?.(isAnyGroupOpen);
  }, [isAnyGroupOpen, onPinChange]);

  /**
   * Pre-calculate placement based on chip wrapper's viewport position.
   * Always positions the dropdown to the RIGHT; constrains maxWidth to fit screen.
   */
  const calculateDropdownPlacement = (groupKey: string) => {
    if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) return;

    const wrapperEl = chipWrapperEls.current.get(groupKey);
    if (!wrapperEl) return;

    const rect = wrapperEl.getBoundingClientRect();

    // Available space to the right of the chip button
    const availableRight = window.innerWidth - rect.right - DROPDOWN_MARGIN_PX - DROPDOWN_VIEWPORT_BUFFER_PX;
    const maxWidth = Math.max(availableRight, DROPDOWN_MIN_WIDTH_PX);

    setDropdownMaxWidths((prev) => {
      if (prev.get(groupKey) === maxWidth) return prev;
      const next = new Map(prev);
      next.set(groupKey, maxWidth);
      return next;
    });

    // Flip UP only when dropdown doesn't fit below AND there is more space above
    const cappedHeight = Math.min(DROPDOWN_MAX_HEIGHT_PX, window.innerHeight * 0.7);
    const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_VIEWPORT_BUFFER_PX;
    const spaceAbove = rect.top - DROPDOWN_VIEWPORT_BUFFER_PX;
    const shouldFlipVertical = spaceBelow < cappedHeight && spaceAbove > spaceBelow;

    setFlippedVerticalGroups((prev) => {
      if (shouldFlipVertical === prev.has(groupKey)) return prev;
      const next = new Set(prev);
      if (shouldFlipVertical) next.add(groupKey);
      else next.delete(groupKey);
      return next;
    });
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!effectivePinnedChildGroupKey) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (cardRef.current?.contains(target)) return;
      setInternalPinnedKey(null);
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [effectivePinnedChildGroupKey, cardRef]);

  useEffect(() => {
    if (!isAnyGroupOpen) return;
    if (!window.matchMedia(MOBILE_MEDIA_QUERY).matches) return;

    const handleScroll = (event: Event) => {
      const activeKey = effectivePinnedChildGroupKey ?? hoveredChildGroupKey;
      const activeWrapperEl = activeKey ? chipWrapperEls.current.get(activeKey) : null;
      const target = event.target;

      if (
        activeWrapperEl &&
        target instanceof Node &&
        activeWrapperEl.contains(target)
      ) {
        return;
      }

      setInternalPinnedKey(null);
      setHoveredChildGroupKey(null);
    };

    window.addEventListener("scroll", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isAnyGroupOpen, effectivePinnedChildGroupKey, hoveredChildGroupKey]);

  const handleChildGroupToggle = (
    groupKey: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    const nextPinnedKey = pinnedChildGroupKey === groupKey ? null : groupKey;
    setInternalPinnedKey(nextPinnedKey);

    if (nextPinnedKey) {
      calculateDropdownPlacement(groupKey);
    }
  };

  const handleChildGroupHover = (groupKey: string) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    if (effectivePinnedChildGroupKey && effectivePinnedChildGroupKey !== groupKey) {
      setInternalPinnedKey(null);
    }
    calculateDropdownPlacement(groupKey);
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
        const isPinnedOpen = effectivePinnedChildGroupKey === groupKey;
        const isHoverOpen =
          effectivePinnedChildGroupKey === null && hoveredChildGroupKey === groupKey;
        const isOpen = isPinnedOpen || isHoverOpen;
        const isFlippedVertical = flippedVerticalGroups.has(groupKey);
        const maxWidth = dropdownMaxWidths.get(groupKey);

        return (
          <div
            key={groupKey}
            ref={(el) => {
              if (el) chipWrapperEls.current.set(groupKey, el);
              else chipWrapperEls.current.delete(groupKey);
            }}
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
                inert={!isOpen}
                style={maxWidth !== undefined ? { maxWidth } : undefined}
                className={`absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md transition-opacity duration-100 md:mt-0 md:min-w-60 md:w-max md:shadow-lg ${
                  isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                } md:left-full md:right-auto md:ml-1 ${
                  isFlippedVertical
                    ? "md:top-auto md:bottom-0"
                    : "md:top-0 md:bottom-auto"
                }`}
              >
                <div className="relative">
                  <div className="max-h-[min(38vh,14rem)] overflow-x-hidden overflow-y-auto overscroll-contain md:max-h-[min(70vh,32rem)]">
                    {items.map((item) => {
                      const documentUrl = item.document_url?.trim() || "";
                      const isPdfOnly = Boolean(item.is_pdf_only && documentUrl);
                      const childHref = isPdfOnly ? documentUrl : buildContentUrl(item);
                      const itemTitle = getDisplayTitle(item, item.title);

                      return isPdfOnly ? (
                        <a
                          key={item.id}
                          href={childHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/item flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm text-[#025169] hover:bg-[#e8f4f8] last:border-b-0"
                        >
                          <span className="min-w-0 break-words group-hover/item:underline">
                            {itemTitle}
                            {(
                              <span className="ml-2 rounded-full bg-[#fff7ed] px-2 py-0.5 text-[0.65rem] font-medium text-[#7c2d12]">
                                PDF
                              </span>
                            )}
                          </span>
                          <IoArrowForward className="h-3.5 w-3.5 shrink-0 opacity-60" />
                        </a>
                      ) : (
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
                            skipHelsedirFallback: false,
                          }}
                          className="group/item flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm text-[#025169] hover:bg-[#e8f4f8] last:border-b-0"
                        >
                          <span className="min-w-0 break-words group-hover/item:underline">
                            {itemTitle}
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
