import { useEffect, useMemo, useState } from "react";
import type { Pal, ParentRef } from "./types";
import "./styles/app.css";
import PalCard from "./components/PalCard";
import ParentSelect from "./components/ParentSelect";
import SkillSection from "./components/SkillsSection";
import FamilyTree from "./components/FamilyTree";
import { EMPTY_STATE_IMAGE, getSortedActiveSkills, passiveOptions, WILD_IMAGE } from "./data/constants";
import { buildChildMap, elementIcon, getParentWarnings, imgError, imgPath, loadJSON, normalizePal, sortPals, titleOf, type RawPal, type SpeciesData } from "./utils/helpers";
import { supabase } from "./lib/supabase";
import { loadPals, savePals as savePalsToDb } from "./lib/db";
import type { User } from "@supabase/supabase-js";

const SESSION_KEY = "pal-tracker:selectedPalId";
const SESSION_PAGE = "pal-tracker:page";

type Page = "collection" | "edit" | "tree";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [pals, setPals] = useState<Pal[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [page, setPage] = useState<Page>(() => (sessionStorage.getItem(SESSION_PAGE) as Page) ?? "collection");
  const [selectedPalId, _setSelectedPalId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem(SESSION_KEY);
    return stored ? Number(stored) : null;
  });
  const [hoveredPalId, setHoveredPalId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [palListOpen, setPalListOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [collectionView, setCollectionView] = useState<"card" | "grid">("card");

  const setSelectedPalId = (id: number | null) => {
    _setSelectedPalId(id);
    if (id === null) sessionStorage.removeItem(SESSION_KEY);
    else sessionStorage.setItem(SESSION_KEY, String(id));
  };

  const navigate = (p: Page) => {
    setPage(p);
    sessionStorage.setItem(SESSION_PAGE, p);
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

  // Required field validation
  const missingFields = selectedPal ? {
    gender:  !selectedPal.gender,
    species: !selectedPal.species,
    level:   !selectedPal.level || selectedPal.level < 1,
    parent1: selectedPal.parent1Id === null,
    parent2: selectedPal.parent1Id !== "wild" && selectedPal.parent2Id === null,
  } : {};
  const hasRequiredMissing = selectedPal ? Object.values(missingFields).some(Boolean) : false;
  const Req = ({ field }: { field: keyof typeof missingFields }) =>
    missingFields[field] ? <span className="required-indicator" title="Required">!</span> : null;
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
    if (value === "wild") return updatePal({ ...selectedPal, parent1Id: "wild", parent2Id: "wild" });
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

  const openTree = (id: number) => {
    setSelectedPalId(id);
    navigate("tree");
  };

  const addPal = () => {
    const species = speciesOptions[0] ?? "Lamball";
    const pal: Pal = {
      id: Date.now(), name: species, species,
      element: getElements(species), level: 1,
      gender: null,
      passiveSkills: [], activeSkills: [],
      parent1Id: null, parent2Id: null,
      notes: "", favorite: false, favoriteOrder: null,
    };
    setPals((prev) => [...prev.filter((p) => savedIds.has(p.id)), pal]);
    setSelectedPalId(pal.id);
    navigate("edit");
    setPalListOpen(false);
  };

  const requestDelete = (id: number) => setConfirmDeleteId(id);

  const executeDeletion = (deadId: number) => {
    if (!user) return;
    setPals((prev) => {
      const remaining = prev
        .filter((p) => p.id !== deadId)
        .map((p) => ({ ...p, parent1Id: p.parent1Id === deadId ? null : p.parent1Id, parent2Id: p.parent2Id === deadId ? null : p.parent2Id }));
      try { savePalsToDb(user.id, remaining); } catch (e) { console.warn("Failed to persist deletion.", e); }
      const currentIndex = prev.findIndex((p) => p.id === deadId);
      const next = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null;
      if (selectedPalId === deadId) {
        setSelectedPalId(next?.id ?? null);
        if (!next) navigate("collection");
      }
      return remaining;
    });
    setSavedIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
    setDirtyIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
    setConfirmDeleteId(null);
  };

  const confirmDeletePal = (id: number) => {
    const pal = pals.find((p) => p.id === id);
    if (!pal) return;
    if (!window.confirm(`Are you sure you want to delete ${titleOf(pal)}? This cannot be undone.`)) return;
    // temporarily select this pal so deleteSelectedPal targets it
    _setSelectedPalId(id);
    sessionStorage.setItem(SESSION_KEY, String(id));
    // use setTimeout to let state settle before deleting
    setTimeout(() => deleteSelectedPal(), 0);
  };

  const deleteSelectedPal = () => {
    if (!selectedPal) return;
    requestDelete(selectedPal.id);
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
          if (dbData && Array.isArray(dbData) && dbData.length) source = dbData as RawPal[];
          else source = await loadJSON<RawPal[]>("/data/my-pals.json");
        }
        const loaded = source.map((p) => {
          const pal = normalizePal(p, fetchedSpecies, source);
          return {
            ...pal,
            gender: (p as any).gender ?? null,
            passiveSkills: pal.passiveSkills.slice(0, 4),
            activeSkills: pal.activeSkills.slice(0, 3),
          };
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

  const TopNav = ({ current }: { current: Page }) => (
    <nav className="top-nav">
      <button className={`nav-btn ${current === "collection" ? "nav-btn-active" : ""}`} onClick={() => navigate("collection")}>🐾 Collection</button>
      <button className={`nav-btn ${current === "tree" ? "nav-btn-active" : ""}`} onClick={() => navigate("tree")}>🌳 Family Tree</button>
    </nav>
  );

  if (page === "collection") {
    return (
      <div className="home-page">
        <div className="home-header-wrap">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
            <h1 className="home-title" style={{ margin: 0 }}>My Pals</h1>
            <button className="secondary-btn-sm" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
          <TopNav current="collection" />
          <div className="home-search-row" style={{ marginTop: 16 }}>
            <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pals, species, or element" />
            <div className="view-toggle">
              <button className={`view-toggle-btn ${collectionView === "card" ? "active" : ""}`} onClick={() => setCollectionView("card")} title="Card view">⊞ Cards</button>
              <button className={`view-toggle-btn ${collectionView === "grid" ? "active" : ""}`} onClick={() => setCollectionView("grid")} title="Grid view">⊟ Grid</button>
            </div>
            <button className="btn" onClick={addPal}>+ Add Pal</button>
          </div>
          <img src={EMPTY_STATE_IMAGE} alt="Pal friends" className="home-image" onError={imgError} />
        </div>
        {filteredPals.length ? (
          <div className={`home-grid ${collectionView === "grid" ? "grid-view" : ""}`}>
            {filteredPals.map((pal) => (
              <PalCard key={pal.id} pal={pal} home
                hovered={hoveredPalId === pal.id}
                onHover={setHoveredPalId}
                onSelect={(id) => { selectPalId(id); navigate("edit"); }}
                onToggleFavorite={toggleFavorite}
                onOpenTree={openTree}
                gridView={collectionView === "grid"}
              />
            ))}
          </div>
        ) : (
          <div className="empty-home-note">No pals match your search.</div>
        )}
      </div>
    );
  }

  if (page === "tree") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "#fff" }}>
        <div style={{ padding: "20px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h1 style={{ margin: 0, fontSize: 32, color: "#fff" }}>My Pals</h1>
            <button className="secondary-btn-sm" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
          <TopNav current="tree" />
        </div>
        <FamilyTree pals={pals} rootPalId={selectedPalId} onSelectPal={(id: number) => setSelectedPalId(id)} />
      </div>
    );
  }

  if (!selectedPal) {
    return (
      <div className="home-page">
        <div className="home-header-wrap">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: 12 }}>
            <h1 className="home-title" style={{ margin: 0 }}>My Pals</h1>
            <button className="secondary-btn-sm" onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
          <TopNav current="edit" />
          <p style={{ color: "var(--text-muted)", marginTop: 24 }}>No pal selected. Go to Collection and click a pal to edit it.</p>
        </div>
      </div>
    );
  }

  const parents = [selectedPal.parent1Id, selectedPal.parent2Id].filter((p): p is ParentRef => p !== null);

  return (
    <div className="page">
      <div className="left">
        <div className="left-static">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h1 className="h1-link" style={{ margin: 0 }} onClick={() => navigate("collection")}>My Pals</h1>
          </div>
          <TopNav current="edit" />
          <div className="toolbar" style={{ marginTop: 14 }}>
            <button className="btn" onClick={addPal}>+ Add Pal</button>
          </div>
          <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pals, species, or element" style={{ marginBottom: 14 }} />
        </div>

        <div className="list">
          {filteredPals.map((pal) => (
            <PalCard key={pal.id} pal={pal} selected={selectedPalId === pal.id} hovered={hoveredPalId === pal.id}
              onHover={setHoveredPalId} onSelect={selectPalId} onToggleFavorite={toggleFavorite} onOpenTree={openTree} onDelete={requestDelete}
            />
          ))}
          {!filteredPals.length && <div className="card"><span className="plain">No pals match your search.</span></div>}
        </div>

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
                <PalCard key={pal.id} pal={pal} selected={selectedPalId === pal.id} hovered={hoveredPalId === pal.id}
                  onHover={setHoveredPalId} onSelect={(id) => { selectPalId(id); setPalListOpen(false); }}
                  onToggleFavorite={toggleFavorite} onOpenTree={openTree} onDelete={confirmDeletePal}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="right">
        <div className="edit-topbar">
          <div className="edit-topbar-left">
            <button className="secondary-btn-sm" onClick={() => navigate("collection")}>Back to Home</button>
            <div className="edit-label">Edit Pal</div>
          </div>
        </div>

        <div className="top">
          <div className="hero-wrap">
            <img src={imgPath(selectedPal.species)} alt={selectedPal.species} className="img-lg" onError={imgError} />
            <div className="hero-text">
              <div className="hero-title-row">
                <h1 className="edit-title">
                  <span className="edit-title-name">{titleOf(selectedPal)}</span>
                  {selectedPal.gender && (
                    <span className={`gender-symbol ${selectedPal.gender === "male" ? "gender-male" : "gender-female"}`}>
                      {selectedPal.gender === "male" ? "♂" : "♀"}
                    </span>
                  )}
                  <span className="edit-title-level">· Lv. {selectedPal.level}</span>
                </h1>
                <button className={`favorite-btn ${selectedPal.favorite ? "active" : ""}`} onClick={() => toggleFavorite(selectedPal.id)}>
                  {selectedPal.favorite ? "★" : "☆"}
                </button>
                <button className="tree-btn" onClick={() => openTree(selectedPal.id)} title="View family tree">❤️</button>
              </div>
              <div className="edit-subtitle">{selectedPal.species}</div>
              <div className="element-display" style={{ marginTop: 8, justifyContent: "flex-start", marginLeft: -5 }}>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", maxWidth: 760, marginBottom: 10, marginTop: 8, gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              className={`btn save-btn ${isSaved ? "save-flash" : ""}`}
              onClick={() => !hasRequiredMissing && savePals(pals)}
              disabled={hasRequiredMissing}
              title={hasRequiredMissing ? "Fill in all required fields before saving" : undefined}
            >
              {isSaved ? "Saved ✓" : "Save Pal"}
            </button>
            <button className="danger" onClick={() => requestDelete(selectedPal.id)}>Delete Pal</button>
          </div>
        </div>
        {hasRequiredMissing && (
          <div className="required-legend" style={{ margin: "0 0 10px", paddingLeft: 150 }}>
            <span className="required-indicator">!</span> Required fields must be filled before saving.
          </div>
        )}
        <div className="grid">
          <label htmlFor="pal-name">Name</label>
          <input id="pal-name" className="input" value={selectedPal.name} onChange={(e) => change("name", e.target.value)} />

          <label htmlFor="pal-species">Species <Req field="species" /></label>
          <select id="pal-species" className="input" value={selectedPal.species} onChange={(e) => change("species", e.target.value)}>
            {speciesOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <label htmlFor="pal-level">Level <Req field="level" /></label>
          <input id="pal-level" className="input" type="number" min={1} value={selectedPal.level} onChange={(e) => change("level", Number(e.target.value) || 1)} />

          <label htmlFor="pal-gender">Gender <Req field="gender" /></label>
          <div id="pal-gender" className="gender-toggle">
            <button
              type="button"
              className={`gender-btn gender-btn-male ${selectedPal.gender === "male" ? "gender-btn-active-male" : ""}`}
              onClick={() => change("gender", selectedPal.gender === "male" ? null : "male")}
            >
              ♂ Male
            </button>
            <button
              type="button"
              className={`gender-btn gender-btn-female ${selectedPal.gender === "female" ? "gender-btn-active-female" : ""}`}
              onClick={() => change("gender", selectedPal.gender === "female" ? null : "female")}
            >
              ♀ Female
            </button>
          </div>

          <ParentSelect selectId="parent-1" label={<>Parent 1 <Req field="parent1" /></>} pals={pals} selectedPal={selectedPal} field="parent1Id" value={selectedPal.parent1Id} other={selectedPal.parent2Id} onChange={setParent} />
          <ParentSelect selectId="parent-2" label={<>Parent 2 <Req field="parent2" /></>} pals={pals} selectedPal={selectedPal} field="parent2Id" value={selectedPal.parent2Id} other={selectedPal.parent1Id} disabled={wildLocked} onChange={setParent} />

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

        <SkillSection title="Passive Skills" options={passiveOptions} skills={selectedPal.passiveSkills} max={4}
          onAdd={(s, r) => updateSkill("passiveSkills", s, "add", r)}
          onRemove={(s) => updateSkill("passiveSkills", s, "remove")}
        />
        <SkillSection title="Active Skills" skillEntries={getSortedActiveSkills(selectedPal.element)}
          palElements={selectedPal.element} skills={selectedPal.activeSkills} max={3}
          onAdd={(s, r) => updateSkill("activeSkills", s, "add", r)}
          onRemove={(s) => updateSkill("activeSkills", s, "remove")}
        />
      </div>

      {/* Delete confirmation modal */}
      {confirmDeleteId !== null && (
        <div className="confirm-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-title">Delete Pal?</div>
            <div className="confirm-body">
              Are you sure you want to delete <strong>{titleOf(pals.find(p => p.id === confirmDeleteId) ?? { name: "", species: "Unknown" })}</strong>? This cannot be undone.
            </div>
            <div className="confirm-actions">
              <button className="secondary-btn-sm" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="danger" onClick={() => executeDeletion(confirmDeleteId)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}