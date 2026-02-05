import { Link, useLocation } from "react-router-dom";
import { Heading } from "@digdir/designsystemet-react";
import { ChevronRightIcon } from '@navikt/aksel-icons';
import { findNodeByPath } from "../../lib/temaside/temasiderTree";

// Map category paths to their SVG icons
const categoryIcons: Record<string, string> = {
  '/forebygging-diagnose-og-behandling': '/Forebygging_diagnose_behandling.svg',
  '/digitalisering-og-e-helse': '/Digitalisering_E-helse.svg',
  '/lov-og-forskrift': '/Rundskriv_Veileder_til_lov.svg',
  '/helseberedskap': '/Helseberedskap.svg',
  '/autorisasjon-og-spesialistutdanning': '/Autorisasjon.svg',
  '/tilskudd-og-finansiering': '/Tilskudd.svg',
  '/statistikk-registre-og-rapporter': '/Statistikk.svg',
};

function stripPrefix(pathname: string) {
  return pathname.replace(/^\/temaside/, "") || "/";
}

export function TemasideHubPage() {
  const { pathname } = useLocation();
  const temaPath = stripPrefix(pathname);

  const node = findNodeByPath(temaPath);

  if (!node) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Fant ikke temasiden</Heading>
        <p className="mt-2">
          Ingen mock-data for: <code>{temaPath}</code>
        </p>
      </div>
    );
  }

  const isHub = node.children.length > 0;
  const categoryIcon = categoryIcons[node.path];

  return (
    <div className="mx-auto max-w-[1600px] px-8 py-6">
      <div className="flex items-center gap-4 mb-16">
        {categoryIcon && (
          <img src={categoryIcon} alt="" className="w-16 h-16" />
        )}
        <Heading level={1} data-size="lg" className="font-bold">{node.title}</Heading>
      </div>

      {isHub ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-12 gap-y-14">
          {node.children.map((section) => (
            <section key={section.path} className="space-y-5">
              <Heading level={2} data-size="md" className="font-bold text-gray-900 text-xl">
                {section.title}
              </Heading>

              {section.children.length > 0 && (
                <ul className="space-y-3">
                  {section.children.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={`/temaside${item.path}`}
                        className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors py-1 text-base border-b border-gray-200 pb-2"
                      >
                        <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-blue-600" aria-hidden />
                        <span>{item.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <p className="text-slate-700">
            Leaf-side (ingen under-sider i listen). Her kan dere mocke innhold senere.
          </p>
          <p className="mt-2">
            Path: <code>{node.path}</code>
          </p>
        </div>
      )}
    </div>
  );
}
