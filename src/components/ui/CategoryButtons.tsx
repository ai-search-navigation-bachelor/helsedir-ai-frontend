import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
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
      className="group flex flex-col gap-5 rounded-2xl bg-white p-7 shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:ring-[#025169]/30"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-xl"
        style={{ backgroundColor: '#E8F4F8' }}
      >
        <img src={iconSrc} alt="" className="w-9 h-9" />
      </div>
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[15px] font-semibold text-gray-800 leading-snug">{title}</h3>
        <HiArrowRight
          className="flex-shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
          style={{ color: '#025169' }}
          size={18}
        />
      </div>
    </Link>
  );
}

export function CategoryButtons() {
  return (
    <section className="w-full max-w-6xl mx-auto px-6 md:px-10 lg:px-12 py-10">
      <h2 className="text-xl font-semibold text-gray-700 mb-6 max-w-5xl mx-auto font-title">
        Utforsk etter tema
      </h2>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
