import { Link } from 'react-router-dom';
import { TEMASIDE_CATEGORIES } from '../../constants/temasider';

export function CategoryButtons() {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-10 md:px-14 lg:px-16 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEMASIDE_CATEGORIES.map((category) => (
          <Link
            key={category.path}
            to={`/temaside${category.path}`}
            className="flex items-center gap-5 p-6 bg-white border-b-[3px] rounded-lg hover:shadow-xl transition-all text-left"
            style={{ borderBottomColor: '#005F73' }}
          >
            <div className="flex-shrink-0">
              <img 
                src={category.iconSrc} 
                alt="" 
                className="w-16 h-16"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {category.title}
            </h3>
          </Link>
        ))}
      </div>
    </div>
  );
}
