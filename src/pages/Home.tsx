/** Home/landing page with the main search form and temaside category navigation buttons. */
import { HiArrowRight } from 'react-icons/hi2'
import { CategoryButtons } from '../components/ui/CategoryButtons'

export function Home() {
  return (
    <>
      <section className="mx-auto w-full max-w-screen-xl px-4 pt-8 pb-6 sm:px-6 lg:px-12">
        <h2 className="font-title mb-5 text-[1.15rem] font-semibold text-[#334155] tracking-[-0.01em]">
          Utforsk etter tema
        </h2>
        <CategoryButtons />
      </section>
      <section className="mx-auto w-full max-w-screen-xl px-4 pb-12 sm:px-6 lg:px-12">
        <h2 className="font-title mb-5 text-[1.15rem] font-semibold text-[#334155] tracking-[-0.01em]">
          Nyttige ressurser
        </h2>
        <div className="flex flex-col gap-3">
          <a
            href="https://www.helsenorge.no"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-6 rounded-2xl bg-white px-7 py-5 ring-1 ring-gray-100 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
          >
            <p className="text-[0.95rem] text-gray-800">
              <span className="font-semibold text-gray-900">Helsenorge.no</span>{' '}
              har helseinformasjon og selvbetjeningsløsninger for befolkningen.
            </p>
            <HiArrowRight
              size={18}
              className="flex-shrink-0 text-gray-400 transition-all duration-150 group-hover:translate-x-1 group-hover:text-gray-600"
            />
          </a>
          <a
            href="https://www.fhi.no"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-6 rounded-2xl bg-white px-7 py-5 ring-1 ring-gray-100 shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
          >
            <p className="text-[0.95rem] text-gray-800">
              <span className="font-semibold text-gray-900">Folkehelseinstituttet</span>{' '}
              leverer kunnskap og råd for å fremme folkehelse og forebygge sykdom.
            </p>
            <HiArrowRight
              size={18}
              className="flex-shrink-0 text-gray-400 transition-all duration-150 group-hover:translate-x-1 group-hover:text-gray-600"
            />
          </a>
        </div>
      </section>
    </>
  )
}
