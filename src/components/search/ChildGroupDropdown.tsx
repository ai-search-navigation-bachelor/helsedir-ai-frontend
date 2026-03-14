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
import type { SearchResultChildGroup } from "../../types";

const MOBILE_MAX_WIDTH_PX = 767;
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_MAX_WIDTH_PX}px)`;

function isPdfHref(href: string) {
  return /\.pdf(?:$|[?#])/i.test(href);
}

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
  const measureFrameRef = useRef<number | null>(null);
  const dropdownEls = useRef<Map<string, HTMLDivElement>>(new Map());

  const [pinnedChildGroupKey, setInternalPinnedKey] = useState<string | null>(null);
  const [hoveredChildGroupKey, setHoveredChildGroupKey] = useState<string | null>(null);
  const [flippedVerticalGroups, setFlippedVerticalGroups] = useState<Set<string>>(new Set());
  const [flippedHorizontalGroups, setFlippedHorizontalGroups] = useState<Set<string>>(new Set());

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

  const measureDropdownPlacement = (groupKey: string) => {
    if (measureFrameRef.current) {
      cancelAnimationFrame(measureFrameRef.current);
    }

    measureFrameRef.current = requestAnimationFrame(() => {
      measureFrameRef.current = null;

      if (window.matchMedia(MOBILE_MEDIA_QUERY).matches) return;

      const el = dropdownEls.current.get(groupKey);
      if (!el) return;
      const rect = el.getBoundingClientRect();

      setFlippedVerticalGroups((prev) => {
        const shouldFlip = rect.bottom > window.innerHeight - 8;
        const hasFlip = prev.has(groupKey);
        if (shouldFlip === hasFlip) return prev;

        const next = new Set(prev);
        if (shouldFlip) next.add(groupKey);
        else next.delete(groupKey);
        return next;
      });

      setFlippedHorizontalGroups((prev) => {
        const shouldFlip = rect.right > window.innerWidth - 8;
        const hasFlip = prev.has(groupKey);
        if (shouldFlip === hasFlip) return prev;

        const next = new Set(prev);
        if (shouldFlip) next.add(groupKey);
        else next.delete(groupKey);
        return next;
      });
    });
  };

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      if (measureFrameRef.current) cancelAnimationFrame(measureFrameRef.current);
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
      const activeDropdownEl = activeKey ? dropdownEls.current.get(activeKey) : null;
      const target = event.target;

      if (
        activeDropdownEl &&
        target instanceof Node &&
        activeDropdownEl.contains(target)
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
    const nextPinnedKey = pinnedChildGroupKey === groupKey ? null : groupKey;
    setInternalPinnedKey(nextPinnedKey);

    if (nextPinnedKey) {
      resetFlipForGroup(groupKey);
      measureDropdownPlacement(groupKey);
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
    if (hoveredChildGroupKey !== groupKey && effectivePinnedChildGroupKey !== groupKey) {
      resetFlipForGroup(groupKey);
      measureDropdownPlacement(groupKey);
    }
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
                      const documentUrl = item.document_url?.trim() || "";
                      const isPdfOnly = Boolean(item.is_pdf_only && documentUrl);
                      const isPdfDocument = isPdfHref(documentUrl);
                      const childHref = isPdfOnly ? documentUrl : buildContentUrl(item);

                      return isPdfOnly ? (
                        <a
                          key={item.id}
                          href={childHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group/item flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-2.5 text-sm text-[#025169] hover:bg-[#e8f4f8] last:border-b-0"
                        >
                          <span className="min-w-0 break-words group-hover/item:underline">
                            {item.title}
                            {!isPdfDocument && (
                              <span className="ml-2 rounded-full bg-[#fff7ed] px-2 py-0.5 text-[0.65rem] font-medium text-[#7c2d12]">
                                Dokument
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
