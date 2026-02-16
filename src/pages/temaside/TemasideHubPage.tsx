import { Alert, Heading, Paragraph, Spinner } from '@digdir/designsystemet-react'
import { ContentDisplay } from '../../components/content'
import { Breadcrumb } from '../../components/ui/Breadcrumb'
import { useContentByIdQuery } from '../../hooks/queries/useContentByIdQuery'
import { useTemasideHubPageModel } from '../../hooks/useTemasideHubPageModel'
import { TemasideHubSections } from './TemasideHubSections'
import { TemasideHubStatusView } from './TemasideHubStatusView'

export function TemasideHubPage() {
  const {
    breadcrumbItems,
    category,
    categoryIcon,
    contentId,
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

  const isLeafContentPage = Boolean(node && !isHub && contentId)
  const {
    data: leafContent,
    isLoading: isLeafContentLoading,
    error: leafContentError,
  } = useContentByIdQuery({
    contentId,
    enabled: isLeafContentPage,
  })

  if (!category) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        details={
          <>
            Ukjent kategori for: <code>{temaPath}</code>
          </>
        }
      />
    )
  }

  if (isLoading) {
    return (
      <TemasideHubStatusView
        title="Laster temasider..."
        breadcrumbItems={breadcrumbItems}
      />
    )
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
        details={
          <>
            Ingen treff for: <code>{temaPath}</code>
          </>
        }
      />
    )
  }

  if (isLeafContentPage) {
    return (
      <div className="max-w-screen-xl mx-auto px-6 pt-4 pb-8 lg:pb-10">
        <Breadcrumb items={breadcrumbItems} />

        {isLeafContentLoading && (
          <div className="flex justify-center items-center py-8">
            <Spinner aria-label="Laster temaside..." data-size="lg" />
          </div>
        )}

        {leafContentError && (
          <Alert data-color="danger">
            <Paragraph>
              {leafContentError instanceof Error
                ? leafContentError.message
                : 'Kunne ikke laste temasideinnhold'}
            </Paragraph>
          </Alert>
        )}

        {leafContent && <ContentDisplay content={leafContent} />}
      </div>
    )
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 pt-4 pb-8 lg:pb-10">
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
