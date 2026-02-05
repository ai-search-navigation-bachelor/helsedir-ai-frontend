import { Link, useLocation } from "react-router-dom";
import { Heading } from "@digdir/designsystemet-react";
import { findNodeByPath, splitIntoColumns } from "../../lib/temasider/temasiderTree";

function stripPrefix(pathname: string) {
  return pathname.replace(/^\/temasider/, "") || "/";
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

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Heading level={1} data-size="lg">{node.title}</Heading>

      {isHub ? (
        <div className="mt-8 space-y-10">
          {node.children.map((section) => {
            const items = section.children;
            const cols = splitIntoColumns(items, 2);

            return (
              <section key={section.path}>
                <Heading level={2} data-size="md">{section.title}</Heading>

                <div className="mt-4 grid gap-10 md:grid-cols-2">
                  {cols.map((col, idx) => (
                    <div key={idx}>
                      {col.map((item) => (
                        <Link
                          key={item.path}
                          to={`/temasider${item.path}`}
                          className="flex items-center justify-between border-b border-slate-200 py-4 hover:bg-slate-50 px-2 rounded"
                        >
                          <span>{item.title}</span>
                          <span aria-hidden>→</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
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
