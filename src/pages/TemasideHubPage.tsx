import { TemasideHubSections, TemasideHubStatusView } from '../components/content/temaside'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useTemasideHubPageModel } from '../hooks/useTemasideHubPageModel'
import type { TemasideCategorySlug } from '../constants/temasider'

interface TemasideHubPageProps {
  categorySlugOverride?: TemasideCategorySlug
}

export function TemasideHubPage({ categorySlugOverride }: TemasideHubPageProps = {}) {
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
  } = useTemasideHubPageModel(categorySlugOverride)

  if (!category) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        details={<>Ukjent kategori for: <code>{temaPath}</code></>}
      />
    )
  }

  if (isLoading) {
    return <TemasideHubStatusView title="Laster temasider..." breadcrumbItems={breadcrumbItems} />
  }

  if (isError) {
    return (
      <TemasideHubStatusView
        title="Kunne ikke laste temasider"
        breadcrumbItems={breadcrumbItems}
        details={error?.message}
      />
    )
  }

  if (!node) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        breadcrumbItems={breadcrumbItems}
        details={<>Ingen treff for: <code>{temaPath}</code></>}
      />
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-12 pt-4 pb-10">
      <Breadcrumb items={breadcrumbItems} />

      <header className="rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm px-6 py-6 mb-6">
        <div className="flex items-center gap-4">
          {categoryIcon && (
            <div className="flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-xl" style={{ backgroundColor: '#e8f4f8' }}>
              <img src={categoryIcon} alt="" className="w-10 h-10" />
            </div>
          )}
          <div>
            <h1 className="font-title text-2xl font-semibold text-gray-900">{node.title}</h1>
            {isHub && (
              <p className="mt-1 text-sm text-gray-500">
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
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrer undertema..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#025169] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#025169]/20 transition-colors"
              />
            </label>
            <p className="text-sm text-gray-500">
              Viser {visibleLinks} av {totalLinks} undertema
            </p>
          </div>
        )}
      </header>

      {isHub ? (
        <TemasideHubSections
          hasCustomLayout={Boolean(customLayout)}
          isFlatStructure={isFlatStructure}
          query={query}
          visibleSections={visibleSections}
          onClearQuery={() => setQuery('')}
          onOpenLinkedPath={onOpenLinkedPath}
        />
      ) : (
        <div className="rounded-xl bg-white ring-1 ring-gray-100 p-6">
          <p className="text-gray-700">Denne temasiden har ingen undernivå enda.</p>
          <p className="mt-2 text-sm text-gray-400">
            Path: <code>{node.path}</code>
          </p>
        </div>
      )}
    </div>
  )
}
