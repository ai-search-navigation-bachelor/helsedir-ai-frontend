/** 404 not-found page with a link back to the home page. */
import { Link } from 'react-router-dom'
import { Heading, Paragraph } from '@digdir/designsystemet-react'
import { HiArrowLeft } from 'react-icons/hi2'

export function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-screen-xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-12 gap-3">
      <p className="mb-0 text-[7rem] font-extrabold leading-none tracking-[-0.04em] text-[var(--ds-color-logobla-2-base-default)] opacity-[0.18] select-none">
        404
      </p>

      <Heading level={1} data-size="lg" className="mb-2">
        Siden ble ikke funnet
      </Heading>

      <Paragraph data-size="md" className="mb-10 max-w-[28rem] text-slate-500">
        Beklager, vi finner ikke siden du leter etter. Den kan ha blitt flyttet eller fjernet.
      </Paragraph>

      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--ds-color-logobla-1-base-default)] px-6 py-3 text-[0.95rem] font-medium text-[var(--ds-color-logobla-1-base-contrast-default)] no-underline transition-colors duration-150 hover:bg-[var(--ds-color-logobla-1-base-hover)]"
      >
        <HiArrowLeft size={16} />
        Gå til forsiden
      </Link>
    </div>
  )
}
