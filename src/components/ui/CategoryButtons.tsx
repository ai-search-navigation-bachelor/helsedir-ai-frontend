import { Link } from 'react-router-dom';

interface Category {
  path: string;
  title: string;
  iconSrc: string;
}

const categories: Category[] = [
  {
    path: '/forebygging-diagnose-og-behandling',
    title: 'Forebygging, diagnose og behandling',
    iconSrc: '/Forebygging_diagnose_behandling.svg',
  },
  {
    path: '/digitalisering-og-e-helse',
    title: 'Digitalisering og e-helse',
    iconSrc: '/Digitalisering_E-helse.svg',
  },
  {
    path: '/lov-og-forskrift',
    title: 'Lov og forskrift',
    iconSrc: '/Rundskriv_Veileder_til_lov.svg',
  },
  {
    path: '/helseberedskap',
    title: 'Helseberedskap',
    iconSrc: '/Helseberedskap.svg',
  },
  {
    path: '/autorisasjon-og-spesialistutdanning',
    title: 'Autorisasjon og spesialistutdanning',
    iconSrc: '/Autorisasjon.svg',
  },
  {
    path: '/tilskudd-og-finansiering',
    title: 'Tilskudd og finansiering',
    iconSrc: '/Tilskudd.svg',
  },
  {
    path: '/statistikk-registre-og-rapporter',
    title: 'Statistikk, registre og rapporter',
    iconSrc: '/Statistikk.svg',
  },
];

export function CategoryButtons() {
  return (
    <div className="w-full max-w-screen-xl mx-auto px-10 md:px-14 lg:px-16 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => (
          <Link
            key={category.path}
            to={`/temaside${category.path}`}
            className="flex items-center gap-5 p-6 bg-white border-b-4 rounded-lg hover:shadow-xl transition-all text-left"
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
