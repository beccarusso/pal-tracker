import type { PassiveEntry, SkillEntry } from "../data/constants";
import { passiveEntries } from "../data/constants";
import { elementIcon } from "../utils/helpers";

type Props = {
  title: string;
  value: string;
  setValue: (value: string) => void;
  skills: string[];
  onAdd: () => void;
  onRemove: (skill: string) => void;
  placeholder: string;
  options?: string[];
  skillEntries?: SkillEntry[];
  palElements?: string[];
};

const TIER_LABEL: Record<PassiveEntry["tier"], string> = {
  platinum: "✦",
  gold: "★",
  normal: "",
};

const TIER_STYLE: Record<PassiveEntry["tier"], React.CSSProperties> = {
  platinum: {
    color: "#7fffd4",
    textShadow: "0 0 6px #7fffd4, 0 0 12px #00e5b0",
    marginRight: 5,
  },
  gold: {
    color: "#ffa500",
    textShadow: "0 0 6px #ffa500, 0 0 12px #ff8c00",
    marginRight: 5,
  },
  normal: {},
};

export default function SkillSection({
  title,
  value,
  setValue,
  skills,
  onAdd,
  onRemove,
  placeholder,
  options,
  skillEntries,
  palElements = [],
}: Props) {
  const native = new Set(palElements.map((e) => e.toLowerCase()));

  const renderOptions = () => {
    // ── Passive skills: grouped by tier, with star indicators ──
    if (options) {
      const platinum = passiveEntries.filter((e) => e.tier === "platinum").sort((a, b) => a.name.localeCompare(b.name));
      const gold = passiveEntries.filter((e) => e.tier === "gold").sort((a, b) => a.name.localeCompare(b.name));
      const normal = passiveEntries.filter((e) => e.tier === "normal").sort((a, b) => a.name.localeCompare(b.name));

      return (
        <>
          <optgroup label="✦ Platinum">
            {platinum.map((e) => (
              <option key={e.name} value={e.name}>✦ {e.name}</option>
            ))}
          </optgroup>
          <optgroup label="★ Gold">
            {gold.map((e) => (
              <option key={e.name} value={e.name}>★ {e.name}</option>
            ))}
          </optgroup>
          <optgroup label="Normal">
            {normal.map((e) => (
              <option key={e.name} value={e.name}>{e.name}</option>
            ))}
          </optgroup>
        </>
      );
    }

    // ── Active skills: native element first, then grouped by element ──
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
              {nativeEntries.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
          )}
          {Object.entries(grouped).map(([el, entries]) => (
            <optgroup key={el} label={`— ${el.charAt(0).toUpperCase() + el.slice(1)} —`}>
              {entries.map((s) => (
                <option key={s.name} value={s.name}>{s.name}</option>
              ))}
            </optgroup>
          ))}
        </>
      );
    }

    return null;
  };

  // get tier info for a passive skill chip
  const getPassiveTier = (name: string): PassiveEntry["tier"] =>
    passiveEntries.find((e) => e.name === name)?.tier ?? "normal";

  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className="row">
        <select
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {renderOptions()}
        </select>
        <button type="button" className="btn" onClick={onAdd}>Add</button>
      </div>

      <div className="chips">
        {skills.map((s) => {
          const activeEntry = skillEntries?.find((e) => e.name === s);
          const passiveTier = !skillEntries ? getPassiveTier(s) : null;

          return (
            <button type="button" key={s} className="chip" onClick={() => onRemove(s)}>
              {activeEntry && (
                <img
                  src={elementIcon(activeEntry.element)}
                  alt={activeEntry.element}
                  style={{ width: 14, height: 14, marginRight: 5, verticalAlign: "middle" }}
                />
              )}
              {passiveTier && passiveTier !== "normal" && (
                <span style={TIER_STYLE[passiveTier]}>
                  {TIER_LABEL[passiveTier]}
                </span>
              )}
              {s} ×
            </button>
          );
        })}
      </div>
    </div>
  );
}