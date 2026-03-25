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
  male:   { symbol: "♂", cls: "gender-badge-male"   },
  female: { symbol: "♀", cls: "gender-badge-female" },
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

/**
 * Renders IV rows stacked vertically.
 * Skips rows where val === 0 so the display stays clean.
 */
function IVRows({ pal, fontSize = 10 }: { pal: Pal; fontSize?: number }) {
  if (!palHasIVs(pal)) return null;
  return (
    <>
      {IV_STATS.map(({ key, symbol }) => {
        const val = (pal as any)[key] ?? 0;
        if (val === 0) return null;
        const col  = IV_COLORS[ivColor(val)];
        const glow = ivGlow(val);
        return (
          <div key={key} className="iv-stack-row" title={`${key.replace("iv", "")} IV: ${val}/100`}>
            <span style={{ color: col, textShadow: glow, fontSize, fontWeight: 700, lineHeight: 1 }}>
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
  const p        = home ? "home-" : "";
  const active   = selected || hovered;
  const gender   = pal.gender ? GENDER_SYMBOL[pal.gender] : null;
  const works    = getWorkEntries(pal);
  const passives = getSortedPassives(pal);

  return (
    <div
      className={`${p}card${active ? " is-highlighted" : ""}`}
      onMouseEnter={() => onHover(pal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => !home && onSelect(pal.id)}
      style={{ cursor: home ? "default" : "pointer" }}
    >
      <div className={`${p}card-inner`}>
        <div className={`${p}card-main`}>
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className={home ? "img-home" : "img-sm"}
            onError={imgError}
          />

          {/* ════════════════════════════════════════
              STANDARD (non-grid) card body
          ════════════════════════════════════════ */}
          {!gridView && (
            <div className={`${p}card-text`}>
              <div className={`${p}card-title-row`}>
                <div className={`${p}card-title`}>
                  <span className="card-title-name">{titleOf(pal)}</span>
                  {gender && <span className={`gender-badge ${gender.cls}`}>{gender.symbol}</span>}
                  <span className="card-title-level">&nbsp;· Lv. {pal.level}</span>
                </div>
                {/* Work suitability icons inline */}
                <div className={`work-suitability-icons${home ? "" : " work-icons-with-dot"}`}>
                  {!home && <span className="work-icon-dot">●</span>}
                  {works.map(([skill, lvl]) =>
                    WORK_ICON_MAP[skill] ? (
                      <span key={skill} className="work-icon-wrap" title={`${skill} Lv.${lvl}`}>
                        <img src={WORK_ICON_MAP[skill]} alt={skill} className="work-icon" onError={imgError} />
                        <span className="work-icon-lvl">{lvl}</span>
                      </span>
                    ) : null
                  )}
                </div>
              </div>

              <div className={`${p}meta`} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span>{pal.species}</span>
                {pal.element?.map((el) => (
                  <img key={el} src={elementIcon(el)} alt={el} title={el} className="element-icon" onError={imgError} />
                ))}
              </div>

              {/* Passive skill chips:
                  - home (collection card): bigger chips, snug flex-wrap left
                  - edit panel: normal size */}
              {passives.length > 0 && (
                <div className={home ? "card-skill-chips-home" : "card-skill-chips card-skill-chips-edit"}>
                  {passives.map((s) => {
                    const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
                    return (
                      <SkillTooltip key={s} skill={s}>
                        <span className={`card-skill-chip${tier !== "normal" ? ` tier-${tier}` : ""}`}>
                          {s}
                        </span>
                      </SkillTooltip>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════
            GRID VIEW content
        ════════════════════════════════════════ */}
        {gridView && (
          <>
            {/* Element icons — absolute top-left */}
            <div className="element-icons-grid">
              {pal.element?.map((el) => (
                <img key={el} src={elementIcon(el)} alt={el} title={el} className="element-icon" onError={imgError} />
              ))}
            </div>

            {/* Top-right column: IVs stacked first, work icons below */}
            <div className="grid-tr-col">
              <IVRows pal={pal} fontSize={10} />
              {works.slice(0, 6).map(([skill, lvl]) =>
                WORK_ICON_MAP[skill] ? (
                  <div key={skill} className="work-suit-grid-row" title={`${skill} Lv.${lvl}`}>
                    <img src={WORK_ICON_MAP[skill]} alt={skill} className="work-suit-grid-icon" onError={imgError} />
                    <span className="work-suit-grid-lvl">{lvl}</span>
                  </div>
                ) : null
              )}
            </div>

            {/* Name + level centred below image */}
            <div className="home-card-text" style={{ textAlign: "center" }}>
              <div className="home-card-title-row" style={{ justifyContent: "center" }}>
                <div className="home-card-title">
                  <span className="card-title-name">{titleOf(pal)}</span>
                  {gender && <span className={`gender-badge ${gender.cls}`}>{gender.symbol}</span>}
                </div>
              </div>
              <div className="home-meta">Lv. {pal.level} · {pal.species}</div>
            </div>
          </>
        )}

        {/* IV column — collection card view (home, non-grid): absolute top-right */}
        {home && !gridView && (
          <div className="card-tr-col">
            <IVRows pal={pal} fontSize={11} />
          </div>
        )}
      </div>

      {/* IV pill — edit pal left panel cards: left of pencil */}
      {!home && palHasIVs(pal) && (
        <div className="iv-pill-card">
          <IVRows pal={pal} fontSize={10} />
        </div>
      )}

      {/* Edit button — grid view: bottom-left */}
      {home && gridView && (
        <div className={active ? "visible-button-wrap-bl" : "hidden-button-wrap-bl"}>
          <button className="secondary-btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}>
            Edit
          </button>
        </div>
      )}

      {/* Edit button — card view: top-right */}
      {home && !gridView && (
        <div className={active ? "visible-button-wrap" : "hidden-button-wrap"}>
          <button className="secondary-btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}>
            Edit
          </button>
        </div>
      )}

      {/* Pencil indicator — edit page non-selected hovered */}
      {!home && !selected && hovered && (
        <div className="pencil-indicator">✏️</div>
      )}

      {/* Trash — edit page */}
      {!home && onDelete && (
        <div className="trash-corner">
          <button className="trash-btn" onClick={(e) => { e.stopPropagation(); onDelete(pal.id); }} title="Delete pal">
            🗑
          </button>
        </div>
      )}

      {/* Favourite star */}
      <div className={home ? "favorite-corner-home" : "favorite-corner"}>
        <button
          className={`favorite-btn ${home ? "favorite-btn-home" : ""} ${pal.favorite ? "active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(pal.id); }}
        >
          {pal.favorite ? "★" : "☆"}
        </button>
      </div>

      {/* Family tree button */}
      {onOpenTree && (
        <div className={home ? "tree-corner-home" : "tree-corner"}>
          <button
            className="tree-btn-card"
            onClick={(e) => { e.stopPropagation(); onOpenTree(pal.id); }}
            title="View family tree"
          >
            🌳
          </button>
        </div>
      )}
    </div>
  );
}