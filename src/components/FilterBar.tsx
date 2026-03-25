// src/components/FilterBar.tsx

// ── Types ─────────────────────────────────────────────────────────
export type SortField = "name" | "level" | "species" | "favorites";
export type SortOrder = "asc" | "desc";

export type FilterState = {
  search:  string;
  sort:    SortField;
  order:   SortOrder;
  element: string | null;  // single selected element — null = show all
  work:    string | null;  // single selected work — null = show all
};

export const DEFAULT_FILTER: FilterState = {
  search: "", sort: "name", order: "asc", element: null, work: null,
};

// ── Work icon map — single source of truth, imported by PalCard ───
export const WORK_ICON_MAP: Record<string, string> = {
  kindling:     "/images/work/kindling.png",
  watering:     "/images/work/watering.png",
  planting:     "/images/work/planting.png",
  electricity:  "/images/work/electricity.png",
  handiwork:    "/images/work/handiwork.png",
  gathering:    "/images/work/gathering.png",
  lumbering:    "/images/work/lumbering.png",
  mining:       "/images/work/mining.png",
  medicine:     "/images/work/medicine.png",
  cooling:      "/images/work/cooling.png",
  transporting: "/images/work/transporting.png",
  farming:      "/images/work/farming.png",
};

// ── Static lists ──────────────────────────────────────────────────
const ELEMENTS: { id: string; label: string }[] = [
  { id: "ice",      label: "Ice"      },
  { id: "dragon",   label: "Dragon"   },
  { id: "dark",     label: "Dark"     },
  { id: "fire",     label: "Fire"     },
  { id: "grass",    label: "Grass"    },
  { id: "electric", label: "Electric" },
  { id: "water",    label: "Water"    },
  { id: "ground",   label: "Ground"   },
  { id: "neutral",  label: "Neutral"  },
];

const WORKS: { id: string; label: string }[] = [
  { id: "planting",     label: "Planting"     },
  { id: "cooling",      label: "Cooling"      },
  { id: "farming",      label: "Farming"      },
  { id: "kindling",     label: "Kindling"     },
  { id: "electricity",  label: "Electricity"  },
  { id: "handiwork",    label: "Handiwork"    },
  { id: "lumbering",    label: "Lumbering"    },
  { id: "mining",       label: "Mining"       },
  { id: "medicine",     label: "Medicine"     },
  { id: "gathering",    label: "Gathering"    },
  { id: "transporting", label: "Transporting" },
  { id: "watering",     label: "Watering"     },
];

// ── Props ─────────────────────────────────────────────────────────
type Props = {
  value:    FilterState;
  onChange: (next: FilterState) => void;
  compact?: boolean; // true = edit page left panel (search + sort + order only)
};

export default function FilterBar({ value, onChange, compact = false }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  // Single-select toggle: clicking an already-active item deselects it.
  // Clicking a different item switches to it (previous auto-deselects).
  const toggleElement = (id: string) => set({ element: value.element === id ? null : id });
  const toggleWork    = (id: string) => set({ work:    value.work    === id ? null : id });

  return (
    <div className={`filter-bar${compact ? " filter-bar-compact" : ""}`}>

      {/* ── Row 1: search + (compact) sort/order ── */}
      <div className="filter-top-row">
        <div className="filter-search-wrap">
          {!compact && <span className="filter-label">Search for Pal</span>}
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              value={value.search}
              onChange={(e) => set({ search: e.target.value })}
              placeholder={compact ? "Search pals..." : "Enter name"}
            />
            {value.search && (
              <button className="search-clear" onClick={() => set({ search: "" })}>✕</button>
            )}
          </div>
        </div>

        {compact && (
          <>
            <select className="input filter-select" value={value.sort}
              onChange={(e) => set({ sort: e.target.value as SortField })}>
              <option value="name">Name</option>
              <option value="level">Level</option>
              <option value="species">Species</option>
              <option value="favorites">Favorites</option>
            </select>
            <select className="input filter-select" value={value.order}
              onChange={(e) => set({ order: e.target.value as SortOrder })}>
              <option value="asc">↑ Asc</option>
              <option value="desc">↓ Desc</option>
            </select>
          </>
        )}
      </div>

      {/* ── Full mode only: sort row + icon filter rows ── */}
      {!compact && (
        <>
          {/* Sort + Order */}
          <div className="filter-sort-row">
            <div className="filter-sort-group">
              <span className="filter-label">Sort</span>
              <select className="input filter-select" value={value.sort}
                onChange={(e) => set({ sort: e.target.value as SortField })}>
                <option value="name">Name</option>
                <option value="level">Level</option>
                <option value="species">Species</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
            <div className="filter-sort-group">
              <span className="filter-label">Order</span>
              <select className="input filter-select" value={value.order}
                onChange={(e) => set({ order: e.target.value as SortOrder })}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Element + Work icon rows */}
          <div className="filter-icon-section">

            {/* Element — single select */}
            <div className="filter-icon-group">
              <span className="filter-label">
                Filter by element
                {value.element && (
                  <button className="filter-clear-chip" onClick={() => set({ element: null })}>
                    {value.element} ✕
                  </button>
                )}
              </span>
              <div className="filter-icon-row">
                {ELEMENTS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    className={`filter-icon-btn${value.element === id ? " filter-icon-btn-active" : ""}`}
                    onClick={() => toggleElement(id)}
                  >
                    <img src={`/images/elements/${id}-icon.png`} alt={label} className="filter-icon-img" />
                  </button>
                ))}
              </div>
            </div>

            {/* Work — single select */}
            <div className="filter-icon-group">
              <span className="filter-label">
                Filter by work
                {value.work && (
                  <button className="filter-clear-chip" onClick={() => set({ work: null })}>
                    {value.work} ✕
                  </button>
                )}
              </span>
              <div className="filter-icon-row">
                {WORKS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    className={`filter-icon-btn${value.work === id ? " filter-icon-btn-active" : ""}`}
                    onClick={() => toggleWork(id)}
                  >
                    <img src={WORK_ICON_MAP[id]} alt={label} className="filter-icon-img" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}