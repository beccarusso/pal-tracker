import type { PassiveEntry, SkillEntry } from "../data/constants";
import { passiveEntries, ELEMENT_ORDER } from "../data/constants";
import { elementIcon } from "../utils/helpers";

type Props = {
  title: string;
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
  max: number;
  options?: string[];
  skillEntries?: SkillEntry[];
  palElements?: string[];
};

const TIER_ORDER: Record<PassiveEntry["tier"], number> = { platinum: 0, gold: 1, normal: 2 };

const TIER_STYLE: Record<PassiveEntry["tier"], React.CSSProperties> = {
  platinum: { color: "#7fffd4", textShadow: "0 0 6px #7fffd4, 0 0 12px #00e5b0", marginRight: 5 },
  gold: { color: "#ffa500", textShadow: "0 0 6px #ffa500, 0 0 12px #ff8c00", marginRight: 5 },
  normal: {},
};

const TIER_LABEL: Record<PassiveEntry["tier"], string> = {
  platinum: "✦",
  gold: "★",
  normal: "",
};

export default function SkillSection({
  title,
  skills,
  onAdd,
  onRemove,
  max,
  options,
  skillEntries,
  palElements = [],
}: Props) {
  const native = new Set(palElements.map((e) => e.toLowerCase()));
  const atMax = skills.length >= max;

  const getPassiveTier = (name: string): PassiveEntry["tier"] =>
    passiveEntries.find((e) => e.name === name)?.tier ?? "normal";

  const getActiveElement = (name: string): string =>
    skillEntries?.find((e) => e.name === name)?.element ?? "neutral";

  // passives: sort by tier then alpha; actives: sort by element order (native first) then alpha
  const sortedSkills = options
    ? [...skills].sort((a, b) => {
        const tierDiff = TIER_ORDER[getPassiveTier(a)] - TIER_ORDER[getPassiveTier(b)];
        return tierDiff !== 0 ? tierDiff : a.localeCompare(b);
      })
    : skillEntries
    ? [...skills].sort((a, b) => {
        const elA = getActiveElement(a);
        const elB = getActiveElement(b);
        // native elements come first
        const aNative = native.has(elA) ? 0 : 1;
        const bNative = native.has(elB) ? 0 : 1;
        if (aNative !== bNative) return aNative - bNative;
        // within native or non-native, sort by element order then alpha
        const elOrderDiff = ELEMENT_ORDER.indexOf(elA) - ELEMENT_ORDER.indexOf(elB);
        return elOrderDiff !== 0 ? elOrderDiff : a.localeCompare(b);
      })
    : skills;

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val || skills.includes(val) || atMax) return;
    onAdd(val);
    e.target.value = "";
  };

  const renderOptions = () => {
    if (options) {
      const platinum = passiveEntries.filter((e) => e.tier === "platinum").sort((a, b) => a.name.localeCompare(b.name));
      const gold = passiveEntries.filter((e) => e.tier === "gold").sort((a, b) => a.name.localeCompare(b.name));
      const normal = passiveEntries.filter((e) => e.tier === "normal").sort((a, b) => a.name.localeCompare(b.name));
      return (
        <>
          <optgroup label="✦ Platinum">
            {platinum.map((e) => <option key={e.name} value={e.name} disabled={skills.includes(e.name)}>✦ {e.name}</option>)}
          </optgroup>
          <optgroup label="★ Gold">
            {gold.map((e) => <option key={e.name} value={e.name} disabled={skills.includes(e.name)}>★ {e.name}</option>)}
          </optgroup>
          <optgroup label="Normal">
            {normal.map((e) => <option key={e.name} value={e.name} disabled={skills.includes(e.name)}>{e.name}</option>)}
          </optgroup>
        </>
      );
    }

    if (skillEntries) {
      const nativeEntries = skillEntries.filter((s) => native.has(s.element));
      const otherEntries = skillEntries.filter((s) => !native.has(s.element));
      const grouped: Record<string, SkillEntry[]> = {};
      otherEntries.forEach((s) => {
        if (!grouped[s.element]) grouped[s.element] = [];
        grouped[s.element].push(s);
      });
      return (
        <>
          {nativeEntries.length > 0 && (
            <optgroup label={`— ${palElements.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" / ")} (Native) —`}>
              {nativeEntries.map((s) => <option key={s.name} value={s.name} disabled={skills.includes(s.name)}>{s.name}</option>)}
            </optgroup>
          )}
          {Object.entries(grouped).map(([el, entries]) => (
            <optgroup key={el} label={`— ${el.charAt(0).toUpperCase() + el.slice(1)} —`}>
              {entries.map((s) => <option key={s.name} value={s.name} disabled={skills.includes(s.name)}>{s.name}</option>)}
            </optgroup>
          ))}
        </>
      );
    }

    return null;
  };

  return (
    <div className="section">
      <h2 className="section-title">
        {title}
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
          {skills.length}/{max}
        </span>
      </h2>

      {!atMax && (
        <select className="input" value="" onChange={handleSelect} style={{ marginBottom: 12 }}>
          <option value="">Click to add a skill</option>
          {renderOptions()}
        </select>
      )}

      {atMax && (
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Max {max} skills reached — remove one to add another.
        </div>
      )}

      <div className="chips">
        {sortedSkills.length === 0 && (
          <span className="plain" style={{ fontSize: 14 }}>No {title.toLowerCase()}</span>
        )}
        {sortedSkills.map((s) => {
          const activeEntry = skillEntries?.find((e) => e.name === s);
          const passiveTier = options ? getPassiveTier(s) : null;
          return (
            <button type="button" key={s} className="chip" onClick={() => onRemove(s)}>
              {activeEntry && (
                <img src={elementIcon(activeEntry.element)} alt={activeEntry.element} style={{ width: 14, height: 14, marginRight: 5, verticalAlign: "middle" }} />
              )}
              {passiveTier && passiveTier !== "normal" && (
                <span style={TIER_STYLE[passiveTier]}>{TIER_LABEL[passiveTier]}</span>
              )}
              {s} ×
            </button>
          );
        })}
      </div>
    </div>
  );
}