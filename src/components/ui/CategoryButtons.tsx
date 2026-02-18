import { Link } from 'react-router-dom';
import { TEMASIDE_CATEGORIES } from '../../constants/temasider';

interface CategoryButtonProps {
  path: string;
  iconSrc: string;
  title: string;
}

function CategoryButton({ path, iconSrc, title }: CategoryButtonProps) {
  return (
    <Link
      to={path}
      className="flex items-center gap-5 rounded-xl bg-white/10 p-7 text-left shadow-sm transition-all border border-[#005F73]/20"
    >
      <div className="flex-shrink-0">
        <img src={iconSrc} alt="" className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </Link>
  );
}

export function CategoryButtons() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 md:px-10 lg:px-12 py-14 md:py-12">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
        {TEMASIDE_CATEGORIES.map((category) => (
          <CategoryButton
            key={category.path}
            path={category.path}
            iconSrc={category.iconSrc}
            title={category.title}
          />
        ))}
      </div>
    </section>
  );
}
