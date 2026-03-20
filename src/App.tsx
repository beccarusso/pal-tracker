import { useEffect, useMemo, useState } from "react";
import type { Pal, ParentRef } from "./types";
import "./styles/app.css";
import PalCard from "./components/PalCard";
import ParentSelect from "./components/ParentSelect";
import SkillSection from "./components/SkillsSection";
import { activeOptions, EMPTY_STATE_IMAGE, LOCAL_KEY, passiveOptions, WILD_IMAGE } from "./data/constants";
import { buildChildMap, elementIcon, getParentWarnings, imgError, imgPath, loadJSON, normalizePal, sortPals, titleOf, type RawPal, type SpeciesData } from "./utils/helpers";

export default function App() {
  const [speciesList, setSpeciesList] = useState<SpeciesData[]>([]);
  const [pals, setPals] = useState<Pal[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [selectedPalId, setSelectedPalId] = useState<number | null>(null);
  const [hoveredPalId, setHoveredPalId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [newPassive, setNewPassive] = useState("");
  const [newActive, setNewActive] = useState("");

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

  const savePals = (currentPals: Pal[]) => {
    if (!selectedPalId) return;
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(currentPals));
      setSavedIds(new Set(currentPals.map((p) => p.id)));
      setDirtyIds((prev) => { const next = new Set(prev); next.delete(selectedPalId); return next; });
    } catch (e) { console.warn("Failed to save pals.", e); }
  };

  const setParent = (field: "parent1Id" | "parent2Id", value: ParentRef) => {
    if (!selectedPal) return;
    if (value === "wild") return updatePal({ ...selectedPal, parent1Id: "wild", parent2Id: "wild" });
    if (wildLocked && field === "parent2Id") return;
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
  };

  const deleteSelectedPal = () => {
    if (!selectedPal) return;
    const deadId = selectedPal.id;
    setPals((prev) => {
      const remaining = prev
        .filter((p) => p.id !== deadId)
        .map((p) => ({ ...p, parent1Id: p.parent1Id === deadId ? null : p.parent1Id, parent2Id: p.parent2Id === deadId ? null : p.parent2Id }));

      // pick the next pal to select, or go home if none left
      const currentIndex = prev.findIndex((p) => p.id === deadId);
      const next = remaining[currentIndex] ?? remaining[currentIndex - 1] ?? null;
      setSelectedPalId(next?.id ?? null);

      return remaining;
    });
    setSavedIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
    setDirtyIds((prev) => { const next = new Set(prev); next.delete(deadId); return next; });
  };

  const updateSkill = (field: "passiveSkills" | "activeSkills", skill: string, action: "add" | "remove") => {
    if (!selectedPal || (action === "add" && !skill)) return;
    updatePal({
      ...selectedPal,
      [field]: action === "add"
        ? selectedPal[field].includes(skill) ? selectedPal[field] : [...selectedPal[field], skill]
        : selectedPal[field].filter((s) => s !== skill),
    });
  };

  const getParentInfo = (ref: ParentRef) => ({
    name: ref === "wild" ? "Wild" : typeof ref === "number" ? titleOf(palById.get(ref) ?? { name: "", species: "Unknown" }) : "",
    image: ref === "wild" ? WILD_IMAGE : typeof ref === "number" ? imgPath(palById.get(ref)?.species ?? "") : "",
  });

  useEffect(() => {
    (async () => {
      try {
        const fetchedSpecies = await loadJSON<SpeciesData[]>("/data/species.json");
        setSpeciesList(fetchedSpecies);
        const saved = localStorage.getItem(LOCAL_KEY);
        const raw = saved ? (JSON.parse(saved) as RawPal[]) : await loadJSON<RawPal[]>("/data/my-pals.json");
        const source = Array.isArray(raw) && raw.length ? raw : await loadJSON<RawPal[]>("/data/my-pals.json");
        const loaded = source.map((p) => normalizePal(p, fetchedSpecies, source));
        setPals(loaded);
        setSavedIds(new Set(loaded.map((p) => p.id)));
        setSelectedPalId(null);
      } catch (e) { console.error("Failed to load app data.", e); }
    })();
  }, []);

  if (!selectedPal) {
    return (
      <div className="home-page">
        <div className="home-header-wrap">
          <h1 className="home-title">My Pals</h1>
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
              <PalCard key={pal.id} pal={pal} home hovered={hoveredPalId === pal.id} onHover={setHoveredPalId} onSelect={setSelectedPalId} onToggleFavorite={toggleFavorite} />
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
        <h1 className="h1-link" onClick={goHome}>My Pals</h1>
        <div className="toolbar">
          <button className="btn" onClick={addPal}>+ Add Pal</button>
        </div>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pals, species, or element" style={{ marginBottom: 18 }} />
        <div className="list">
          {filteredPals.map((pal) => (
            <PalCard key={pal.id} pal={pal} selected={selectedPalId === pal.id} hovered={hoveredPalId === pal.id} onHover={setHoveredPalId} onSelect={setSelectedPalId} onToggleFavorite={toggleFavorite} />
          ))}
          {!filteredPals.length && <div className="card"><span className="plain">No pals match your search.</span></div>}
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
          title="Passive Skills" value={newPassive} setValue={setNewPassive}
          options={passiveOptions} skills={selectedPal.passiveSkills}
          onAdd={() => { updateSkill("passiveSkills", newPassive, "add"); setNewPassive(""); }}
          onRemove={(s) => updateSkill("passiveSkills", s, "remove")}
          placeholder="Select passive skill"
        />
        <SkillSection
          title="Active Skills" value={newActive} setValue={setNewActive}
          options={activeOptions} skills={selectedPal.activeSkills}
          onAdd={() => { updateSkill("activeSkills", newActive, "add"); setNewActive(""); }}
          onRemove={(s) => updateSkill("activeSkills", s, "remove")}
          placeholder="Select active skill"
        />
      </div>
    </div>
  );
}