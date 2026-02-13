import { Heading } from '@digdir/designsystemet-react'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { useTemasideHubPageModel } from '../../hooks/useTemasideHubPageModel'
import { TemasideHubSections } from './TemasideHubSections'

export function TemasideHubPage() {
  const {
    breadcrumbItems,
    category,
    categoryIcon,
    customLayout,
    error,
    isError,
    isFlatStructure,
    isHub,
    isLoading,
    node,
    onOpenLinkedPath,
    query,
    setQuery,
    temaPath,
    totalLinks,
    visibleLinks,
    visibleSections,
  } = useTemasideHubPageModel()

  if (!category) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Fant ikke temasiden</Heading>
        <p className="mt-2">
          Ukjent kategori for: <code>{temaPath}</code>
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Breadcrumb items={breadcrumbItems} />
        <Heading level={2} data-size="md">Laster temasider...</Heading>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Breadcrumb items={breadcrumbItems} />
        <Heading level={2} data-size="md">Kunne ikke laste temasider</Heading>
        <p className="mt-2 text-sm text-slate-600">
          {error?.message}
        </p>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Breadcrumb items={breadcrumbItems} />
        <Heading level={2} data-size="md">Fant ikke temasiden</Heading>
        <p className="mt-2">
          Ingen treff for: <code>{temaPath}</code>
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 lg:py-10">
      <Breadcrumb items={breadcrumbItems} />

      <header className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-6 lg:px-6">
        <div className="flex items-center gap-4">
          {categoryIcon && (
            <img src={categoryIcon} alt="" className="w-14 h-14 lg:w-16 lg:h-16" />
          )}
          <div>
            <Heading level={1} data-size="lg" className="font-bold">
              {node.title}
            </Heading>
            {isHub && (
              <p className="mt-2 text-sm text-slate-600">
                Finn undertema raskt med søk eller bla i seksjonene under.
              </p>
            )}
          </div>
        </div>

        {isHub && (
          <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <label className="w-full md:max-w-md">
              <span className="sr-only">Filtrer undertema</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filtrer undertema"
                className="w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 placeholder:text-slate-500 focus:border-[#005F73] focus:outline-none focus:ring-2 focus:ring-[#005F73]/20"
              />
            </label>

            <p className="text-sm text-slate-600">
              Viser {visibleLinks} av {totalLinks} undertema
            </p>
          </div>
        )}
      </header>

      {isHub ? (
        <div className="mt-6">
          <TemasideHubSections
            hasCustomLayout={Boolean(customLayout)}
            isFlatStructure={isFlatStructure}
            query={query}
            visibleSections={visibleSections}
            onClearQuery={() => setQuery('')}
            onOpenLinkedPath={onOpenLinkedPath}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-700">
            Denne temasiden har ingen undernivå enda.
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Path: <code>{node.path}</code>
          </p>
        </div>
      )}
    </div>
  )
}
