import type { SyntheticEvent } from "react";
import type { Pal, ParentRef } from "../types";

export type SpeciesData = { species: string; element: string[]; workSuitability?: Record<string, number> };
export type RawPal = Partial<Pal> & { parent1?: string; parent2?: string };

export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="#0a1326"/><rect x="8" y="8" width="80" height="80" rx="40" fill="#111b35" stroke="#31405e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#b8c3da" font-size="14" font-family="Arial">No Image</text></svg>`
  );

export const norm = (s = "") =>
  s
    .toLowerCase()
    .trim()
    .replace(/[_.]+/g, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const imgPath = (species: string) => `/images/pals/${norm(species)}.png`;

export const titleOf = ({ name, species }: Pick<Pal, "name" | "species">) =>
  name?.trim() || species;

export const loadJSON = async <T,>(path: string): Promise<T> =>
  fetch(path).then((r) => r.json());

/** Returns border color class for a pal image based on gender */
export const imgBorderCls = (gender: string | null | undefined): string =>
  gender === "female" ? "border-[#f472b6]" : "border-pal-acc";

export const imgError = (e: SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.onerror = null;
  e.currentTarget.src = FALLBACK_IMAGE;
};

export const buildChildMap = (pals: Pal[]) => {
  const map = new Map<number, number[]>();

  pals.forEach((pal) => {
    [pal.parent1Id, pal.parent2Id].forEach((ref) => {
      if (typeof ref === "number") {
        map.set(ref, [...(map.get(ref) ?? []), pal.id]);
      }
    });
  });

  return map;
};

export const isDescendant = (
  childMap: Map<number, number[]>,
  ancestorId: number,
  maybeDescendantId: number
) => {
  const visited = new Set<number>();

  const walk = (id: number): boolean => {
    if (visited.has(id)) return false;
    visited.add(id);
    const kids = childMap.get(id) ?? [];
    if (kids.includes(maybeDescendantId)) return true;
    return kids.some(walk);
  };

  return walk(ancestorId);
};

export const getParentWarnings = (
  selectedPal: Pal | null,
  childMap: Map<number, number[]>
) => {
  if (!selectedPal) return { warnings: [] as string[], notes: [] as string[] };

  const warnings: string[] = [];
  const notes: string[] = [];
  const p1 = selectedPal.parent1Id;
  const p2 = selectedPal.parent2Id;

  if (p1 === "wild" || p2 === "wild") {
    notes.push('Selecting "Wild" locks both parents to Wild for that pal.');
  }

  if (typeof p1 === "number" && p1 === selectedPal.id) {
    warnings.push("A pal cannot be its own Parent 1.");
  }

  if (typeof p2 === "number" && p2 === selectedPal.id) {
    warnings.push("A pal cannot be its own Parent 2.");
  }

  if (typeof p1 === "number" && typeof p2 === "number" && p1 === p2) {
    warnings.push("Parent 1 and Parent 2 cannot be the same pal.");
  }

  if (typeof p1 === "number" && isDescendant(childMap, selectedPal.id, p1)) {
    warnings.push(
      "Parent 1 is already a descendant of this pal, which creates a circular lineage."
    );
  }

  if (typeof p2 === "number" && isDescendant(childMap, selectedPal.id, p2)) {
    warnings.push(
      "Parent 2 is already a descendant of this pal, which creates a circular lineage."
    );
  }

  return { warnings, notes };
};

export const normalizePal = (
  raw: RawPal,
  lookup: SpeciesData[],
  allRaw: RawPal[]
): Pal => {
  const species =
    typeof raw.species === "string" && raw.species.trim()
      ? raw.species
      : "Lamball";

  const match = lookup.find((s) => s.species === species);

  const fromOldParent = (value?: string): ParentRef => {
    if (!value?.trim()) return null;
    if (value.toLowerCase() === "wild") return "wild";

    const found = allRaw.find(
      (p) =>
        (typeof p.name === "string" && p.name.trim() ? p.name : p.species) ===
        value
    );

    return typeof found?.id === "number" ? found.id : null;
  };

  const p1 = raw.parent1Id ?? fromOldParent(raw.parent1);
  const p2 = raw.parent2Id ?? fromOldParent(raw.parent2);
  const bothWild = p1 === "wild" || p2 === "wild";

  return {
    id:
      typeof raw.id === "number"
        ? raw.id
        : Date.now() + Math.floor(Math.random() * 10000),
    name: typeof raw.name === "string" && raw.name.trim() ? raw.name : species,
    species,
    element:
      Array.isArray(raw.element) && raw.element.length
        ? raw.element
        : match?.element ?? ["neutral"],
    level: typeof raw.level === "number" ? raw.level : 1,
    gender: raw.gender ?? null,
    workSuitability: match?.workSuitability ?? raw.workSuitability ?? {},
    passiveSkills: Array.isArray(raw.passiveSkills) ? raw.passiveSkills : [],
    activeSkills: Array.isArray(raw.activeSkills) ? raw.activeSkills : [],
    parent1Id: bothWild ? "wild" : p1,
    parent2Id: bothWild ? "wild" : p2,
    notes: typeof raw.notes === "string" ? raw.notes : "",
    ivHP:      typeof raw.ivHP      === "number" ? raw.ivHP      : 0,
    ivAttack:  typeof raw.ivAttack  === "number" ? raw.ivAttack  : 0,
    ivDefense: typeof raw.ivDefense === "number" ? raw.ivDefense : 0,
    favorite: typeof raw.favorite === "boolean" ? raw.favorite : false,
    favoriteOrder:
      typeof raw.favoriteOrder === "number"
        ? raw.favoriteOrder
        : typeof raw.favorite === "boolean" && raw.favorite
        ? 1
        : null,
  };
};

export const sortPals = (pals: Pal[]) =>
  [...pals]
    .map((pal, index) => ({ pal, index }))
    .sort((a, b) => {
      if (a.pal.favorite !== b.pal.favorite) return a.pal.favorite ? -1 : 1;
      if (a.pal.favorite && b.pal.favorite) {
        return (a.pal.favoriteOrder ?? 0) - (b.pal.favoriteOrder ?? 0);
      }
      return a.index - b.index;
    })
    .map(({ pal }) => pal);

export const elementIcon = (element: string) =>
  `/images/elements/${element.toLowerCase()}-icon.png`;

// ── IV helpers ──────────────────────────────────────────────────
export const IV_STATS: { key: keyof import("../types").Pal; symbol: string; label: string; symbolOffset?: number }[] = [
  { key: "ivHP",      symbol: "♥",  label: "HP",  symbolOffset: 3 },
  { key: "ivAttack",  symbol: "✦",  label: "ATK" },
  { key: "ivDefense", symbol: "⛨", label: "DEF" },
];

// 3-tier: white (≤50 = low/grey in-game), green (>50), gold (100 = perfect)
export type IVColorTier = "low" | "mid" | "max";

export const IV_COLORS: Record<IVColorTier, string> = {
  low:  "#ffffff",
  mid:  "#22c55e",
  max:  "#f59e0b",
};

export const ivColor = (val: number): IVColorTier => {
  if (val >= 100) return "max";
  if (val > 50)   return "mid";
  return "low";
};

export const ivGlow = (val: number): string =>
  ivColor(val) === "max" ? "0 0 6px #f59e0b, 0 0 12px rgba(245,158,11,0.5)" : "none";