// src/App.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { Pal, ParentRef } from "./types";
import "./styles/app.css";
import PalCard from "./components/PalCard";
import ParentSelect from "./components/ParentSelect";
import SkillSection from "./components/SkillsSection";
import FamilyTree from "./components/FamilyTree";
import FilterBar, { DEFAULT_FILTER, type FilterState } from "./components/FilterBar";
import {
  EMPTY_STATE_IMAGE, getSortedActiveSkills, passiveOptions, WILD_IMAGE, passiveEntries,
} from "./data/constants";
import {
  buildChildMap, elementIcon, getParentWarnings, imgBorderCls, imgError, imgPath,
  loadJSON, normalizePal, sortPals, titleOf,
  IV_STATS, IV_COLORS, ivColor,
  type RawPal, type SpeciesData,
} from "./utils/helpers";
import { supabase } from "./lib/supabase";
import { loadPals, savePals as savePalsToDb } from "./lib/db";
import type { User } from "@supabase/supabase-js";

const SESSION_KEY  = "pal-tracker:selectedPalId";
const SESSION_PAGE = "pal-tracker:page";
type Page = "collection" | "edit" | "tree";

/* ── Shared button classes ── */
const BTN     = "px-4 py-2.5 rounded-[10px] font-bold text-white border-none cursor-pointer whitespace-nowrap transition-colors duration-150";
const BTN_PRI = `${BTN} bg-pal-pur hover:bg-[#4338ca]`;
const BTN_DNG = `px-4 py-2.5 rounded-[10px] font-bold text-white bg-pal-red border border-[#7f1d1d] cursor-pointer whitespace-nowrap`;
const BTN_SEC = "px-3.5 py-2 rounded-[10px] font-bold text-white border border-pal-bdr2 bg-[#16203d] text-sm cursor-pointer whitespace-nowrap";

export default function App() {
  const [user, setUser]               = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [pals, setPals]               = useState<Pal[]>([]);
  const [savedIds, setSavedIds]       = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds]       = useState<Set<number>>(new Set());
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const importRef = useRef<HTMLInputElement>(null);
  const [page, setPage]               = useState<Page>(() => {
    const saved = localStorage.getItem(SESSION_PAGE) as Page | null;
    const savedId = localStorage.getItem(SESSION_KEY);
    // don't restore edit page if there's no selected pal
    if (saved === "edit" && !savedId) return "collection";
    return saved ?? "collection";
  });
  const [selectedPalId, _setSelectedPalId] = useState<number | null>(() => {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? Number(s) : null;
  });
  const [hoveredPalId, setHoveredPalId]   = useState<number | null>(null);
  const [filter, setFilter]               = useState<FilterState>(DEFAULT_FILTER);
  const [editFilter, setEditFilter]       = useState<FilterState>(DEFAULT_FILTER);
  const [palListOpen, setPalListOpen]     = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [collectionView, setCollectionView]   = useState<"card" | "grid">("card");

  // ── Helpers ────────────────────────────────────────────────────
  const setSelectedPalId = (id: number | null) => {
    _setSelectedPalId(id);
    id === null ? localStorage.removeItem(SESSION_KEY) : localStorage.setItem(SESSION_KEY, String(id));
  };
  const navigate    = (p: Page) => { setPage(p); localStorage.setItem(SESSION_PAGE, p); };
  const selectPalId = setSelectedPalId as React.Dispatch<React.SetStateAction<number | null>>;
  const markDirty   = (id: number) => setDirtyIds((prev) => new Set(prev).add(id));

  // ── Derived ─────────────────────────────────────────────────────
  const selectedPal    = pals.find((p) => p.id === selectedPalId) ?? null;
  const isSaved        = selectedPalId !== null && savedIds.has(selectedPalId) && !dirtyIds.has(selectedPalId);
  const speciesMap     = useMemo(() => new Map(speciesList.map((s) => [s.species, s.element])), [speciesList]);
  const speciesOptions = useMemo(() => [...new Set(speciesList.map((s) => s.species))].sort((a, b) => a.localeCompare(b)), [speciesList]);
  const palById        = useMemo(() => new Map(pals.map((p) => [p.id, p])), [pals]);
  const childMap       = useMemo(() => buildChildMap(pals), [pals]);
  const parentWarnings = useMemo(() => getParentWarnings(selectedPal, childMap), [selectedPal, childMap]);
  const sortedPals     = useMemo(() => sortPals(pals), [pals]);
  const wildLocked     = selectedPal?.parent1Id === "wild" || selectedPal?.parent2Id === "wild";

  // ── Sort helper ─────────────────────────────────────────────────
  const applySort = (list: Pal[], f: FilterState) => {
    const dir = f.order === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (f.sort === "favorites") {
        if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
        return titleOf(a).localeCompare(titleOf(b)) * dir;
      }
      if (f.sort === "level")   return (a.level - b.level) * dir;
      if (f.sort === "species") return a.species.localeCompare(b.species) * dir;
      return titleOf(a).localeCompare(titleOf(b)) * dir;
    });
  };

  const filteredPals = useMemo(() => {
    let r = sortedPals;
    if (filter.search.trim()) {
      const q = filter.search.trim().toLowerCase();
      r = r.filter((p) => [titleOf(p), p.species, ...p.element].some((v) => v.toLowerCase().includes(q)));
    }
    if (filter.element) {
      const el = filter.element.toLowerCase();
      r = r.filter((p) => p.element.map((e) => e.toLowerCase()).includes(el));
    }
    if (filter.work) {
      r = r.filter((p) => (p.workSuitability?.[filter.work!] ?? 0) > 0);
    }
    return applySort(r, filter);
  }, [sortedPals, filter]);

  const editFilteredPals = useMemo(() => {
    let r = sortedPals;
    if (editFilter.search.trim()) {
      const q = editFilter.search.trim().toLowerCase();
      r = r.filter((p) => [titleOf(p), p.species].some((v) => v.toLowerCase().includes(q)));
    }
    return applySort(r, editFilter);
  }, [sortedPals, editFilter]);

  // ── Required fields ─────────────────────────────────────────────
  const missingFields = selectedPal ? {
    gender:  !selectedPal.gender,
    species: !selectedPal.species,
    level:   !selectedPal.level || selectedPal.level < 1,
    parent1: selectedPal.parent1Id === null,
    parent2: selectedPal.parent1Id !== "wild" && selectedPal.parent2Id === null,
  } : {};
  const hasRequiredMissing = selectedPal ? Object.values(missingFields).some(Boolean) : false;

  const Req = ({ field }: { field: keyof typeof missingFields }) =>
    missingFields[field] ? (
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.5)] text-[#f87171] text-[10px] font-extrabold ml-1.5 flex-shrink-0 align-middle" title="Required">!</span>
    ) : null;

  // ── Mutations ───────────────────────────────────────────────────
  const updatePal = (next: Pal) => {
    setPals((prev) => prev.map((p) => p.id === next.id ? next : p));
    markDirty(next.id);
  };

  const savePals = async (currentPals: Pal[]) => {
    if (!selectedPalId || !user) return;
    try {
      await savePalsToDb(user.id, currentPals);
      setSavedIds(new Set(currentPals.map((p) => p.id)));
      setDirtyIds((prev) => { const n = new Set(prev); n.delete(selectedPalId); return n; });
    } catch (e) { console.warn("Failed to save pals.", e); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    e.target.value = "";
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const rawArr: RawPal[] = Array.isArray(json) ? json : [json];

      // Map palworld-save-tools export format → RawPal if needed
      const mapped = rawArr.map((raw: any): RawPal => {
        if (raw.CharacterID !== undefined || raw.NickName !== undefined) {
          return {
            id: typeof raw.SlotIndex === "number" ? raw.SlotIndex : undefined,
            name: raw.NickName || raw.CharacterID || "Unknown",
            species: raw.CharacterID ?? "Lamball",
            level: raw.Level ?? 1,
            gender: raw.Gender?.toLowerCase() === "female" ? "female"
                  : raw.Gender?.toLowerCase() === "male"   ? "male" : null,
            ivHP:      raw.Talent_HP       ?? raw.TalentHP       ?? 0,
            ivAttack:  raw.Talent_Melee    ?? raw.TalentMelee    ?? 0,
            ivDefense: raw.Talent_Defense  ?? raw.TalentDefense  ?? 0,
            passiveSkills: Array.isArray(raw.PassiveSkillList) ? raw.PassiveSkillList : [],
            activeSkills:  Array.isArray(raw.MasteredWaza)     ? raw.MasteredWaza     : [],
            parent1Id: null, parent2Id: null,
            notes: "", favorite: false, favoriteOrder: null,
          };
        }
        return raw as RawPal;
      });

      const loaded = mapped.map((p) => {
        const pal = normalizePal(p, speciesList, mapped);
        return { ...pal, passiveSkills: pal.passiveSkills.slice(0, 4), activeSkills: pal.activeSkills.slice(0, 3) };
      });

      setPals(loaded);
      await savePalsToDb(user.id, loaded);
      setSavedIds(new Set(loaded.map((p) => p.id)));
      setDirtyIds(new Set());
      setImportStatus("success");
      setTimeout(() => setImportStatus("idle"), 2500);
      if (loaded.length) { setSelectedPalId(loaded[0].id); navigate("collection"); }
    } catch {
      setImportStatus("error");
      setTimeout(() => setImportStatus("idle"), 3000);
    }
  };

  const setParent = (field: "parent1Id" | "parent2Id", value: ParentRef) => {
    if (!selectedPal) return;
    if (value === "wild") return updatePal({ ...selectedPal, parent1Id: "wild", parent2Id: "wild" });
    if (wildLocked) return updatePal({
      ...selectedPal,
      parent1Id: field === "parent1Id" ? value : null,
      parent2Id: field === "parent2Id" ? value : null,
    });
    updatePal({ ...selectedPal, [field]: value });
  };

  const change = <K extends keyof Pal>(key: K, value: Pal[K]) => {
    if (!selectedPal) return;
    if (key === "species") {
      const species = value as string;
      return updatePal({
        ...selectedPal, species,
        element: speciesMap.get(species) ?? ["neutral"],
        name: !selectedPal.name.trim() || selectedPal.name === selectedPal.species ? species : selectedPal.name,
      });
    }
    updatePal({ ...selectedPal, [key]: value });
  };

  const toggleFavorite = (id: number) => {
    setPals((prev) => {
      const maxOrder = prev.reduce((max, p) => p.favorite && p.favoriteOrder !== null ? Math.max(max, p.favoriteOrder) : max, 0);
      return prev.map((p) => p.id !== id ? p
        : p.favorite ? { ...p, favorite: false, favoriteOrder: null }
        : { ...p, favorite: true, favoriteOrder: maxOrder + 1 });
    });
  };

  const openTree = (id: number) => { setSelectedPalId(id); navigate("tree"); };

  const addPal = () => {
    const species = speciesOptions[0] ?? "Lamball";
    const pal: Pal = {
      id: Date.now(), name: species, species,
      element: speciesMap.get(species) ?? ["neutral"],
      level: 1, gender: null,
      passiveSkills: [], activeSkills: [],
      parent1Id: null, parent2Id: null,
      notes: "",
      ivHP: 0, ivAttack: 0, ivDefense: 0,
      favorite: false, favoriteOrder: null,
    };
    setPals((prev) => [...prev.filter((p) => savedIds.has(p.id)), pal]);
    setSelectedPalId(pal.id);
    navigate("edit");
    setPalListOpen(false);
  };

  const copyPal = () => {
    if (!selectedPal) return;
    const copy: Pal = {
      ...selectedPal,
      id: Date.now(),
      name: `${selectedPal.name} (Copy)`,
      favorite: false,
      favoriteOrder: null,
    };
    setPals((prev) => [...prev.filter((p) => savedIds.has(p.id)), copy]);
    setSelectedPalId(copy.id);
    navigate("edit");
  };

  const requestDelete = (id: number) => setConfirmDeleteId(id);

  const executeDeletion = (deadId: number) => {
    if (!user) return;
    setPals((prev) => {
      const remaining = prev
        .filter((p) => p.id !== deadId)
        .map((p) => ({
          ...p,
          parent1Id: p.parent1Id === deadId ? null : p.parent1Id,
          parent2Id: p.parent2Id === deadId ? null : p.parent2Id,
        }));
      try { savePalsToDb(user.id, remaining); } catch (e) { console.warn("Failed to persist deletion.", e); }
      const idx  = prev.findIndex((p) => p.id === deadId);
      const next = remaining[idx] ?? remaining[idx - 1] ?? null;
      if (selectedPalId === deadId) {
        setSelectedPalId(next?.id ?? null);
        if (!next) navigate("collection");
      }
      return remaining;
    });
    setSavedIds((prev) => { const n = new Set(prev); n.delete(deadId); return n; });
    setDirtyIds((prev)  => { const n = new Set(prev); n.delete(deadId); return n; });
    setConfirmDeleteId(null);
  };

  const confirmDeletePal = (id: number) => {
    const pal = pals.find((p) => p.id === id);
    if (!pal || !window.confirm(`Delete ${titleOf(pal)}? This cannot be undone.`)) return;
    _setSelectedPalId(id);
    localStorage.setItem(SESSION_KEY, String(id));
    setTimeout(() => requestDelete(id), 0);
  };

  const updateSkill = (field: "passiveSkills" | "activeSkills", skill: string, action: "add" | "remove", replacing?: string) => {
    if (!selectedPal) return;
    const cur = selectedPal[field];
    const next = action === "add"
      ? [...(replacing ? cur.filter((s) => s !== replacing) : cur).filter((s) => s !== skill), skill]
      : cur.filter((s) => s !== skill);
    updatePal({ ...selectedPal, [field]: next });
  };

  const getParentInfo = (ref: ParentRef) => {
    const pal = typeof ref === "number" ? palById.get(ref) : null;
    return {
      name:   ref === "wild" ? "Wild" : pal ? titleOf(pal) : "",
      image:  ref === "wild" ? WILD_IMAGE : pal ? imgPath(pal.species) : "",
      gender: pal?.gender ?? null,
    };
  };

  // ── Auth ────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // ── Data load ───────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const fetchedSpecies = await loadJSON<SpeciesData[]>("/data/species.json");
        setSpeciesList(fetchedSpecies);
        let source: RawPal[] = [];
        if (user) {
          const dbData = await loadPals(user.id);
          source = dbData && Array.isArray(dbData) && dbData.length
            ? dbData as RawPal[]
            : await loadJSON<RawPal[]>("/data/my-pals.json");
        }
        const loaded = source.map((p) => {
          const pal = normalizePal(p, fetchedSpecies, source);
          return {
            ...pal,
            gender:        (p as any).gender ?? null,
            passiveSkills: pal.passiveSkills.slice(0, 4),
            activeSkills:  pal.activeSkills.slice(0, 3),
          };
        });
        setPals(loaded);
        setSavedIds(new Set(loaded.map((p) => p.id)));
      } catch (e) { console.error("Failed to load app data.", e); }
    })();
  }, [user, authLoading]);

  // ── Auth screens ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-pal-bg text-white text-lg">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-pal-bg text-white gap-6 px-4">
        <h1 className="text-5xl sm:text-4xl font-bold m-0">My Pals</h1>
        <p className="text-pal-mut text-lg sm:text-base text-center">Sign in to access your pal collection</p>
        <button
          className={BTN_PRI}
          style={{ fontSize: 16, padding: "14px 28px" }}
          onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })}
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  // ── Top nav ─────────────────────────────────────────────────────
  const TopNav = ({ current }: { current: Page }) => (
    <nav className="flex gap-2 flex-wrap">
      {(["collection", "tree"] as Page[]).map((p) => (
        <button
          key={p}
          className={`px-[18px] py-2 rounded-[10px] border text-sm font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 ${
            current === p
              ? "bg-pal-pur border-pal-pur text-white"
              : "border-pal-bdr2 bg-pal-panel text-pal-sft hover:bg-pal-panel2 hover:border-[#4f66ff] hover:text-white"
          }`}
          onClick={() => navigate(p)}
        >
          {p === "collection" ? "🐾 Collection" : "🌳 Family Tree"}
        </button>
      ))}
    </nav>
  );

  // ════════════════════════════════════════════════════════════════
  // COLLECTION PAGE
  // ════════════════════════════════════════════════════════════════
  if (page === "collection") return (
    <div className="min-h-screen px-7 pt-8 pb-12 sm:px-4 sm:pt-6 flex flex-col items-center bg-pal-bg text-white">
      <div className="w-full max-w-[1200px] flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <h1 className="text-5xl sm:text-4xl xs:text-3xl font-bold text-white m-0">My Pals</h1>
          <button className={BTN_SEC} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>

        <TopNav current="collection" />

        <div className="w-full max-w-[1200px] mt-4">
          <FilterBar value={filter} onChange={setFilter} />
          <div className="flex items-center justify-between flex-wrap gap-2.5 mb-1">
            {/* View toggle */}
            <div className="flex items-center gap-1.5 border border-pal-bdr2 rounded-[10px] p-1 bg-pal-panel">
              {(["card", "grid"] as const).map((v) => (
                <button
                  key={v}
                  className={`px-2.5 py-[5px] rounded-[7px] border-none text-[13px] font-semibold cursor-pointer transition-colors duration-150 ${
                    collectionView === v ? "bg-pal-pur text-white" : "bg-transparent text-pal-mut hover:bg-pal-panel2 hover:text-white"
                  }`}
                  onClick={() => setCollectionView(v)}
                >
                  {v === "card" ? "⊞ Cards" : "⊟ Grid"}
                </button>
              ))}
            </div>
            <button className={BTN_PRI} onClick={addPal}>+ Add Pal</button>
          </div>
        </div>
      </div>

      {/* Empty / grid / no-match */}
      {!pals.length ? (
        <div className="flex flex-col items-center mt-8">
          <img src={EMPTY_STATE_IMAGE} alt="No pals yet" className="w-full max-w-[520px] h-auto object-contain mb-4" onError={imgError} />
          <p className="text-pal-mut text-base text-center mt-2">Add your first pal to start building your collection!</p>
        </div>
      ) : filteredPals.length ? (
        <div className={`w-full max-w-[1200px] mt-6 flex flex-wrap justify-center gap-[22px] sm:gap-4 ${collectionView === "grid" ? "gap-4" : ""}`}>
          {filteredPals.map((pal) => (
            <div
              key={pal.id}
              className={collectionView === "grid" ? "w-[160px] flex-none" : "flex-[1_1_300px] max-w-[360px]"}
            >
              <PalCard
                pal={pal} home
                hovered={hoveredPalId === pal.id}
                onHover={setHoveredPalId}
                onSelect={(id) => { selectPalId(id); navigate("edit"); }}
                onToggleFavorite={toggleFavorite}
                onOpenTree={openTree}
                gridView={collectionView === "grid"}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-pal-mut text-[15px] mt-6">No pals match your search.</div>
      )}
    </div>
  );

  // ════════════════════════════════════════════════════════════════
  // FAMILY TREE PAGE
  // ════════════════════════════════════════════════════════════════
  if (page === "tree") return (
    <div className="min-h-screen bg-pal-bg text-white">
      <div className="px-7 pt-5 pb-0 sm:px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl sm:text-3xl font-bold text-white m-0">My Pals</h1>
          <button className={BTN_SEC} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
        <TopNav current="tree" />
      </div>
      <FamilyTree pals={pals} rootPalId={selectedPalId} onSelectPal={(id: number) => setSelectedPalId(id)} />
    </div>
  );

  // ── No pal selected on edit page ───────────────────────────────
  if (!selectedPal) return (
    <div className="min-h-screen px-7 pt-8 pb-12 flex flex-col items-center bg-pal-bg text-white">
      <div className="w-full max-w-[1200px] flex flex-col items-center">
        <div className="flex items-center justify-between w-full mb-3">
          <h1 className="text-5xl font-bold text-white m-0">My Pals</h1>
          <button className={BTN_SEC} onClick={() => supabase.auth.signOut()}>Sign Out</button>
        </div>
        <TopNav current="edit" />
        <p className="text-pal-mut mt-6">No pal selected. Go to Collection and click a pal to edit it.</p>
      </div>
    </div>
  );

  const parents = [selectedPal.parent1Id, selectedPal.parent2Id].filter((p): p is ParentRef => p !== null);

  // ════════════════════════════════════════════════════════════════
  // EDIT PAGE
  // ════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col md:flex-row h-auto md:h-screen overflow-hidden md:overflow-hidden bg-pal-bg text-white">

      {/* ── Left panel ── */}
      <div className="w-full md:w-[40%] px-4 py-6 md:px-6 border-b md:border-b-0 md:border-r border-[#22304d] flex flex-col h-auto md:h-full overflow-visible md:overflow-hidden">
        <div className="flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h1
              className="text-4xl sm:text-3xl font-bold text-white m-0 cursor-pointer select-none transition-colors duration-150 hover:text-[#b9c7ff]"
              onClick={() => navigate("collection")}
            >My Pals</h1>
          </div>
          <TopNav current="edit" />
          <div className="flex flex-wrap gap-2.5 items-center mt-3.5 mb-[18px]">
            <button className={BTN_PRI} onClick={addPal}>+ Add Pal</button>
          </div>
          <FilterBar value={editFilter} onChange={setEditFilter} compact />
        </div>

        {/* Pal list — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex flex-col gap-3.5 overflow-y-auto flex-1 min-w-0 py-1 pr-2 pb-4 pl-1 pal-scroll">
          {editFilteredPals.map((pal) => (
            <PalCard key={pal.id} pal={pal}
              selected={selectedPalId === pal.id}
              hovered={hoveredPalId === pal.id}
              onHover={setHoveredPalId}
              onSelect={selectPalId}
              onToggleFavorite={toggleFavorite}
              onOpenTree={openTree}
              onDelete={requestDelete}
            />
          ))}
          {!editFilteredPals.length && (
            <div className="border border-pal-bdr bg-pal-panel rounded-[18px] p-4">
              <span className="text-pal-sft">No pals match your search.</span>
            </div>
          )}
        </div>

        {/* Mobile accordion switcher */}
        <div className="block md:hidden mt-2.5">
          <div
            className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[14px] border border-pal-bdr2 bg-pal-panel2 cursor-pointer select-none"
            onClick={() => setPalListOpen((o) => !o)}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img src={imgPath(selectedPal.species)} alt={selectedPal.species} className={`w-11 h-11 rounded-full object-cover border-2 ${imgBorderCls(selectedPal.gender)}`} onError={imgError} />
              <div className="min-w-0">
                <div className="text-[22px] font-bold leading-[1.1] whitespace-nowrap overflow-hidden text-ellipsis">{titleOf(selectedPal)}</div>
                <div className="text-pal-sft text-[15px]">{selectedPal.species}</div>
              </div>
            </div>
            <span className={`text-sm text-pal-mut flex-shrink-0 transition-transform duration-200 ${palListOpen ? "rotate-180" : ""}`}>▼</span>
          </div>
          {palListOpen && (
            <div className="mt-2 rounded-[14px] border border-pal-bdr2 bg-pal-panel overflow-y-auto max-h-[320px] flex flex-col gap-2 p-2.5 pal-scroll">
              {editFilteredPals.map((pal) => (
                <PalCard key={pal.id} pal={pal}
                  selected={selectedPalId === pal.id}
                  hovered={hoveredPalId === pal.id}
                  onHover={setHoveredPalId}
                  onSelect={(id) => { selectPalId(id); setPalListOpen(false); }}
                  onToggleFavorite={toggleFavorite}
                  onOpenTree={openTree}
                  onDelete={confirmDeletePal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-full md:w-[60%] px-4 py-7 md:px-7 overflow-y-auto h-auto md:h-full">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3.5 mb-1 flex-wrap">
          <div className="flex items-center gap-3.5">
            <button className={BTN_SEC} onClick={() => navigate("collection")}>Back to Home</button>
            <div className="text-sm font-bold text-white underline leading-none">Edit Pal</div>
          </div>
        </div>

        {/* Hero */}
        <div className="flex items-start justify-between gap-[18px] mb-6 mt-3 min-w-0">
          <div className="flex items-start gap-[18px] min-w-0 flex-1">
            <img src={imgPath(selectedPal.species)} alt={selectedPal.species}
              className={`w-[92px] h-[92px] sm:w-[72px] sm:h-[72px] rounded-full object-cover object-center bg-[#0a1326] border-4 block flex-shrink-0 ${imgBorderCls(selectedPal.gender)}`}
              onError={imgError} />
            <div className="flex flex-col items-start pt-0.5 min-w-0">
              <div className="flex items-center gap-2.5 mb-1.5 min-w-0 flex-wrap">
                <h1 className="inline-flex items-baseline gap-1.5 m-0 text-[42px] sm:text-[28px] leading-[1.05] text-white whitespace-nowrap min-w-0">
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-shrink min-w-0">{titleOf(selectedPal)}</span>
                  {selectedPal.gender && (
                    <span className="text-[14px] font-bold self-center" style={{ color: selectedPal.gender === "male" ? "#60a5fa" : "#f472b6" }}>
                      {selectedPal.gender === "male" ? "♂" : "♀"}
                    </span>
                  )}
                  <span className="whitespace-nowrap flex-shrink-0 opacity-85 text-[0.72em] leading-none">· Lv. {selectedPal.level}</span>
                </h1>
                <button
                  className={`fav-btn w-6 h-6 p-0 rounded-full border border-[#48506a] text-[#ffd75f] text-sm leading-none flex items-center justify-center flex-shrink-0 cursor-pointer ${selectedPal.favorite ? "bg-[#2a2340] border-[#8a6b18]" : "bg-[#16203d]"}`}
                  onClick={() => toggleFavorite(selectedPal.id)}
                >
                  {selectedPal.favorite ? "★" : "☆"}
                </button>
                <button
                  className="w-6 h-6 p-0 rounded-full border border-[#48506a] bg-[#16203d] text-sm leading-none flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-[rgba(34,197,94,0.15)] hover:border-[rgba(34,197,94,0.6)]"
                  onClick={() => openTree(selectedPal.id)} title="View family tree"
                >🌳</button>
              </div>
              <div className="text-pal-mut leading-[1.2] whitespace-nowrap">{selectedPal.species}</div>
              <div className="flex flex-wrap items-center gap-2 mt-2 -ml-[5px]">
                {selectedPal.element?.length
                  ? selectedPal.element.map((el) => (
                      <div key={el} className="inline-flex items-center gap-[5px] px-[9px] py-[3px] rounded-full border border-[rgba(124,140,255,0.4)] bg-[rgba(72,99,255,0.14)] text-[#eef2ff] text-[10px] font-semibold leading-none capitalize whitespace-nowrap transition-colors duration-150 hover:bg-[rgba(72,99,255,0.22)] hover:border-pal-hl">
                        <img src={elementIcon(el)} alt={el} title={el} className="w-[13px] h-[13px] object-contain" onError={imgError} />
                        <span>{el}</span>
                      </div>
                    ))
                  : <span className="text-pal-sft">Unknown</span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Import / Save / Delete */}
        <div className="flex items-center justify-end max-w-[560px] mb-2.5 gap-2">
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          <button
            className={BTN_SEC}
            onClick={copyPal}
            title="Duplicate this pal with all its data"
          >
            ⧉ Copy Pal
          </button>
          <button
            className={`${BTN_SEC} ${importStatus === "success" ? "!bg-[#16803d] !border-[#166534] text-white" : importStatus === "error" ? "!bg-pal-red !border-[#7f1d1d] text-white" : ""}`}
            onClick={() => importRef.current?.click()}
            title="Import pals from JSON — overrides your current collection"
          >
            {importStatus === "success" ? "Imported ✓" : importStatus === "error" ? "Import failed" : "⬆ Import"}
          </button>
          <button
            className={`${BTN_PRI} save-btn${isSaved ? " save-flash" : ""}`}
            onClick={() => !hasRequiredMissing && savePals(pals)}
            disabled={hasRequiredMissing}
            title={hasRequiredMissing ? "Fill in all required fields before saving" : undefined}
            style={{ opacity: hasRequiredMissing ? 0.5 : 1, cursor: hasRequiredMissing ? "not-allowed" : "pointer" }}
          >
            {isSaved ? "Saved ✓" : "Save Pal"}
          </button>
          <button className={BTN_DNG} onClick={() => requestDelete(selectedPal.id)}>Delete Pal</button>
        </div>

        {hasRequiredMissing && (
          <div className="flex items-center gap-1.5 text-xs text-pal-mut mb-2.5 max-w-[760px] pl-[150px] sm:pl-0">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.5)] text-[#f87171] text-[10px] font-extrabold">!</span>
            Required fields must be filled before saving.
          </div>
        )}

        {/* Form + parent preview */}
        <div className="flex items-start gap-4 flex-wrap">
          {/* Form grid */}
          <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-3.5 items-center w-full md:w-[560px] flex-shrink min-w-0">

            <label htmlFor="pal-name" className="text-sm text-pal-sft">Name</label>
            <input id="pal-name" className="field" value={selectedPal.name} onChange={(e) => change("name", e.target.value)} />

            <label htmlFor="pal-species" className="text-sm text-pal-sft">Species <Req field="species" /></label>
            <select id="pal-species" className="field" value={selectedPal.species} onChange={(e) => change("species", e.target.value)}>
              {speciesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            <label htmlFor="pal-level" className="text-sm text-pal-sft">Level <Req field="level" /></label>
            <input id="pal-level" className="field" type="number" min={1} value={selectedPal.level}
              onChange={(e) => change("level", Number(e.target.value) || 1)} />

            <label className="text-sm text-pal-sft">Gender <Req field="gender" /></label>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => {
                const active = selectedPal.gender === g;
                const color  = g === "male" ? "#60a5fa" : "#f472b6";
                const shadow = g === "male"
                  ? "rgba(96,165,250,0.3)" : "rgba(244,114,182,0.3)";
                return (
                  <button
                    key={g}
                    type="button"
                    className="px-[18px] py-2 rounded-full text-sm font-semibold cursor-pointer transition-all duration-150"
                    style={active
                      ? { background: `rgba(${g === "male" ? "96,165,250" : "244,114,182"},0.2)`, borderColor: color, color, boxShadow: `0 0 0 2px ${shadow}, 0 0 12px ${shadow}`, border: "1px solid" }
                      : { border: "1px solid #31405e", background: "#0b1530", color: "#b8c3da" }
                    }
                    onClick={() => change("gender", selectedPal.gender === g ? null : g)}
                  >
                    {g === "male" ? "♂ Male" : "♀ Female"}
                  </button>
                );
              })}
            </div>

            <ParentSelect selectId="parent-1" label={<>Parent 1 <Req field="parent1" /></>}
              pals={pals} selectedPal={selectedPal} field="parent1Id"
              value={selectedPal.parent1Id} other={selectedPal.parent2Id} onChange={setParent} />
            <ParentSelect selectId="parent-2" label={<>Parent 2 <Req field="parent2" /></>}
              pals={pals} selectedPal={selectedPal} field="parent2Id"
              value={selectedPal.parent2Id} other={selectedPal.parent1Id}
              disabled={wildLocked} onChange={setParent} />

            {!!parentWarnings.warnings.length && (
              <div className="md:col-start-2 px-3.5 py-3 rounded-[12px] leading-[1.45] border border-[#7f1d1d] bg-[#2a1115] text-[#ffd2d2]">
                {parentWarnings.warnings.map((w) => <div key={w}>• {w}</div>)}
              </div>
            )}
            {!!parentWarnings.notes.length && !parentWarnings.warnings.length && (
              <div className="md:col-start-2 px-3.5 py-3 rounded-[12px] leading-[1.45] border border-[#8b6b18] bg-[#2b2410] text-[#ffe7a5]">
                {parentWarnings.notes.map((n) => <div key={n}>• {n}</div>)}
              </div>
            )}

            <label className="text-sm text-pal-sft">Parents</label>
            <div className="flex flex-wrap gap-2.5 items-center">
              {parents.length ? parents.map((ref, i) => {
                const { name, image, gender } = getParentInfo(ref);
                return (
                  <div key={`${String(ref)}-${i}`} className="inline-flex items-center gap-2.5 px-3 py-1.5 pl-1.5 rounded-full border border-[#48506a] bg-[#151d36] text-white">
                    <img src={image} alt={name} className={`w-10 h-10 rounded-full object-cover border-2 bg-[#0a1326] ${imgBorderCls(gender)}`} onError={imgError} />
                    <span>{name}</span>
                  </div>
                );
              }) : <span className="text-pal-sft">None</span>}
            </div>

            <label htmlFor="pal-notes" className="text-sm text-pal-sft">Notes</label>
            <textarea id="pal-notes" className="field" value={selectedPal.notes}
              onChange={(e) => change("notes", e.target.value)}
              style={{ minHeight: 100, resize: "vertical" }} />

            {/* IV inputs */}
            <label className="text-sm text-pal-sft">IVs</label>
            <div className="flex gap-3.5 flex-wrap items-center">
              {IV_STATS.map(({ key, symbol, label }) => {
                const val = (selectedPal as any)[key] ?? 0;
                const col = IV_COLORS[ivColor(val)];
                return (
                  <div key={key} className="flex items-center gap-1.5">
                    <span className="text-base font-bold w-4 text-center flex-shrink-0" style={{ color: col }}>{symbol}</span>
                    <span className="text-xs text-pal-mut whitespace-nowrap">{label}</span>
                    <input
                      type="number" min={0} max={100}
                      className="field w-[68px] py-2 px-2.5 text-[13px]"
                      value={val}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                        change(key as keyof Pal, n);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Parent preview sidebar */}
          <div className="flex flex-col gap-2.5 md:pt-[190px] min-w-[210px] flex-shrink-0 md:flex-shrink md:flex-row md:flex-wrap md:pt-0 md:mt-2 md:min-w-0 md:w-full lg:flex-col lg:pt-[190px] lg:min-w-[210px] lg:w-auto">
            {[selectedPal.parent1Id, selectedPal.parent2Id].map((ref, i) => {
              const previewPal = typeof ref === "number" ? palById.get(ref) : null;
              if (!previewPal) return null;
              return (
                <div key={i} className="parent-bubble w-[210px] bg-pal-panel2 border border-[#4f66ff] rounded-[14px] px-3.5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.3),0_0_0_1px_rgba(79,102,255,0.15)]">
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <img src={imgPath(previewPal.species)} alt={previewPal.species}
                      className={`w-9 h-9 rounded-full border-2 bg-[#0a1326] object-cover flex-shrink-0 ${imgBorderCls(previewPal.gender)}`}
                      onError={imgError} />
                    <div>
                      <div className="text-[13px] font-bold text-white">{titleOf(previewPal)}</div>
                      <div className="text-[11px] text-pal-mut mt-px">Passive Skills</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-[5px]">
                    {previewPal.passiveSkills.length > 0
                      ? previewPal.passiveSkills.map((s) => {
                          const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
                          const cls = tier === "platinum"
                            ? "text-[#7fffd4] border-[rgba(127,255,212,0.3)] bg-[rgba(127,255,212,0.07)] [text-shadow:0_0_6px_rgba(127,255,212,0.4)]"
                            : tier === "gold"
                            ? "text-[#ffa500] border-[rgba(255,165,0,0.3)] bg-[rgba(255,165,0,0.07)] [text-shadow:0_0_6px_rgba(255,165,0,0.4)]"
                            : tier === "negative"
                            ? "text-[#f87171] border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.07)]"
                            : "text-pal-sft border-[rgba(79,102,255,0.2)] bg-[rgba(79,102,255,0.1)]";
                          return (
                            <div key={s} className={`text-xs px-2 py-1 border rounded-[6px] ${cls}`}>{s}</div>
                          );
                        })
                      : <div className="text-xs text-pal-mut px-2 py-1 border border-[rgba(79,102,255,0.2)] bg-[rgba(79,102,255,0.1)] rounded-[6px]">No passive skills</div>
                    }
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <SkillSection title="Passive Skills" options={passiveOptions} skills={selectedPal.passiveSkills} max={4}
          onAdd={(s, r) => updateSkill("passiveSkills", s, "add", r)}
          onRemove={(s) => updateSkill("passiveSkills", s, "remove")} />
        <SkillSection title="Active Skills" skillEntries={getSortedActiveSkills(selectedPal.element)}
          palElements={selectedPal.element} skills={selectedPal.activeSkills} max={3}
          onAdd={(s, r) => updateSkill("activeSkills", s, "add", r)}
          onRemove={(s) => updateSkill("activeSkills", s, "remove")} />
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId !== null && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.6)] flex items-center justify-center z-[1000] backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-pal-panel2 border border-pal-bdr2 rounded-[18px] px-8 py-7 max-w-[400px] w-[90%] flex flex-col gap-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[22px] font-bold text-white">Delete Pal?</div>
            <div className="text-[15px] text-pal-sft leading-relaxed">
              Are you sure you want to delete{" "}
              <strong>{titleOf(pals.find((p) => p.id === confirmDeleteId) ?? { name: "", species: "Unknown" })}</strong>
              ? This cannot be undone.
            </div>
            <div className="flex gap-2.5 justify-end mt-1">
              <button className={BTN_SEC} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className={BTN_DNG} onClick={() => executeDeletion(confirmDeleteId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
