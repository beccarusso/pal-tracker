// src/components/FilterBar.tsx

// ── Types ─────────────────────────────────────────────────────
export type SortField = "name" | "level" | "species" | "favorites";
export type SortOrder = "asc" | "desc";

export type FilterState = {
  search:   string;
  sort:     SortField;
  order:    SortOrder;
  elements: string[];
  works:    string[];
};

export const DEFAULT_FILTER: FilterState = {
  search: "", sort: "name", order: "asc", elements: [], works: [],
};

// ── Single source of truth for work icon paths ────────────────
// Exported so PalCard can import this instead of duplicating the map.
// Keys match workSuitability Record keys from species.json.
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

// ── Element icon list for filter bar ─────────────────────────
const ELEMENTS = [
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

// Work entries for filter bar (id matches WORK_ICON_MAP keys)
const WORKS = [
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

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

type Props = {
  value:    FilterState;
  onChange: (next: FilterState) => void;
  compact?: boolean; // true = edit-page left panel (search+sort only, no icon rows)
};

export default function FilterBar({ value, onChange, compact = false }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });

  return (
    <div className={`filter-bar${compact ? " filter-bar-compact" : ""}`}>

      {/* ── Search + (compact: sort/order dropdowns inline) ── */}
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

      {/* ── Full mode: sort dropdowns + element/work icon rows ── */}
      {!compact && (
        <>
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

          <div className="filter-icon-section">
            {/* Element toggles */}
            <div className="filter-icon-group">
              <span className="filter-label">Filter by element</span>
              <div className="filter-icon-row">
                {ELEMENTS.map(({ id, label }) => (
                  <button key={id} type="button" title={label}
                    className={`filter-icon-btn${value.elements.includes(id) ? " filter-icon-btn-active" : ""}`}
                    onClick={() => set({ elements: toggle(value.elements, id) })}>
                    <img src={`/images/elements/${id}-icon.png`} alt={label} className="filter-icon-img" />
                  </button>
                ))}
              </div>
            </div>

            {/* Work toggles */}
            <div className="filter-icon-group">
              <span className="filter-label">Filter by work</span>
              <div className="filter-icon-row">
                {WORKS.map(({ id, label }) => (
                  <button key={id} type="button" title={label}
                    className={`filter-icon-btn${value.works.includes(id) ? " filter-icon-btn-active" : ""}`}
                    onClick={() => set({ works: toggle(value.works, id) })}>
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