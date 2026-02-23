import { useEffect, useRef, useState } from "react";

interface SearchCategoryTabsProps {
  activeTab: string;
  tabs: ReadonlyArray<{ id: string; label: string }>;
  categoryCounts: Record<string, number>;
  onTabChange: (value: string) => void;
}

export function SearchCategoryTabs({
  activeTab,
  tabs,
  categoryCounts,
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

  const allTabs = [{ id: "all", label: "Alle" }, ...tabs];

  return (
    <div className="mb-5 border-b border-slate-300">
      <div ref={containerRef} className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 -mb-px">
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
            className={`inline-flex items-center gap-1.5 px-1.5 pt-2 pb-3 text-[0.95rem] font-medium transition-colors font-title ${
              activeTab === tab.id
                ? "text-[#047FA4]"
                : "text-slate-700 hover:text-slate-900"
            }`}
          >
            {tab.label}
            <span className={activeTab === tab.id ? "text-[#047FA4]" : "text-slate-600"}>{categoryCounts[tab.id] || 0}</span>
          </button>
        ))}

        <div
          className="absolute bottom-0 h-0.5 bg-[#047FA4] rounded-full"
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
