import { TEMASIDER_PATHS } from "../../constants/temasider.generated";

export type ThemeNode = {
  path: string;     // "/forebygging-diagnose-og-behandling"
  segment: string;  // "forebygging-diagnose-og-behandling"
  title: string;    // best-effort display title
  children: ThemeNode[];
};

function titleize(segment: string) {
  // simple: "-" -> " ", capitalize first letter. You can override later.
  const s = segment.replace(/-/g, " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function buildThemeTree(paths: readonly string[]): ThemeNode {
  const root: ThemeNode = { path: "/", segment: "", title: "Root", children: [] };

  for (const p of paths) {
    const clean = (p || "/").replace(/\/+$/, "") || "/";
    if (clean === "/") continue;

    const parts = clean.split("/").filter(Boolean);

    let current = root;
    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      let child = current.children.find((c) => c.segment === part);

      if (!child) {
        child = { path: currentPath, segment: part, title: titleize(part), children: [] };
        current.children.push(child);
      }
      current = child;
    }
  }

  // Sort for stable UI
  const sortRec = (n: ThemeNode) => {
    n.children.sort((a, b) => a.title.localeCompare(b.title, "nb"));
    n.children.forEach(sortRec);
  };
  sortRec(root);

  return root;
}

export const TEMASIDER_TREE = buildThemeTree(TEMASIDER_PATHS);

// Get top-level temasider categories
export function getTopLevelTemasider() {
  return TEMASIDER_TREE.children;
}

export function findNodeByPath(path: string): ThemeNode | null {
  const clean = (path || "/").replace(/\/+$/, "") || "/";
  if (clean === "/") return TEMASIDER_TREE;

  const parts = clean.split("/").filter(Boolean);
  let current: ThemeNode = TEMASIDER_TREE;

  for (const part of parts) {
    const next = current.children.find((c) => c.segment === part);
    if (!next) return null;
    current = next;
  }
  return current;
}

export function splitIntoColumns<T>(items: T[], cols = 2): T[][] {
  const out: T[][] = Array.from({ length: cols }, () => []);
  items.forEach((item, i) => out[i % cols].push(item));
  return out;
}
