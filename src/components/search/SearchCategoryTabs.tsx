/** Tab bar for switching between content type categories on the search results page. */
import { useEffect, useRef, useState } from "react";

interface SearchCategoryTabsProps {
  activeTab: string;
  tabs: ReadonlyArray<{ id: string; label: string }>;
  categoryCounts: Record<string, number>;
  isLoadingCounts?: boolean;
  onTabChange: (value: string) => void;
}

export function SearchCategoryTabs({
  activeTab,
  tabs,
  categoryCounts,
  isLoadingCounts = false,
  onTabChange,
}: SearchCategoryTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const el = buttonRefs.current.get(activeTab);
    const container = containerRef.current;
    if (!el || !container) return;

    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setIndicator({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    });

    if (!animate) {
      requestAnimationFrame(() => setAnimate(true));
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tabs, categoryCounts]);

  useEffect(() => {
    const el = buttonRefs.current.get(activeTab);
    if (!el) return;
    if (!window.matchMedia("(max-width: 767px)").matches) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [activeTab]);

  const allTabs = [{ id: "all", label: "Alle" }, ...tabs];

  return (
    <div className="mb-5 border-b border-slate-300">
      <div
        ref={containerRef}
        className="relative -mx-1 flex flex-nowrap items-center gap-2 overflow-x-auto px-1 pb-2 md:mx-0 md:-mb-px md:flex-wrap md:gap-x-4 md:gap-y-1.5 md:overflow-visible md:px-0 md:pb-0"
      >
        {allTabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) {
                buttonRefs.current.set(tab.id, el);
              } else {
                buttonRefs.current.delete(tab.id);
              }
            }}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.9rem] font-medium font-title transition-colors md:rounded-none md:border-0 md:bg-transparent md:px-1.5 md:pt-2 md:pb-3 md:text-[0.95rem] ${
              activeTab === tab.id
                ? "border-[#047FA4] bg-[#047FA4] text-white md:text-[#047FA4]"
                : "border-transparent bg-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-900 md:hover:bg-transparent"
            }`}
          >
            {tab.label}
            <span
              aria-hidden={isLoadingCounts}
              className={`${
                activeTab === tab.id
                  ? "text-white md:text-[#047FA4]"
                  : "text-slate-600"
              } inline-flex min-w-[2ch] justify-end tabular-nums`}
            >
              {isLoadingCounts ? "" : (categoryCounts[tab.id] || 0)}
            </span>
          </button>
        ))}

        <div
          className="absolute bottom-0 hidden h-0.5 rounded-full bg-[#047FA4] md:block"
          style={{
            left: indicator.left,
            width: indicator.width,
            transition: animate
              ? "left 150ms ease, width 150ms ease"
              : "none",
          }}
        />
      </div>
    </div>
  );
}
