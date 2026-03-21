import { useEffect, useMemo, useState } from "react";
import type { Pal, ParentRef } from "./types";
import "./styles/app.css";
import PalCard from "./components/PalCard";
import ParentSelect from "./components/ParentSelect";
import SkillSection from "./components/SkillsSection";
import { EMPTY_STATE_IMAGE, getSortedActiveSkills, passiveOptions, WILD_IMAGE } from "./data/constants";
import { buildChildMap, elementIcon, getParentWarnings, imgError, imgPath, loadJSON, normalizePal, sortPals, titleOf, type RawPal, type SpeciesData } from "./utils/helpers";
import { supabase } from "./lib/supabase";
import { loadPals, savePals as savePalsToDb } from "./lib/db";
import type { User } from "@supabase/supabase-js";

const SESSION_KEY = "pal-tracker:selectedPalId";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [pals, setPals] = useState<Pal[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [selectedPalId, _setSelectedPalId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? Number(stored) : null;
  });
  const [hoveredPalId, setHoveredPalId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [palListOpen, setPalListOpen] = useState(false);

  const setSelectedPalId = (id: number | null) => {
    _setSelectedPalId(id);
    if (id === null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, String(id));
  };
  const selectPalId = setSelectedPalId as React.Dispatch<React.SetStateAction<number | null>>;

  const selectedPal = pals.find((p) => p.id === selectedPalId) ?? null;
  const isSaved = selectedPalId !== null && savedIds.has(selectedPalId) && !dirtyIds.has(selectedPalId);

  const speciesMap = useMemo(() => new Map(speciesList.map((s) => [s.species, s.element])), [speciesList]);
  const speciesOptions = useMemo(() => [...new Set(speciesList.map((s) => s.species))].sort((a, b) => a.localeCompare(b)), [speciesList]);
  const palById = useMemo(() => new Map(pals.map((p) => [p.id, p])), [pals]);
  const childMap = useMemo(() => buildChildMap(pals), [pals]);
  const parentWarnings = useMemo(() => getParentWarnings(selectedPal, childMap), [selectedPal, childMap]);
  const sortedPals = useMemo(() => sortPals(pals), [pals]);
  const filteredPals = useMemo(() => {
    const q = search.trim().toLowerCase();
    return !q ? sortedPals : sortedPals.filter((p) =>
      [titleOf(p), p.species, p.element.join(" ")].some((v) => v.toLowerCase().includes(q))
    );
  }, [sortedPals, search]);

  const getElements = (species: string) => speciesMap.get(species) ?? ["neutral"];
  const wildLocked = selectedPal?.parent1Id === "wild" || selectedPal?.parent2Id === "wild";
  const goHome = () => setSelectedPalId(null);
  const markDirty = (id: number) => setDirtyIds((prev) => new Set(prev).add(id));

  const updatePal = (next: Pal) => {
    setPals((prev) => prev.map((p) => (p.id === next.id ? next : p)));
    markDirty(next.id);
  };

  const savePals = async (currentPals: Pal[]) => {
    if (!selectedPalId || !user) return;
    try {
      await savePalsToDb(user.id, currentPals);
      setSavedIds(new Set(currentPals.map((p) => p.id)));
      setDirtyIds((prev) => { const next = new Set(prev); next.delete(selectedPalId); return next; });
    } catch (e) { console.warn("Failed to save pals.", e); }
  };

  const setParent = (field: "parent1Id" | "parent2Id", value: ParentRef) => {
    if (!selectedPal) return;
    // selecting wild locks both parents to wild
    if (value === "wild") return updatePal({ ...selectedPal, parent1Id: "wild", parent2Id: "wild" });
    // changing either field away from wild — unlock both, set the changed field, clear the other
    if (wildLocked) return updatePal({ ...selectedPal, parent1Id: field === "parent1Id" ? value : null, parent2Id: field === "parent2Id" ? value : null });
    updatePal({ ...selectedPal, [field]: value });
  };

  const change = <K extends keyof Pal>(key: K, value: Pal[K]) => {
    if (!selectedPal) return;
    if (key === "species") {
      const species = value as string;
      return updatePal({
        ...selectedPal, species,
        element: getElements(species),
        name: !selectedPal.name.trim() || selectedPal.name === selectedPal.species ? species : selectedPal.name,
      });
    }
    updatePal({ ...selectedPal, [key]: value });
  };

  const toggleFavorite = (id: number) => {
    setPals((prev) => {
      const maxOrder = prev.reduce((max, p) => p.favorite && p.favoriteOrder !== null ? Math.max(max, p.favoriteOrder) : max, 0);
      return prev.map((p) => p.id !== id ? p : p.favorite ? { ...p, favorite: false, favoriteOrder: null } : { ...p, favorite: true, favoriteOrder: maxOrder + 1 });
    });
  };

  const addPal = () => {
    const species = speciesOptions[0] ?? "Lamball";
    const pal: Pal = { id: Date.now(), name: species, species, element: getElements(species), level: 1, passiveSkills: [], activeSkills: [], parent1Id: null, parent2Id: null, notes: "", favorite: false, favoriteOrder: null };
    setPals((prev) => [...prev.filter((p) => savedIds.has(p.id)), pal]);
    setSelectedPalId(pal.id);
    setPalListOpen(false);
  };

  const deleteSelectedPal = () => {
    if (!selectedPal || !user) return;
    const deadId = selectedPal.id;
    setPals((prev) => {
      const remaining = prev
        .filter((p) => p.id !== deadId)
        .map((p) => ({ ...p, parent1Id: p.parent1Id === deadId ? null : p.parent1Id, parent2Id: p.parent2Id === deadId ? null : p.parent2Id }));
      try { savePalsToDb(user.id, remaining); } catch (e) { console.warn("Failed to persist deletion.", e); }
      const currentIndex = prev.findIndex((p) => p.id === deadId);
      const next = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null;
      setSelectedPalId(next?.id ?? null);
      return remaining;
    });
    setSavedIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
    setDirtyIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
  };

  const updateSkill = (field: "passiveSkills" | "activeSkills", skill: string, action: "add" | "remove", replacing?: string) => {
    if (!selectedPal) return;
    const current = selectedPal[field];
    let next: string[];
    if (action === "add") {
      const without = replacing ? current.filter((s) => s !== replacing) : current;
      next = without.includes(skill) ? without : [...without, skill];
    } else {
      next = current.filter((s) => s !== skill);
    }
    updatePal({ ...selectedPal, [field]: next });
  };

  const getParentInfo = (ref: ParentRef) => ({
    name: ref === "wild" ? "Wild" : typeof ref === "number" ? titleOf(palById.get(ref) ?? { name: "", species: "Unknown" }) : "",
    image: ref === "wild" ? WILD_IMAGE : typeof ref === "number" ? imgPath(palById.get(ref)?.species ?? "") : "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    (async () => {
      try {
        const fetchedSpecies = await loadJSON<SpeciesData[]>("/data/species.json");
        setSpeciesList(fetchedSpecies);
        let source: RawPal[] = [];
        if (user) {
          const dbData = await loadPals(user.id);
          if (dbData && Array.isArray(dbData) && dbData.length) {
            source = dbData as RawPal[];
          } else {
            source = await loadJSON<RawPal[]>("/data/my-pals.json");
          }
        }
        const loaded = source.map((p) => {
          const pal = normalizePal(p, fetchedSpecies, source);
          return { ...pal, passiveSkills: pal.passiveSkills.slice(0, 4), activeSkills: pal.activeSkills.slice(0, 3) };
        });
        setPals(loaded);
        setSavedIds(new Set(loaded.map((p) => p.id)));
      } catch (e) { console.error("Failed to load app data.", e); }
    })();
  }, [user, authLoading]);

  if (authLoading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", color: "#fff", fontSize: 18 }}>Loading...</div>;
  }

  if (!user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", color: "#fff", gap: 24 }}>
        <h1 style={{ fontSize: 48, margin: 0 }}>My Pals</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 18 }}>Sign in to access your pal collection</p>
        <button className="btn" style={{ fontSize: 16, padding: "14px 28px" }} onClick={() => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })}>
          Sign in with Google
        </button>
      </div>
    );
  }

  if (!selectedPal) {
    return (
      <div className="home-page">
        <div className="home-header-wrap">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 8 }}>
            <h1 className="home-title" style={{ margin: 0 }}>My Pals</h1>
            <button className="secondary-btn-sm" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
          <div className="home-search-row">
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pals, species, or element" />
            <button className="btn" onClick={addPal}>+ Add Pal</button>
          </div>
          <div className="home-intro">Choose a pal below, then click <strong>Edit</strong> to open its details.</div>
          <img src={EMPTY_STATE_IMAGE} alt="Pal friends" className="home-image" onError={imgError} />
        </div>
        {filteredPals.length ? (
          <div className="home-grid">
            {filteredPals.map((pal) => (
              <PalCard key={pal.id} pal={pal} home hovered={hoveredPalId === pal.id} onHover={setHoveredPalId} onSelect={selectPalId} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        ) : (
          <div className="empty-home-note">No pals match your search.</div>
        )}
      </div>
    );
  }

  const parents = [selectedPal.parent1Id, selectedPal.parent2Id].filter((p): p is ParentRef => p !== null);

  return (
    <div className="page">
      <div className="left">
        {/* static section: never scrolls */}
        <div className="left-static">
          <h1 className="h1-link" onClick={goHome}>My Pals</h1>
          <div className="toolbar">
            <button className="btn" onClick={addPal}>+ Add Pal</button>
          </div>
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pals, species, or element" style={{ marginBottom: 14 }} />
        </div>

        {/* desktop: full scrollable list */}
        <div className="list">
          {filteredPals.map((pal) => (
            <PalCard key={pal.id} pal={pal} selected={selectedPalId === pal.id} hovered={hoveredPalId === pal.id} onHover={setHoveredPalId} onSelect={selectPalId} onToggleFavorite={toggleFavorite} />
          ))}
          {!filteredPals.length && <div className="card"><span className="plain">No pals match your search.</span></div>}
        </div>

        {/* mobile: selected pal + chevron dropdown */}
        <div className="mobile-pal-switcher">
          <div className="mobile-pal-current" onClick={() => setPalListOpen((o) => !o)}>
            <div className="mobile-pal-current-info">
              <img src={imgPath(selectedPal.species)} alt={selectedPal.species} className="img-sm" style={{ width: 44, height: 44 }} onError={imgError} />
              <div style={{ minWidth: 0 }}>
                <div className="card-title">
                  <span className="card-title-name">{titleOf(selectedPal)}</span>
                  <span className="card-title-level">&nbsp;· Lv. {selectedPal.level}</span>
                </div>
                <div className="meta" style={{ marginBottom: 0 }}>{selectedPal.species}</div>
              </div>
            </div>
            <span className={`mobile-pal-chevron ${palListOpen ? "open" : ""}`}>▼</span>
          </div>
          {palListOpen && (
            <div className="mobile-pal-dropdown">
              {filteredPals.map((pal) => (
                <PalCard
                  key={pal.id}
                  pal={pal}
                  selected={selectedPalId === pal.id}
                  hovered={hoveredPalId === pal.id}
                  onHover={setHoveredPalId}
                  onSelect={(id) => {
                    selectPalId(id);
                    setPalListOpen(false);
                  }}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="right">
        <div className="edit-topbar">
          <div className="edit-topbar-left">
            <button className="secondary-btn-sm" onClick={goHome}>Back to Home</button>
            <div className="edit-label">Edit Pal</div>
          </div>
          <div className="edit-topbar-right">
            <button className={`btn save-btn ${isSaved ? "save-flash" : ""}`} onClick={() => savePals(pals)}>
              {isSaved ? "Saved ✓" : "Save Pal"}
            </button>
            <button className="danger" onClick={deleteSelectedPal}>Delete Pal</button>
          </div>
        </div>

        <div className="top">
          <div className="hero-wrap">
            <img src={imgPath(selectedPal.species)} alt={selectedPal.species} className="img-lg" onError={imgError} />
            <div className="hero-text">
              <div className="hero-title-row">
                <h1 className="edit-title">
                  <span className="edit-title-name">{titleOf(selectedPal)}</span>
                  <span className="edit-title-level">· Lv. {selectedPal.level}</span>
                </h1>
                <button className={`favorite-btn ${selectedPal.favorite ? "active" : ""}`} onClick={() => toggleFavorite(selectedPal.id)}>
                  {selectedPal.favorite ? "★" : "☆"}
                </button>
              </div>
              <div className="edit-subtitle">{selectedPal.species}</div>
              <div className="element-display" style={{ marginTop: 8, justifyContent: "flex-start" }}>
                {selectedPal.element?.length ? selectedPal.element.map((el) => (
                  <div key={el} className="element-chip">
                    <img src={elementIcon(el)} alt={el} title={el} className="element-icon" onError={imgError} />
                    <span className="element-label">{el}</span>
                  </div>
                )) : <span className="plain">Unknown</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid">
          <label htmlFor="pal-name">Name</label>
          <input id="pal-name" className="input" value={selectedPal.name} onChange={(e) => change("name", e.target.value)} />
          <label htmlFor="pal-species">Species</label>
          <select id="pal-species" className="input" value={selectedPal.species} onChange={(e) => change("species", e.target.value)}>
            {speciesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label htmlFor="pal-level">Level</label>
          <input id="pal-level" className="input" type="number" min={1} value={selectedPal.level} onChange={(e) => change("level", Number(e.target.value) || 1)} />
          <ParentSelect id="parent-1" label="Parent 1" pals={pals} selectedPal={selectedPal} field="parent1Id" value={selectedPal.parent1Id} other={selectedPal.parent2Id} onChange={setParent} />
          <ParentSelect id="parent-2" label="Parent 2" pals={pals} selectedPal={selectedPal} field="parent2Id" value={selectedPal.parent2Id} other={selectedPal.parent1Id} disabled={wildLocked} onChange={setParent} />
          {!!parentWarnings.warnings.length && (
            <div className="warning-box">{parentWarnings.warnings.map((w) => <div key={w}>• {w}</div>)}</div>
          )}
          {!!parentWarnings.notes.length && !parentWarnings.warnings.length && (
            <div className="note-box">{parentWarnings.notes.map((n) => <div key={n}>• {n}</div>)}</div>
          )}
          <label>Parents</label>
          <div className="parent-wrap">
            {parents.length ? parents.map((ref, i) => {
              const { name, image } = getParentInfo(ref);
              return (
                <div key={`${String(ref)}-${i}`} className="parent-badge">
                  <img src={image} alt={name} className="parent-img" onError={imgError} />
                  <span>{name}</span>
                </div>
              );
            }) : <span className="plain">None</span>}
          </div>
          <label htmlFor="pal-notes">Notes</label>
          <textarea id="pal-notes" className="input" value={selectedPal.notes} onChange={(e) => change("notes", e.target.value)} style={{ minHeight: 100, resize: "vertical" }} />
        </div>

        <SkillSection
          title="Passive Skills" options={passiveOptions} skills={selectedPal.passiveSkills} max={4}
          onAdd={(s, r) => updateSkill("passiveSkills", s, "add", r)}
          onRemove={(s) => updateSkill("passiveSkills", s, "remove")}
        />
        <SkillSection
          title="Active Skills" skillEntries={getSortedActiveSkills(selectedPal.element)}
          palElements={selectedPal.element} skills={selectedPal.activeSkills} max={3}
          onAdd={(s, r) => updateSkill("activeSkills", s, "add", r)}
          onRemove={(s) => updateSkill("activeSkills", s, "remove")}
        />
      </div>
    </div>
  );
}