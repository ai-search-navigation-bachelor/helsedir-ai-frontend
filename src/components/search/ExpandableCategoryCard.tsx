import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@digdir/designsystemet-react';
import { ChevronRightIcon, ChevronDownIcon } from '@navikt/aksel-icons';
import type { CategoryGroup } from '../../api/categorized';
import { CategoryResultItem } from './CategoryResultItem';

type Variant = 'temaside' | 'retningslinje';

const UI = {
  showMore: 'Vis flere',
  showLess: 'Vis færre',
  articles: 'artikler',
  hits: 'treff',
};

export interface ExpandableCategoryCardProps {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
  variant: Variant;
  badgeSuffix?: string;
  previewCount?: number;
  subtitle?: string;
}

export function ExpandableCategoryCard({
  category,
  searchQuery,
  searchId,
  variant,
  badgeSuffix = UI.articles,
  previewCount = 3,
  subtitle,
}: ExpandableCategoryCardProps) {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);
  const [isHoveringButton, setIsHoveringButton] = useState(false);

  const navigateToCategory = () => {
    if (!searchId) return;
    navigate(
      `/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
        category.category
      )}&search_id=${searchId}`
    );
  };

  const visibleResults = useMemo(() => {
    const base = category.results ?? [];
    if (isExpanded) return base;
    return base.slice(0, Math.max(0, previewCount));
  }, [category.results, isExpanded, previewCount]);

  const title = category.display_name;
  const sub = subtitle ?? category.display_name;

  return (
    <div
      style={{
        overflow: 'hidden',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        backgroundColor: 'white',
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={navigateToCategory}
        onMouseEnter={() => setIsHoveringHeader(true)}
        onMouseLeave={() => setIsHoveringHeader(false)}
        style={{
          position: 'relative',
          display: 'block',
          width: '100%',
          textAlign: 'left',
          padding: '20px 24px',
          backgroundColor: isHoveringHeader ? '#e0f2fe' : '#f0f9ff',
          borderBottom: '1px solid #e0f2fe',
          border: 'none',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {/* Left marker */}
        <span
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: '#2563eb',
          }}
        />

        {/* Badge */}
        <div style={{ position: 'absolute', left: '20px', top: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: 'white',
              color: '#334155',
              border: '1px solid #e2e8f0',
            }}
          >
            {category.count} {badgeSuffix}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', lineHeight: '1.2', margin: 0 }}>
              {title}
            </h3>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#334155', marginTop: '4px' }}>
              {sub}
            </p>
          </div>
          <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#475569', flexShrink: 0 }} />
        </div>
      </button>

      {/* List */}
      {visibleResults.length > 0 && (
        <div style={{ padding: '16px' }}>
          <div
            style={{
              borderRadius: '12px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '12px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {visibleResults.map((result) => {
                const [isHovering, setIsHovering] = useState(false);
                return (
                  <a
                    key={result.id}
                    href={`/info/${result.id}?search_id=${searchId ?? ''}`}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                    style={{
                      display: 'block',
                      borderRadius: '12px',
                      border: `1px solid ${isHovering ? '#cbd5e1' : '#e2e8f0'}`,
                      backgroundColor: isHovering ? '#f8fafc' : 'white',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    <CategoryResultItem result={result} searchId={searchId} variant={variant} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer controls */}
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setIsExpanded((v) => !v)}
              onMouseEnter={() => setIsHoveringButton(true)}
              onMouseLeave={() => setIsHoveringButton(false)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: isHoveringButton ? '#1e40af' : '#1d4ed8',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '8px',
                transition: 'color 0.2s',
              }}
              aria-expanded={isExpanded}
            >
              {isExpanded ? UI.showLess : UI.showMore}
              <ChevronDownIcon
                style={{
                  width: '16px',
                  height: '16px',
                  transition: 'transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
          </div>

          {/* Optional: "Vis flere (n til)" button */}
          {isExpanded && category.count > (category.results?.length ?? 0) && (
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'center' }}>
              <Button variant="tertiary" data-size="sm" onClick={navigateToCategory}>
                Vis flere ({category.count - (category.results?.length ?? 0)} til)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
