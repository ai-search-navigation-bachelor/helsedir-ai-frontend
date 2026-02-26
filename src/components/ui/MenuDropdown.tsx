import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi2';
import { TEMASIDE_CATEGORIES } from '../../constants/temasider';

interface MenuItem {
  path: string;
  title: string;
  isExternal?: boolean;
}

const menuItems: MenuItem[] = [
  ...TEMASIDE_CATEGORIES.map((category) => ({
    path: category.path,
    title: category.title,
  })),
  {
    path: 'https://www.helsedirektoratet.no/om-oss',
    title: 'Om Helsedirektoratet',
    isExternal: true,
  },
];

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef?: RefObject<HTMLDivElement | null>;
}

export function MenuDropdown({ isOpen, onClose, containerRef }: MenuDropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideDropdown = ref.current?.contains(target);
      const insideContainer = containerRef?.current?.contains(target);

      if (!insideDropdown && !insideContainer) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-80 bg-white shadow-lg z-50 rounded-xl border border-gray-100 overflow-hidden">
      <nav className="px-2 py-2">
        {menuItems.map((item, index) => {
          const isLast = index === menuItems.length - 1;
          const className = `group flex items-center justify-between py-3 px-4 rounded-lg transition-colors duration-100 hover:bg-[#e8f4f8] ${isLast ? 'mt-1 border-t border-gray-100 pt-4' : ''}`;
          const content = (
            <>
              <span className="text-[0.95rem] text-gray-800 group-hover:text-[#025169] transition-colors">
                {item.title}
              </span>
              <HiArrowRight
                size={16}
                className="text-gray-400 group-hover:text-[#025169] group-hover:translate-x-0.5 transition-all duration-150"
              />
            </>
          );

          return item.isExternal ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              onClick={onClose}
            >
              {content}
            </a>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={className}
              onClick={onClose}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
