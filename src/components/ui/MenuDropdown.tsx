import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@navikt/aksel-icons';

interface MenuItem {
  path: string;
  title: string;
  isExternal?: boolean;
}

const menuItems: MenuItem[] = [
  {
    path: '/temaside/forebygging-diagnose-og-behandling',
    title: 'Forebygging, diagnose og behandling',
  },
  {
    path: '/temaside/digitalisering-og-e-helse',
    title: 'Digitalisering og e-helse',
  },
  {
    path: '/temaside/lov-og-forskrift',
    title: 'Lov og forskrift',
  },
  {
    path: '/temaside/helseberedskap',
    title: 'Helseberedskap',
  },
  {
    path: '/temaside/autorisasjon-og-spesialistutdanning',
    title: 'Autorisasjon og spesialistutdanning',
  },
  {
    path: '/temaside/tilskudd-og-finansiering',
    title: 'Tilskudd og finansiering',
  },
  {
    path: '/temaside/statistikk-registre-og-rapporter',
    title: 'Statistikk, registre og rapporter',
  },
  {
    path: 'https://www.helsedirektoratet.no/om-oss',
    title: 'Om Helsedirektoratet',
    isExternal: true,
  },
];

interface MenuDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MenuDropdown({ isOpen, onClose }: MenuDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute left-0 right-0 bg-white shadow-xl z-50 border-t border-gray-200">
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <nav>
          {menuItems.map((item) => (
            item.isExternal ? (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <span className="text-gray-900">{item.title}</span>
                <ChevronRightIcon className="h-5 w-5 text-blue-600" />
              </a>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <span className="text-gray-900">{item.title}</span>
                <ChevronRightIcon className="h-5 w-5 text-blue-600" />
              </Link>
            )
          ))}
        </nav>
      </div>
    </div>
  );
}
