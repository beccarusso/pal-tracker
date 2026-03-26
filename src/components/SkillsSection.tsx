// src/components/SkillsSection.tsx
import type { PassiveEntry, SkillEntry } from "../data/constants";
import { passiveEntries } from "../data/constants";
import { elementIcon } from "../utils/helpers";
import SkillTooltip from "./SkillTooltip";

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
  negative: { color: "#b8c3da", fontSize: 12, lineHeight: 1 },
};

const TIER_SYMBOL: Record<PassiveEntry["tier"], string> = {
  platinum: "✦",
  gold:     "★",
  normal:   "",
  negative: "▼",
};

export default function SkillSection({
  title, skills, onAdd, onRemove, max, options, skillEntries, palElements = [],
}: Props) {
  const native = new Set(palElements.map((e) => e.toLowerCase()));
  const isPassive = !!options;

  const getPassiveTier  = (name: string): PassiveEntry["tier"] =>
    passiveEntries.find((e) => e.name === name)?.tier ?? "normal";
  const getActiveElement = (name: string): string =>
    skillEntries?.find((e) => e.name === name)?.element ?? "neutral";

  const slots: (string | null)[] = Array.from({ length: max }, (_, i) => skills[i] ?? null);

  const handleSlotChange = (slotIndex: number, newVal: string) => {
    const current = slots[slotIndex];
    if (newVal === "") { if (current) onRemove(current); }
    else { onAdd(newVal, current ?? undefined); }
  };

  const renderPassiveOptions = (currentSlotValue: string | null) => {
    const byTier = (t: PassiveEntry["tier"]) =>
      passiveEntries.filter((e) => e.tier === t).sort((a, b) => a.name.localeCompare(b.name));
    const isDisabled = (name: string) => skills.includes(name) && name !== currentSlotValue;
    return (
      <>
        <optgroup label="✦ Platinum">
          {byTier("platinum").map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
        <optgroup label="★ Gold">
          {byTier("gold").map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
        <optgroup label="Normal">
          {byTier("normal").map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
        </optgroup>
        <optgroup label="⚠ Negative">
          {byTier("negative").map((e) => <option key={e.name} value={e.name} disabled={isDisabled(e.name)}>{e.name}</option>)}
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

  return (
    <div className="mt-7 max-w-[760px]">
      <h2 className="text-xl font-semibold text-white mb-3 flex items-baseline gap-2">
        {title}
        <span className="text-[13px] font-normal text-pal-mut">{skills.length}/{max}</span>
      </h2>

      <div className="flex flex-wrap gap-2 max-w-[760px]">
        {slots.map((slotVal, i) => {
          const tier     = isPassive && slotVal ? getPassiveTier(slotVal) : null;
          const tierGlow = tier ? TIER_GLOW[tier] : null;
          const tierSym  = tier ? TIER_SYMBOL[tier] : "";
          const activeEl = !isPassive && slotVal ? getActiveElement(slotVal) : null;
          const label    = slotVal ?? "— None —";

          const slotCls = slotVal
            ? `border-[#4f66ff] bg-[#0e1a38]${tier === "negative" ? "" : ""}`
            : "border-pal-bdr2 bg-pal-panel opacity-70";

          return (
            <div
              key={i}
              className={`skill-slot relative h-[38px] inline-flex items-center justify-center rounded-full border transition-colors duration-150 overflow-hidden ${slotCls}`}
            >
              {/* Invisible sizer */}
              <span className="inline-flex items-center gap-[5px] px-3 text-[13px] font-semibold whitespace-nowrap invisible pointer-events-none select-none" aria-hidden="true">
                {(activeEl || (tier && tier !== "normal")) && (
                  <span style={{ display: "inline-block", width: 18 }} />
                )}
                {slotVal && tier && tier !== "normal" && <span>{tierSym}</span>}
                {label}
              </span>

              {/* Visible content */}
              {isPassive && slotVal ? (
                <SkillTooltip skill={slotVal}>
                  <span className="absolute inset-0 flex items-center justify-center gap-[5px] px-3 pointer-events-none">
                    {tier && tier !== "normal" && tierGlow && (
                      <span style={tierGlow}>{tierSym}</span>
                    )}
                    <span className="text-[13px] font-semibold whitespace-nowrap text-white">{label}</span>
                  </span>
                </SkillTooltip>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center gap-[5px] px-3 pointer-events-none">
                  {activeEl && (
                    <img src={elementIcon(activeEl)} alt={activeEl} className="w-3.5 h-3.5 object-contain flex-shrink-0" />
                  )}
                  {tier && tier !== "normal" && tierGlow && (
                    <span style={tierGlow}>{tierSym}</span>
                  )}
                  <span className="text-[13px] font-semibold whitespace-nowrap text-white">{label}</span>
                </span>
              )}

              {/* Invisible select overlay */}
              <select
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer border-none bg-transparent"
                value={slotVal ?? ""}
                onChange={(e) => handleSlotChange(i, e.target.value)}
                title={label}
              >
                <option value="">— None —</option>
                {isPassive ? renderPassiveOptions(slotVal) : renderActiveOptions(slotVal)}
              </select>

              {/* Clear button */}
              {slotVal && (
                <button
                  type="button"
                  className="slot-clear absolute right-[7px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-[rgba(99,120,255,0.5)] bg-[rgba(79,102,255,0.18)] text-[#9aabff] text-[13px] flex items-center justify-center cursor-pointer p-0 z-[2] transition-all duration-150 hover:bg-[rgba(79,102,255,0.4)] hover:border-pal-hl hover:text-white"
                  onClick={(e) => { e.stopPropagation(); onRemove(slotVal); }}
                  title="Remove skill"
                >×</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
