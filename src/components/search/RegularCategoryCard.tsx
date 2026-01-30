import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRightIcon } from '@navikt/aksel-icons';
import type { CategoryGroup } from '../../api/categorized';
import { CategoryResultItem } from './CategoryResultItem';

export interface RegularCategoryCardProps {
  category: CategoryGroup;
  searchQuery: string;
  searchId?: string;
}

export function RegularCategoryCard({ category, searchQuery, searchId }: RegularCategoryCardProps) {
  const navigate = useNavigate();
  const [isHoveringHeader, setIsHoveringHeader] = useState(false);

  const navigateToCategory = () => {
    if (!searchId) return;
    navigate(
      `/category?query=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(
        category.category
      )}&search_id=${searchId}`
    );
  };

  const items = (category.results ?? []).slice(0, 3);

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
          backgroundColor: isHoveringHeader ? '#f8fafc' : 'white',
          transition: 'background-color 0.2s',
          borderBottom: '1px solid #e2e8f0',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ position: 'absolute', left: '20px', top: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: '500',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              border: '1px solid #e2e8f0',
            }}
          >
            {category.count} treff
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '600', color: '#0f172a', margin: 0 }}>{category.display_name}</h3>
          </div>
          <ChevronRightIcon style={{ width: '20px', height: '20px', color: '#475569' }} />
        </div>
      </button>

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
            {items.map((result) => {
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
                  <CategoryResultItem result={result} searchId={searchId} variant="regular" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
