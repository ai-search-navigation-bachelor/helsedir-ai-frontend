import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heading } from "@digdir/designsystemet-react";
import { ChevronRightIcon } from "@navikt/aksel-icons";
import { CUSTOM_TEMASIDE_LAYOUTS, FORCE_FLAT_CATEGORIES } from "../../components/content/temaside/customLayouts";
import { getTemasideCategoryBySlug } from "../../constants/temasider";
import { useThemePagesQuery } from "../../hooks/queries/useThemePagesQuery";
import { buildThemeTree, findNodeByPath, type ThemeNode } from "../../lib/temaside/temasiderTree";

function normalizePath(path: string) {
  return (path || "/").replace(/\/+$/, "") || "/";
}

type HubLink = {
  path: string;
  title: string;
};

type HubSection = {
  id: string;
  title: string;
  links: HubLink[];
};

function collectLeafNodes(node: ThemeNode): ThemeNode[] {
  if (node.children.length === 0) {
    return [node];
  }

  return node.children.flatMap(collectLeafNodes);
}

function sortByTitle(a: HubLink, b: HubLink) {
  return a.title.localeCompare(b.title, "nb");
}

function buildHubSections(
  node: ThemeNode,
  customLayout: (typeof CUSTOM_TEMASIDE_LAYOUTS)[string] | undefined,
  isFlatStructure: boolean,
  shouldForceFlat: boolean,
  lookupNodeByPath: (path: string) => ThemeNode | undefined,
): HubSection[] {
  if (customLayout) {
    return customLayout.sections
      .map((customSection) => ({
        id: customSection.title,
        title: customSection.title,
        links: customSection.paths
          .map((path) => lookupNodeByPath(path))
          .filter((linkNode): linkNode is ThemeNode => Boolean(linkNode))
          .map((linkNode) => ({ path: linkNode.path, title: linkNode.title }))
          .sort(sortByTitle),
      }))
      .filter((section) => section.links.length > 0);
  }

  if (isFlatStructure) {
    const flatNodes = shouldForceFlat
      ? collectLeafNodes(node).filter((leaf) => leaf.path !== node.path)
      : node.children;

    const flatLinks = flatNodes
      .map((child) => ({ path: child.path, title: child.title }))
      .sort(sortByTitle);

    return [
      {
        id: `${node.path}-all`,
        title: "Alle undertemaer",
        links: flatLinks,
      },
    ];
  }

  return node.children
    .map((section) => {
      const sectionItems = section.children.length > 0 ? section.children : [section];
      return {
        id: section.path,
        title: section.title,
        links: sectionItems
          .map((item) => ({ path: item.path, title: item.title }))
          .sort(sortByTitle),
      };
    })
    .filter((section) => section.links.length > 0);
}

export function TemasideHubPage() {
  const params = useParams();
  const categorySlug = (params.category || "").trim().toLowerCase();
  const subPath = params["*"] || "";
  const temaPath = useMemo(
    () => normalizePath(`/${[categorySlug, subPath].filter(Boolean).join("/")}`),
    [categorySlug, subPath],
  );
  const [query, setQuery] = useState("");

  const category = getTemasideCategoryBySlug(categorySlug);

  const {
    data: themePagesData,
    isLoading,
    isError,
    error,
  } = useThemePagesQuery(categorySlug, {
    enabled: Boolean(category),
  });

  const tree = useMemo(() => {
    if (!themePagesData) {
      return null;
    }

    const titleByPath: Record<string, string> = {};
    const paths = themePagesData.results.map((result) => {
      const normalizedPath = normalizePath(result.path);
      titleByPath[normalizedPath] = result.title;
      return normalizedPath;
    });

    if (category && !paths.includes(category.path)) {
      paths.push(category.path);
    }

    return buildThemeTree(paths, titleByPath);
  }, [themePagesData, category]);

  const node = useMemo(() => (tree ? findNodeByPath(tree, temaPath) : null), [tree, temaPath]);

  const nodeByPath = useMemo(() => {
    const lookup = new Map<string, ThemeNode>();
    if (!tree) {
      return lookup;
    }

    const addNode = (current: ThemeNode) => {
      lookup.set(current.path, current);
      current.children.forEach(addNode);
    };

    addNode(tree);
    return lookup;
  }, [tree]);

  const isHub = Boolean(node && node.children.length > 0);
  const categoryIcon = category?.iconSrc;
  const customLayout = node ? CUSTOM_TEMASIDE_LAYOUTS[node.path] : undefined;

  const shouldForceFlat = node ? FORCE_FLAT_CATEGORIES.includes(node.path) : false;
  const isFlatStructure = Boolean(
    node && (shouldForceFlat || node.children.every((child) => child.children.length === 0)),
  );

  const sections = useMemo(
    () => (
      node
        ? buildHubSections(
          node,
          customLayout,
          isFlatStructure,
          shouldForceFlat,
          (path) => nodeByPath.get(path),
        )
        : []
    ),
    [node, customLayout, isFlatStructure, shouldForceFlat, nodeByPath],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = useMemo(() => {
    if (!normalizedQuery) {
      return sections;
    }

    return sections
      .map((section) => {
        const isSectionMatch = section.title.toLowerCase().includes(normalizedQuery);
        const links = isSectionMatch
          ? section.links
          : section.links.filter((link) => link.title.toLowerCase().includes(normalizedQuery));
        return { ...section, links };
      })
      .filter((section) => section.links.length > 0);
  }, [normalizedQuery, sections]);

  const totalLinks = sections.reduce((sum, section) => sum + section.links.length, 0);
  const visibleLinks = visibleSections.reduce((sum, section) => sum + section.links.length, 0);

  if (!category) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Fant ikke temasiden</Heading>
        <p className="mt-2">
          Ukjent kategori for: <code>{temaPath}</code>
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Laster temasider...</Heading>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Kunne ikke laste temasider</Heading>
        <p className="mt-2 text-sm text-slate-600">
          {error.message}
        </p>
      </div>
    );
  }

  if (!node) {
    return (
      <div className="mx-auto max-w-5xl p-6">
        <Heading level={2} data-size="md">Fant ikke temasiden</Heading>
        <p className="mt-2">
          Ingen treff for: <code>{temaPath}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8 lg:py-10">
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
          {visibleSections.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center">
              <p className="text-slate-700">Ingen treff for "{query.trim()}".</p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-3 text-sm font-semibold text-[#005F73] hover:underline"
              >
                Nullstill filter
              </button>
            </div>
          ) : isFlatStructure && !customLayout ? (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <Heading level={2} data-size="md" className="font-bold text-slate-900">
                  {visibleSections[0].title}
                </Heading>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {visibleSections[0].links.length}
                </span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2">
                {visibleSections[0].links.map((item) => (
                  <li key={item.path} className="border-b border-slate-200 last:border-b-0">
                    <Link
                      to={`/temaside${item.path}`}
                      className="flex items-start gap-2 px-5 py-3.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#005F73]"
                    >
                      <ChevronRightIcon className="mt-1 h-4 w-4 flex-shrink-0 text-[#005F73]" aria-hidden />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {visibleSections.map((section) => (
                <section key={section.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <Heading level={2} data-size="md" className="font-bold text-slate-900">
                      {section.title}
                    </Heading>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {section.links.length}
                    </span>
                  </div>

                  <ul>
                    {section.links.map((item) => (
                      <li key={item.path} className="border-b border-slate-200 last:border-b-0">
                        <Link
                          to={`/temaside${item.path}`}
                          className="flex items-start gap-2 px-5 py-3.5 text-slate-700 transition-colors hover:bg-slate-50 hover:text-[#005F73]"
                        >
                          <ChevronRightIcon className="mt-1 h-4 w-4 flex-shrink-0 text-[#005F73]" aria-hidden />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
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
  );
}
