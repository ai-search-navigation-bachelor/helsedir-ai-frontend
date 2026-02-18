import { Heading } from '@digdir/designsystemet-react'
import { Link } from 'react-router-dom'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { TEMASIDE_CATEGORIES } from '../../constants/temasider'
import type { BreadcrumbItem } from '../../types/components'

const TEMASIDE_INDEX_BREADCRUMBS: BreadcrumbItem[] = [
  { label: 'Forside', href: '/' },
]

export function TemasideIndexPage() {
  return (
    <div className="max-w-screen-xl mx-auto px-12 py-8 lg:py-10">
      <Breadcrumb items={TEMASIDE_INDEX_BREADCRUMBS} />

      <header className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 lg:px-6">
        <Heading level={1} data-size="lg" className="font-bold">
          Temasider
        </Heading>
        <p className="mt-2 text-sm text-slate-600">
          Velg et temaområde for å se undertemaer og relevant innhold.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {TEMASIDE_CATEGORIES.map((category) => (
          <Link
            key={category.path}
            to={category.path}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <img src={category.iconSrc} alt="" className="h-12 w-12 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#005F73]">
                  {category.title}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Utforsk undertemaer innen dette området.
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
