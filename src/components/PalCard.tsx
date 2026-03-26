// src/components/PalCard.tsx
import type { Dispatch, SetStateAction } from "react";
import type { Pal } from "../types";
import {
  elementIcon, imgError, imgPath, titleOf,
  IV_STATS, IV_COLORS, ivColor, ivGlow,
} from "../utils/helpers";
import { passiveEntries } from "../data/constants";
import SkillTooltip from "./SkillTooltip";
import { WORK_ICON_MAP } from "./FilterBar";

type PalCardProps = {
  pal: Pal;
  home?: boolean;
  selected?: boolean;
  hovered?: boolean;
  gridView?: boolean;
  onHover: Dispatch<SetStateAction<number | null>>;
  onSelect: Dispatch<SetStateAction<number | null>>;
  onToggleFavorite: (id: number) => void;
  onOpenTree?: (id: number) => void;
  onDelete?: (id: number) => void;
};

const GENDER_SYMBOL = {
  male:   { symbol: "♂", color: "#60a5fa" },
  female: { symbol: "♀", color: "#f472b6" },
};

const CHIP_TIER: Record<string, string> = {
  platinum: "text-[#7fffd4] border-[rgba(127,255,212,0.35)] bg-[rgba(127,255,212,0.07)]",
  gold:     "text-[#ffa500] border-[rgba(255,165,0,0.35)] bg-[rgba(255,165,0,0.07)]",
  negative: "text-[#f87171] border-[rgba(248,113,113,0.35)] bg-[rgba(248,113,113,0.07)]",
  normal:   "text-pal-sft border-[rgba(79,102,255,0.35)] bg-[rgba(79,102,255,0.1)]",
};

function getWorkEntries(pal: Pal) {
  return Object.entries(pal.workSuitability ?? {}).filter(([, lvl]) => lvl > 0);
}

function palHasIVs(pal: Pal) {
  return ((pal.ivHP ?? 0) + (pal.ivAttack ?? 0) + (pal.ivDefense ?? 0)) > 0;
}

function getSortedPassives(pal: Pal) {
  const order = { platinum: 0, gold: 1, normal: 2, negative: 3 };
  return [...pal.passiveSkills].sort((a, b) => {
    const ta = order[passiveEntries.find((e) => e.name === a)?.tier ?? "normal"];
    const tb = order[passiveEntries.find((e) => e.name === b)?.tier ?? "normal"];
    return ta - tb;
  });
}

function IVRows({ pal, fontSize = 10 }: { pal: Pal; fontSize?: number }) {
  if (!palHasIVs(pal)) return null;
  return (
    <>
      {IV_STATS.map(({ key, symbol, symbolOffset }) => {
        const val = (pal as any)[key] ?? 0;
        if (val === 0) return null;
        const col  = IV_COLORS[ivColor(val)];
        const glow = ivGlow(val);
        return (
          <div key={key} className="flex items-center gap-[6px] leading-none" title={`${key.replace("iv", "")} IV: ${val}/100`}>
            <span style={{ color: col, textShadow: glow, fontSize, fontWeight: 700, lineHeight: 1, marginLeft: symbolOffset ? `${symbolOffset}px` : undefined }}>
              {symbol}
            </span>
            <span style={{ color: col, textShadow: glow, fontSize: fontSize - 1, fontWeight: 700, lineHeight: 1 }}>
              {val}
            </span>
          </div>
        );
      })}
    </>
  );
}

export default function PalCard({
  pal, home = false, selected = false, hovered = false, gridView = false,
  onHover, onSelect, onToggleFavorite, onOpenTree, onDelete,
}: PalCardProps) {
  const active   = selected || hovered;
  const gender   = pal.gender ? GENDER_SYMBOL[pal.gender] : null;
  const works    = getWorkEntries(pal);
  const passives = getSortedPassives(pal);

  const activeCls = active
    ? "border-2 border-pal-hl bg-pal-panel2 shadow-[0_0_0_1px_rgba(124,140,255,0.14)] scale-[1.015]"
    : "border-pal-bdr bg-pal-panel";

  /* ════════════════════════════════════
     HOME CARD — collection card view
     Uses flex-column: top info + bottom bar
  ════════════════════════════════════ */
  if (home && !gridView) {
    return (
      <div
        className={`relative border rounded-[16px] p-[18px] flex flex-col justify-between min-h-[220px] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-[160ms] ${activeCls}`}
        onMouseEnter={() => onHover(pal.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* ── Top row: image | info | IVs ── */}
        <div className="flex items-start gap-4">
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className="w-[92px] h-[92px] rounded-full object-cover object-center bg-[#0a1326] border-4 border-pal-acc shadow-[0_0_0_2px_rgba(72,99,255,0.14)] block flex-shrink-0"
            onError={imgError}
          />

          {/* Info column */}
          <div className="flex-1 min-w-0 text-left">
            <div className="inline-flex items-baseline gap-1 font-bold text-[19px] leading-[1.1] mb-1 whitespace-nowrap min-w-0 overflow-hidden">
              <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-shrink min-w-0">{titleOf(pal)}</span>
              {gender && (
                <span className="text-[13px] font-bold leading-none flex-shrink-0 ml-1 self-center" style={{ color: gender.color }}>
                  {gender.symbol}
                </span>
              )}
              <span className="whitespace-nowrap flex-shrink-0 opacity-85" style={{ fontSize: "0.78em" }}>&nbsp;· Lv. {pal.level}</span>
            </div>

            <div className="flex items-center gap-[5px] flex-wrap w-full mt-0.5">
              {works.map(([skill, lvl]) =>
                WORK_ICON_MAP[skill] ? (
                  <span key={skill} className="inline-flex items-center gap-0.5 flex-shrink-0" title={`${skill} Lv.${lvl}`}>
                    <img src={WORK_ICON_MAP[skill]} alt={skill} className="w-[18px] h-[18px] object-contain block flex-shrink-0" onError={imgError} />
                    <span className="text-[11px] font-bold text-pal-mut leading-none">{lvl}</span>
                  </span>
                ) : null
              )}
            </div>

            <div className="flex items-center gap-[5px] text-pal-sft text-[15px] mt-1">
              <span>{pal.species}</span>
              {pal.element?.map((el) => (
                <img key={el} src={elementIcon(el)} alt={el} title={el} className="w-[18px] h-[18px] object-contain block flex-shrink-0" onError={imgError} />
              ))}
            </div>
          </div>

          {/* IVs column */}
          {palHasIVs(pal) && (
            <div className="flex-shrink-0 flex flex-col items-end gap-[3px] pt-[2px]">
              <IVRows pal={pal} fontSize={13} />
            </div>
          )}
        </div>

        {/* ── Bottom section: chips (left) + buttons (right), both bottom-aligned ── */}
        <div className="grid grid-cols-[1fr_auto] items-end gap-x-2 gap-y-1 mt-3 overflow-hidden">
          {/* Chips: 2 rows of 2, bottom-aligned */}
          <div className="flex flex-col gap-1 self-end min-w-0">
            {[passives.slice(0, 2), passives.slice(2, 4)].filter(row => row.length > 0).map((row, i) => (
              <div key={i} className="flex gap-1">
                {row.map((s) => {
                  const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
                  return (
                    <SkillTooltip key={s} skill={s}>
                      <span className={`inline-block rounded-full border whitespace-nowrap cursor-default text-xs px-[11px] py-1 ${CHIP_TIER[tier]}`}>
                        {s}
                      </span>
                    </SkillTooltip>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Buttons: bottom-aligned */}
          <div className="flex items-center gap-0.5 self-end">
            <div className={`transition-opacity duration-[140ms] ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <div
                className="w-7 h-7 rounded-full bg-[rgba(255,255,255,0.12)] border border-[rgba(255,255,255,0.25)] flex items-center justify-center text-[13px] cursor-pointer hover:bg-[rgba(255,255,255,0.22)] hover:border-[rgba(255,255,255,0.5)]"
                onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}
              >✏️</div>
            </div>
            {onOpenTree && (
              <button
                className="tree-card-btn w-7 h-7 p-0 rounded-full border border-[#48506a] bg-[#16203d] text-[14px] leading-none flex items-center justify-center cursor-pointer transition-all duration-150"
                onClick={(e) => { e.stopPropagation(); onOpenTree(pal.id); }}
                title="View family tree"
              >🌳</button>
            )}
            <button
              className={`fav-btn w-7 h-7 p-0 rounded-full border border-[#48506a] text-[#ffd75f] text-[15px] leading-none flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 ${pal.favorite ? "bg-[#2a2340] border-[#8a6b18]" : "bg-[#16203d]"}`}
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(pal.id); }}
            >
              {pal.favorite ? "★" : "☆"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════
     GRID VIEW HOME CARD
  ════════════════════════════════════ */
  if (home && gridView) {
    return (
      <div
        className={`relative border rounded-[18px] pt-[14px] px-[12px] pb-[50px] shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-all duration-[160ms] ${activeCls}`}
        onMouseEnter={() => onHover(pal.id)}
        onMouseLeave={() => onHover(null)}
      >
        {/* Element icons top-left */}
        <div className="absolute top-2 left-2 z-[2] flex flex-col gap-[3px] items-start pointer-events-none">
          {pal.element?.map((el) => (
            <img key={el} src={elementIcon(el)} alt={el} title={el} className="w-[18px] h-[18px] object-contain block" onError={imgError} />
          ))}
        </div>

        {/* IVs bottom-left */}
        {palHasIVs(pal) && (
          <div className="absolute bottom-8 left-2 z-[2] flex flex-col gap-1 items-start pointer-events-none">
            <IVRows pal={pal} fontSize={12} />
          </div>
        )}

        {/* Work icons top-right */}
        <div className="absolute top-2 right-2 z-[2] flex flex-col items-end gap-[3px] pointer-events-none">
          {works.slice(0, 6).map(([skill, lvl]) =>
            WORK_ICON_MAP[skill] ? (
              <div key={skill} className="flex items-center gap-0.5" title={`${skill} Lv.${lvl}`}>
                <img src={WORK_ICON_MAP[skill]} alt={skill} className="w-[13px] h-[13px] object-contain block flex-shrink-0" onError={imgError} />
                <span className="text-[10px] font-bold text-pal-mut leading-none">{lvl}</span>
              </div>
            ) : null
          )}
        </div>

        {/* Image centered */}
        <div className="flex justify-center">
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className="w-[72px] h-[72px] rounded-full object-cover object-center bg-[#0a1326] border-[3px] border-pal-acc shadow-[0_0_0_2px_rgba(72,99,255,0.14)] block flex-shrink-0"
            onError={imgError}
          />
        </div>

        {/* Name + level */}
        <div className="text-center mt-1">
          <div className="flex justify-center items-baseline gap-1 font-bold text-sm leading-[1.1] whitespace-nowrap overflow-hidden">
            <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-shrink min-w-0">{titleOf(pal)}</span>
            {gender && (
              <span className="text-[11px] font-bold ml-0.5 self-center" style={{ color: gender.color }}>{gender.symbol}</span>
            )}
          </div>
          <div className="text-[11px] text-pal-sft text-center mt-0.5">Lv. {pal.level} · {pal.species}</div>
        </div>

        {/* Edit pencil bottom-left (hover) */}
        <div className={`absolute bottom-[12px] left-[10px] z-[3] transition-opacity duration-[140ms] ${active ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <button
            className="px-[9px] py-1 text-[11px] font-bold rounded-[10px] border border-pal-bdr2 bg-[#16203d] text-white cursor-pointer whitespace-nowrap"
            onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}
          >✏️</button>
        </div>

        {/* Star bottom-right */}
        <div className="absolute bottom-[12px] right-[12px] z-[2]">
          <button
            className={`fav-btn w-7 h-7 p-0 rounded-full border border-[#48506a] text-[#ffd75f] text-[15px] leading-none flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 ${pal.favorite ? "bg-[#2a2340] border-[#8a6b18]" : "bg-[#16203d]"}`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(pal.id); }}
          >{pal.favorite ? "★" : "☆"}</button>
        </div>

        {/* Tree bottom-right */}
        {onOpenTree && (
          <div className="absolute bottom-[12px] right-[46px] z-[2]">
            <button
              className="tree-card-btn w-7 h-7 p-0 rounded-full border border-[#48506a] bg-[#16203d] text-[14px] leading-none flex items-center justify-center cursor-pointer transition-all duration-150"
              onClick={(e) => { e.stopPropagation(); onOpenTree(pal.id); }}
              title="View family tree"
            >🌳</button>
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════
     EDIT PANEL CARD (home=false)
  ════════════════════════════════════ */
  return (
    <div
      className={`relative border rounded-[18px] p-4 transition-all duration-[160ms] min-w-0 container-type-inline-size ${activeCls}`}
      onMouseEnter={() => onHover(pal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(pal.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className="w-[72px] h-[72px] rounded-full object-cover object-center bg-[#0a1326] border-[3px] border-pal-acc shadow-[0_0_0_2px_rgba(72,99,255,0.14)] block flex-shrink-0"
            onError={imgError}
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="inline-flex items-baseline gap-1 font-bold text-[22px] leading-[1.1] whitespace-nowrap min-w-0">
              <span className="whitespace-nowrap overflow-hidden text-ellipsis flex-shrink min-w-0">{titleOf(pal)}</span>
              {gender && (
                <span className="text-[13px] font-bold leading-none flex-shrink-0 ml-1 self-center" style={{ color: gender.color }}>
                  {gender.symbol}
                </span>
              )}
              <span className="whitespace-nowrap flex-shrink-0 opacity-85" style={{ fontSize: "0.78em" }}>&nbsp;· Lv. {pal.level}</span>
            </div>

            <div className="inline-flex items-center gap-[5px] flex-wrap flex-shrink min-w-0 overflow-hidden">
              <span className="work-dot text-white text-[8px] leading-none mr-0.5 opacity-80">●</span>
              {works.map(([skill, lvl]) =>
                WORK_ICON_MAP[skill] ? (
                  <span key={skill} className="inline-flex items-center gap-0.5 flex-shrink-0" title={`${skill} Lv.${lvl}`}>
                    <img src={WORK_ICON_MAP[skill]} alt={skill} className="w-[18px] h-[18px] object-contain block flex-shrink-0" onError={imgError} />
                    <span className="text-[11px] font-bold text-pal-mut leading-none">{lvl}</span>
                  </span>
                ) : null
              )}
            </div>

            <div className="flex items-center gap-[5px] text-pal-sft text-[15px] mb-1">
              <span>{pal.species}</span>
              {pal.element?.map((el) => (
                <img key={el} src={elementIcon(el)} alt={el} title={el} className="w-[18px] h-[18px] object-contain block flex-shrink-0" onError={imgError} />
              ))}
            </div>

            {passives.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {passives.map((s) => {
                  const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
                  return (
                    <SkillTooltip key={s} skill={s}>
                      <span className={`inline-block rounded-full border whitespace-nowrap overflow-hidden text-ellipsis cursor-default text-[10px] px-[7px] py-0.5 max-w-[140px] ${CHIP_TIER[tier]}`}>
                        {s}
                      </span>
                    </SkillTooltip>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* IV pill */}
      {palHasIVs(pal) && (
        <div className="iv-pill">
          <IVRows pal={pal} fontSize={12} />
        </div>
      )}

      {/* Pencil indicator */}
      {!selected && hovered && <div className="pencil-ind">✏️</div>}

      {/* Trash */}
      {onDelete && (
        <div className="absolute bottom-[10px] right-[10px] z-[2]">
          <button
            className="trash-btn w-7 h-7 rounded-full border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.08)] text-[rgba(239,68,68,0.45)] text-[13px] flex items-center justify-center cursor-pointer p-0 transition-all duration-150"
            onClick={(e) => { e.stopPropagation(); onDelete(pal.id); }}
            title="Delete pal"
          >🗑</button>
        </div>
      )}

      {/* Star */}
      <div className="absolute top-[10px] right-[10px] z-[2]">
        <button
          className={`fav-btn w-7 h-7 p-0 rounded-full border border-[#48506a] text-[#ffd75f] text-[15px] leading-none flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150 ${pal.favorite ? "bg-[#2a2340] border-[#8a6b18]" : "bg-[#16203d]"}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(pal.id); }}
        >
          {pal.favorite ? "★" : "☆"}
        </button>
      </div>

      {/* Tree */}
      {onOpenTree && (
        <div className="absolute top-[10px] right-[44px] z-[2]">
          <button
            className="tree-card-btn w-7 h-7 p-0 rounded-full border border-[#48506a] bg-[#16203d] text-[14px] leading-none flex items-center justify-center cursor-pointer transition-all duration-150"
            onClick={(e) => { e.stopPropagation(); onOpenTree(pal.id); }}
            title="View family tree"
          >🌳</button>
        </div>
      )}
    </div>
  );
}
