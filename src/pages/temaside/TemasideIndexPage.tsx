import { Link } from "react-router-dom";
import { Heading } from "@digdir/designsystemet-react";
import { getTopLevelTemasider } from "../../lib/temaside/temasiderTree";

const categoryIcons: Record<string, string> = {
  '/forebygging-diagnose-og-behandling': '/Forebygging_diagnose_behandling.svg',
  '/digitalisering-og-e-helse': '/Digitalisering_E-helse.svg',
  '/lov-og-forskrift': '/Rundskriv_Veileder_til_lov.svg',
  '/helseberedskap': '/Helseberedskap.svg',
  '/autorisasjon-og-spesialistutdanning': '/Autorisasjon.svg',
  '/tilskudd-og-finansiering': '/Tilskudd.svg',
  '/statistikk-registre-og-rapporter': '/Statistikk.svg',
};

export function TemasideIndexPage() {
  const top = getTopLevelTemasider();

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 lg:py-10">
      <header className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 lg:px-6">
        <Heading level={1} data-size="lg" className="font-bold">
          Temasider
        </Heading>
        <p className="mt-2 text-sm text-slate-600">
          Velg et temaområde for å se undertemaer og relevant innhold.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {top.map((t) => (
          <Link
            key={t.path}
            to={`/temaside${t.path}`}
            className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              {categoryIcons[t.path] && (
                <img src={categoryIcons[t.path]} alt="" className="h-12 w-12 flex-shrink-0" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-[#005F73]">
                  {t.title}
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
  );
}
