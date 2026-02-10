import { useNavigate } from 'react-router-dom';
import type { SearchResult } from '../../../types';

interface SearchResultCardProps {
  result: SearchResult & {
    categoryName: string;
    categoryId: string;
  };
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/content/${result.id}`);
  };

  return (
    <div
      className="bg-white border-l-4 border-blue-500 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Category Label */}
      <div className="mb-2">
        <span className="inline-block px-3 py-1 text-sm font-medium text-blue-700 bg-blue-50 rounded-full">
          {result.categoryName}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {result.title}
      </h3>

      {/* Explanation if available (exclude keyword/semantic scoring) */}
      {result.explanation && !result.explanation.toLowerCase().includes('keyword') && !result.explanation.toLowerCase().includes('semantic') && (
        <p className="text-gray-700 line-clamp-2">
          {result.explanation}
        </p>
      )}
    </div>
  );
}
