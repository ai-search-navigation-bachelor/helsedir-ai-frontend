import { Link } from "react-router-dom";
import { Heading } from "@digdir/designsystemet-react";
import { getTopLevelTemasider } from "../../lib/temaside/temasiderTree";
import type { ThemeNode } from "../../lib/temaside/temasiderTree";

export function TemasideIndexPage() {
  const top = getTopLevelTemasider();

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Heading level={1} data-size="lg">Temasider</Heading>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((t: ThemeNode) => (
          <Link
            key={t.path}
            to={`/temasider${t.path}`}
            className="rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50"
          >
            {t.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
