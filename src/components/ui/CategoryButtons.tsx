import { Link } from 'react-router-dom';
import {
  IoHeartOutline,
  IoPhonePortraitOutline,
  IoDocumentTextOutline,
  IoWarningOutline,
  IoSchoolOutline,
  IoCashOutline,
  IoStatsChartOutline,
} from 'react-icons/io5';

interface Category {
  path: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: Category[] = [
  {
    path: '/forebygging-diagnose-og-behandling',
    title: 'Forebygging, diagnose og behandling',
    icon: IoHeartOutline,
  },
  {
    path: '/digitalisering-og-e-helse',
    title: 'Digitalisering og e-helse',
    icon: IoPhonePortraitOutline,
  },
  {
    path: '/lov-og-forskrift',
    title: 'Lov og forskrift',
    icon: IoDocumentTextOutline,
  },
  {
    path: '/helseberedskap',
    title: 'Helseberedskap',
    icon: IoWarningOutline,
  },
  {
    path: '/autorisasjon-og-spesialistutdanning',
    title: 'Autorisasjon og spesialistutdanning',
    icon: IoSchoolOutline,
  },
  {
    path: '/tilskudd-og-finansiering',
    title: 'Tilskudd og finansiering',
    icon: IoCashOutline,
  },
  {
    path: '/statistikk-registre-og-rapporter',
    title: 'Statistikk, registre og rapporter',
    icon: IoStatsChartOutline,
  },
];

export function CategoryButtons() {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Link
            key={category.path}
            to={`/temasider${category.path}`}
            className="flex items-center gap-4 p-6 bg-white border-b-4 border-blue-600 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex-shrink-0">
              <category.icon className="w-12 h-12 text-blue-600" />
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
