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
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

const categories: Category[] = [
  {
    id: 'forebygging-diagnose-behandling',
    title: 'Forebygging, diagnose og behandling',
    icon: IoHeartOutline,
  },
  {
    id: 'digitalisering-e-helse',
    title: 'Digitalisering og e-helse',
    icon: IoPhonePortraitOutline,
  },
  {
    id: 'lov-forskrift',
    title: 'Lov og forskrift',
    icon: IoDocumentTextOutline,
  },
  {
    id: 'helseberedskap',
    title: 'Helseberedskap',
    icon: IoWarningOutline,
  },
  {
    id: 'autorisasjon-spesialistutdanning',
    title: 'Autorisasjon og spesialistutdanning',
    icon: IoSchoolOutline,
  },
  {
    id: 'tilskudd-finansiering',
    title: 'Tilskudd og finansiering',
    icon: IoCashOutline,
  },
  {
    id: 'statistikk-registre-rapporter',
    title: 'Statistikk, registre og rapporter',
    icon: IoStatsChartOutline,
  },
];

export function CategoryButtons() {
  const handleCategoryClick = (categoryId: string) => {
    // TODO: Navigate to category page when implemented
    console.log('Category clicked:', categoryId);
  };

  return (
    <div className="w-full max-w-screen-xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className="flex items-center gap-4 p-6 bg-white border-b-4 border-blue-600 rounded-lg hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex-shrink-0">
              <category.icon className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {category.title}
            </h3>
          </button>
        ))}
      </div>
    </div>
  );
}
