import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../../types';

interface SearchResultCardProps {
  result: SearchResult & {
    categoryName: string;
    categoryId: string;
  };
  searchId?: string;
}

export function SearchResultCard({ result, searchId }: SearchResultCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    const url = searchId 
      ? `/content/${result.id}?search_id=${searchId}`
      : `/content/${result.id}`;
    navigate(url);
  };

  return (
    <div
      className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Category Label */}
      <div className="mb-1.5">
        <span className="inline-block px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded-full">
          {result.categoryName}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-1.5 leading-snug">
        {result.title}
      </h3>

      {/* Explanation if available (exclude keyword/semantic scoring) */}
      {result.explanation && !result.explanation.toLowerCase().includes('keyword') && !result.explanation.toLowerCase().includes('semantic') && (
        <p className="text-sm text-gray-700 line-clamp-2">
          {result.explanation}
        </p>
      )}
    </div>
  );
}
