/** Leaf page for a deep temaside path; shows either hierarchical content or hub sub-sections depending on the node type. */
import { Alert, Paragraph } from '@digdir/designsystemet-react'
import { ContentDisplay } from '../components/content'
import { TemasideHubSections, TemasideHubStatusView } from '../components/content/temaside'
import { TemasideLoadingSkeleton } from '../components/content/temaside/TemasideSkeletons'
import { Breadcrumb } from '../components/ui/Breadcrumb'
import { useContentDetailQuery } from '../hooks/queries/useContentDetailQuery'
import { useTemasideHubPageModel } from '../hooks/useTemasideHubPageModel'
import type { TemasideCategorySlug } from '../constants/temasider'
import { ds } from '../styles/dsTokens'

interface TemasideLeafPageProps {
  categorySlug: TemasideCategorySlug
}

export function TemasideLeafPage({ categorySlug }: TemasideLeafPageProps) {
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
  } = useTemasideHubPageModel(categorySlug)

  const {
    data: leafContent,
    isLoading: isLeafLoading,
    error: leafError,
  } = useContentDetailQuery({
    contentId: contentId ?? undefined,
    routeContentType: 'temaside',
    skipHelsedirFallback: true,
  })

  if (!category) {
    return (
      <TemasideHubStatusView
        title="Fant ikke temasiden"
        details={<>Ukjent kategori for: <code>{temaPath}</code></>}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
        {breadcrumbItems && breadcrumbItems.length > 0 && <Breadcrumb items={breadcrumbItems} />}
        <TemasideLoadingSkeleton />
      </div>
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
        details={<>Ingen treff for: <code>{temaPath}</code></>}
      />
    )
  }

  if (isLeafLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
        <Breadcrumb items={breadcrumbItems} />
        <TemasideLoadingSkeleton />
      </div>
    )
  }

  if (!leafContent) {
    if (isHub) {
      return (
        <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
          <Breadcrumb items={breadcrumbItems} />

          <header className="mb-6 rounded-2xl bg-white px-6 py-6 ring-1 ring-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              {categoryIcon && (
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: ds.color('logobla-1', 'surface-tinted') }}
                >
                  <img src={categoryIcon} alt="" className="h-10 w-10" />
                </div>
              )}
              <div>
                <h1 className="font-title text-2xl font-semibold text-gray-900">{node.title}</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Denne stien er et navigasjonsnivå uten egen temaside. Velg et undertema under.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <label className="w-full md:max-w-md">
                <span className="sr-only">Filtrer undertema</span>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filtrer undertema..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-800 placeholder:text-gray-400 transition-colors focus:border-[#025169] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#025169]/20"
                />
              </label>
              <p className="text-sm text-gray-500">
                Viser {visibleLinks} av {totalLinks} undertema
              </p>
            </div>
          </header>

          <TemasideHubSections
            hasCustomLayout={Boolean(customLayout)}
            isFlatStructure={isFlatStructure}
            query={query}
            visibleSections={visibleSections}
            onClearQuery={() => setQuery('')}
            onOpenLinkedPath={onOpenLinkedPath}
          />
        </div>
      )
    }

    return (
      <TemasideHubStatusView
        title="Fant ikke temasideinnhold"
        breadcrumbItems={breadcrumbItems}
        details={<>Denne stien har verken egen temaside eller registrerte undertema: <code>{temaPath}</code></>}
      />
    )
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-2 pb-8 sm:px-6 lg:px-12 lg:pb-10">
      <Breadcrumb items={breadcrumbItems} />

      {leafError && !isHub && (
        <Alert data-color="danger">
          <Paragraph>
            {leafError instanceof Error ? leafError.message : 'Kunne ikke laste temasideinnhold'}
          </Paragraph>
        </Alert>
      )}

      {leafContent && <ContentDisplay content={leafContent} />}
    </div>
  )
}
