// src/components/FilterBar.tsx

// ── Types ─────────────────────────────────────────────────────────
export type SortField = "name" | "level" | "species" | "favorites";
export type SortOrder = "asc" | "desc";

export type FilterState = {
  search:  string;
  sort:    SortField;
  order:   SortOrder;
  element: string | null;
  work:    string | null;
};

export const DEFAULT_FILTER: FilterState = {
  search: "", sort: "name", order: "asc", element: null, work: null,
};

// ── Work icon map — single source of truth ────────────────────────
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

type Props = {
  value:    FilterState;
  onChange: (next: FilterState) => void;
  compact?: boolean;
};

export default function FilterBar({ value, onChange, compact = false }: Props) {
  const set = (patch: Partial<FilterState>) => onChange({ ...value, ...patch });
  const toggleElement = (id: string) => set({ element: value.element === id ? null : id });
  const toggleWork    = (id: string) => set({ work:    value.work    === id ? null : id });

  const searchBar = (
    <div className="relative flex items-center flex-1 min-w-0 bg-[#0d1628] border-[1.5px] border-[#2a3456] rounded-[14px] transition-all duration-150 overflow-hidden focus-within:border-[#4f66ff] focus-within:shadow-[0_0_0_3px_rgba(79,102,255,0.15)]">
      <span className="px-[14px] text-[15px] text-pal-mut flex-shrink-0 pointer-events-none leading-none">🔍</span>
      <input
        className="flex-1 bg-transparent border-none outline-none text-white text-sm py-[11px] pr-2 pl-0 font-[inherit] min-w-0 placeholder:text-pal-mut"
        value={value.search}
        onChange={(e) => set({ search: e.target.value })}
        placeholder={compact ? "Search pals..." : "Enter name"}
      />
      {value.search && (
        <button className="bg-none border-none text-pal-mut text-[13px] px-3 cursor-pointer flex-shrink-0 leading-none hover:text-white" onClick={() => set({ search: "" })}>✕</button>
      )}
    </div>
  );

  const selectCls = "field w-auto min-w-[140px] py-2 px-3 text-[13px] cursor-pointer sm:min-w-[110px]";

  return (
    <div className={`w-full max-w-[1200px] flex flex-col gap-2.5 mb-4 ${compact ? "max-w-none mb-2.5 gap-[7px]" : ""}`}>

      {/* Row 1: search + (compact) sort/order */}
      <div className="flex items-end gap-2.5 flex-wrap">
        <div className="flex flex-col gap-[5px] flex-1 min-w-[200px] min-w-0">
          {!compact && <span className="text-xs font-semibold text-pal-mut whitespace-nowrap">Search for Pal</span>}
          {searchBar}
        </div>
        {compact && (
          <>
            <select className={selectCls} value={value.sort} onChange={(e) => set({ sort: e.target.value as SortField })}>
              <option value="name">Name</option>
              <option value="level">Level</option>
              <option value="species">Species</option>
              <option value="favorites">Favorites</option>
            </select>
            <select className={selectCls} value={value.order} onChange={(e) => set({ order: e.target.value as SortOrder })}>
              <option value="asc">↑ Asc</option>
              <option value="desc">↓ Desc</option>
            </select>
          </>
        )}
      </div>

      {/* Full mode only */}
      {!compact && (
        <>
          {/* Sort + Order */}
          <div className="flex gap-2.5 flex-wrap">
            <div className="flex flex-col gap-[5px]">
              <span className="text-xs font-semibold text-pal-mut whitespace-nowrap">Sort</span>
              <select className={selectCls} value={value.sort} onChange={(e) => set({ sort: e.target.value as SortField })}>
                <option value="name">Name</option>
                <option value="level">Level</option>
                <option value="species">Species</option>
                <option value="favorites">Favorites</option>
              </select>
            </div>
            <div className="flex flex-col gap-[5px]">
              <span className="text-xs font-semibold text-pal-mut whitespace-nowrap">Order</span>
              <select className={selectCls} value={value.order} onChange={(e) => set({ order: e.target.value as SortOrder })}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          {/* Element + Work icon filters */}
          <div className="flex flex-wrap gap-5 items-start">

            {/* Element filter */}
            <div className="flex flex-col gap-[7px]">
              <span className="text-xs font-semibold text-pal-mut whitespace-nowrap">Filter by element</span>
              <div className="flex flex-wrap gap-[5px]">
                {ELEMENTS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    className={`w-9 h-9 p-[5px] rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-[130ms] ${
                      value.element === id
                        ? "border-pal-hl bg-[rgba(79,102,255,0.3)] shadow-[0_0_0_2px_rgba(124,140,255,0.35)]"
                        : "border-pal-bdr bg-pal-panel hover:border-[#4f66ff] hover:bg-[rgba(79,102,255,0.14)]"
                    }`}
                    onClick={() => toggleElement(id)}
                  >
                    <img src={`/images/elements/${id}-icon.png`} alt={label} className="w-[22px] h-[22px] object-contain block" />
                  </button>
                ))}
              </div>
            </div>

            {/* Work filter */}
            <div className="flex flex-col gap-[7px]">
              <span className="text-xs font-semibold text-pal-mut whitespace-nowrap">Filter by work</span>
              <div className="flex flex-wrap gap-[5px]">
                {WORKS.map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    title={label}
                    className={`w-9 h-9 p-[5px] rounded-lg border flex items-center justify-center cursor-pointer transition-all duration-[130ms] ${
                      value.work === id
                        ? "border-pal-hl bg-[rgba(79,102,255,0.3)] shadow-[0_0_0_2px_rgba(124,140,255,0.35)]"
                        : "border-pal-bdr bg-pal-panel hover:border-[#4f66ff] hover:bg-[rgba(79,102,255,0.14)]"
                    }`}
                    onClick={() => toggleWork(id)}
                  >
                    <img src={WORK_ICON_MAP[id]} alt={label} className="w-[22px] h-[22px] object-contain block" />
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
