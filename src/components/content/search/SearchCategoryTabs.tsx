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
  return (
    <div className="mb-5 border-b border-slate-300 pb-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button
          type="button"
          onClick={() => onTabChange('all')}
          className={`inline-flex items-center gap-1.5 border-b-2 px-0.5 py-1 text-sm transition-colors ${
            activeTab === 'all'
              ? 'border-[#0062BA] text-[#0062BA]'
              : 'border-transparent text-slate-700 hover:text-slate-900'
          }`}
        >
          Alle
          <span className="text-slate-600">{categoryCounts.all || 0}</span>
        </button>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`inline-flex items-center gap-1.5 border-b-2 px-0.5 py-1 text-sm transition-colors ${
              activeTab === tab.id
                ? 'border-[#0062BA] text-[#0062BA]'
                : 'border-transparent text-slate-700 hover:text-slate-900'
            }`}
          >
            {tab.label}
            <span className="text-slate-600">{categoryCounts[tab.id] || 0}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
