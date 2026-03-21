import type { PassiveEntry, SkillEntry } from "../data/constants";
import { passiveEntries } from "../data/constants";
import { elementIcon } from "../utils/helpers";

type Props = {
  title: string;
  skills: string[];
  onAdd: (skill: string, replacing?: string) => void;
  onRemove: (skill: string) => void;
  max: number;
  options?: string[];
  skillEntries?: SkillEntry[];
  palElements?: string[];
};

const TIER_GLOW: Record<PassiveEntry["tier"], React.CSSProperties | null> = {
  platinum: { color: "#7fffd4", textShadow: "0 0 6px #7fffd4, 0 0 12px #00e5b0", fontSize: 12, lineHeight: 1 },
  gold:     { color: "#ffa500", textShadow: "0 0 6px #ffa500, 0 0 12px #ff8c00", fontSize: 12, lineHeight: 1 },
  normal:   null,
};

const TIER_SYMBOL: Record<PassiveEntry["tier"], string> = {
  platinum: "✦",
  gold: "★",
  normal: "",
};

export default function SkillSection({
  title, skills, onAdd, onRemove, max, options, skillEntries, palElements = [],
}: Props) {
  const native = new Set(palElements.map((e) => e.toLowerCase()));

  const getPassiveTier = (name: string): PassiveEntry["tier"] =>
    passiveEntries.find((e) => e.name === name)?.tier ?? "normal";

  const getActiveElement = (name: string): string =>
    skillEntries?.find((e) => e.name === name)?.element ?? "neutral";

  const slots: (string | null)[] = Array.from({ length: max }, (_, i) => skills[i] ?? null);

  const handleSlotChange = (slotIndex: number, newVal: string) => {
    const current = slots[slotIndex];
    if (newVal === "") {
      if (current) onRemove(current);
    } else {
      onAdd(newVal, current ?? undefined);
    }
  };

  const renderPassiveOptions = (currentSlotValue: string | null) => {
    const platinum = passiveEntries.filter((e) => e.tier === "platinum").sort((a, b) => a.name.localeCompare(b.name));
    const gold     = passiveEntries.filter((e) => e.tier === "gold").sort((a, b) => a.name.localeCompare(b.name));
    const normal   = passiveEntries.filter((e) => e.tier === "normal").sort((a, b) => a.name.localeCompare(b.name));
    const isDisabled = (name: string) => skills.includes(name) && name !== currentSlotValue;
    return (
      <>
        <optgroup label="Platinum">
          {platinum.map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Gold">
          {gold.map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Normal">
          {normal.map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
      </>
    );
  };

  const renderActiveOptions = (currentSlotValue: string | null) => {
    if (!skillEntries) return null;
    const isDisabled = (name: string) => skills.includes(name) && name !== currentSlotValue;
    const nativeEntries = skillEntries.filter((s) => native.has(s.element));
    const otherEntries  = skillEntries.filter((s) => !native.has(s.element));
    const grouped: Record<string, SkillEntry[]> = {};
    otherEntries.forEach((s) => { if (!grouped[s.element]) grouped[s.element] = []; grouped[s.element].push(s); });
    return (
      <>
        {nativeEntries.length > 0 && (
          <optgroup label={`${palElements.map((e) => e.charAt(0).toUpperCase() + e.slice(1)).join(" / ")} (Native)`}>
            {nativeEntries.map((s) => <option key={s.name} value={s.name} disabled={isDisabled(s.name)}>{s.name}</option>)}
          </optgroup>
        )}
        {Object.entries(grouped).map(([el, entries]) => (
          <optgroup key={el} label={el.charAt(0).toUpperCase() + el.slice(1)}>
            {entries.map((s) => <option key={s.name} value={s.name} disabled={isDisabled(s.name)}>{s.name}</option>)}
          </optgroup>
        ))}
      </>
    );
  };

  const isPassive = !!options;

  return (
    <div className="section">
      <h2 className="section-title">
        {title}
        <span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)", marginLeft: 8 }}>
          {skills.length}/{max}
        </span>
      </h2>

      <div className={isPassive ? "skill-slots-grid" : "skill-slots-row"}>
        {slots.map((slotVal, i) => {
          const tier      = isPassive && slotVal ? getPassiveTier(slotVal) : null;
          const tierGlow  = tier ? TIER_GLOW[tier] : null;
          const tierSym   = tier ? TIER_SYMBOL[tier] : "";
          const activeEl  = !isPassive && slotVal ? getActiveElement(slotVal) : null;
          const label     = slotVal ?? "— None —";

          return (
            <div key={i} className={`skill-slot ${slotVal ? "skill-slot-filled" : "skill-slot-empty"}`}>
              {/* invisible duplicate text used purely to size the pill */}
              <span className="skill-slot-sizer" aria-hidden="true">
                {(activeEl || (tier && tier !== "normal")) && (
                  <span style={{ display: "inline-block", width: 18 }} />
                )}
                {label}

              </span>

              {/* visible content layer, absolutely positioned over sizer */}
              <span className="skill-slot-inner">
                {activeEl && (
                  <img src={elementIcon(activeEl)} alt={activeEl} className="skill-slot-icon" />
                )}
                {tier && tier !== "normal" && tierGlow && (
                  <span style={tierGlow}>{tierSym}</span>
                )}
                <span className="skill-slot-text">{label}</span>
              </span>

              {/* native select overlaid invisibly for interaction */}
              <select
                className="skill-slot-select-overlay"
                value={slotVal ?? ""}
                onChange={(e) => handleSlotChange(i, e.target.value)}
                title={label}
              >
                <option value="">— None —</option>
                {isPassive ? renderPassiveOptions(slotVal) : renderActiveOptions(slotVal)}
              </select>

              {/* clear button — only shown on filled slots, visible on hover via CSS */}
              {slotVal && (
                <button
                  type="button"
                  className="skill-slot-clear"
                  onClick={(e) => { e.stopPropagation(); onRemove(slotVal); }}
                  title="Remove skill"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}