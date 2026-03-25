// src/components/PalCard.tsx
import type { Dispatch, SetStateAction } from "react";
import type { Pal } from "../types";
import { elementIcon, imgError, imgPath, titleOf } from "../utils/helpers";
import { passiveEntries } from "../data/constants";
import SkillTooltip from "./SkillTooltip";
import { WORK_ICON_MAP } from "./FilterBar"; // single source of truth for work icons

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

// Work entries with level > 0 for this pal, capped at 6 for grid view
function workEntries(pal: Pal) {
  return Object.entries(pal.workSuitability ?? {}).filter(([, lvl]) => lvl > 0);
}

export default function PalCard({
  pal, home = false, selected = false, hovered = false, gridView = false,
  onHover, onSelect, onToggleFavorite, onOpenTree, onDelete,
}: PalCardProps) {
  const p      = home ? "home-" : "";
  const active = selected || hovered;
  const gender = pal.gender ? GENDER_SYMBOL[pal.gender] : null;

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

          {/* ── Standard (non-grid) card body ── */}
          {!gridView && (
            <div className={`${p}card-text`}>
              <div className={`${p}card-title-row`}>
                <div className={`${p}card-title`}>
                  <span className="card-title-name">{titleOf(pal)}</span>
                  {gender && <span className={`gender-badge ${gender.cls}`}>{gender.symbol}</span>}
                  <span className="card-title-level">&nbsp;· Lv. {pal.level}</span>
                </div>
                <div className={`work-suitability-icons${home ? "" : " work-icons-with-dot"}`}>
                  {!home && <span className="work-icon-dot">●</span>}
                  {workEntries(pal).map(([skill, lvl]) =>
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
              {pal.passiveSkills.length > 0 && (
                <div className="card-skill-chips">
                  {[...pal.passiveSkills]
                    .sort((a, b) => {
                      const order = { platinum: 0, gold: 1, normal: 2, negative: 3 };
                      const ta = order[passiveEntries.find((e) => e.name === a)?.tier ?? "normal"];
                      const tb = order[passiveEntries.find((e) => e.name === b)?.tier ?? "normal"];
                      return ta - tb;
                    })
                    .map((s) => {
                      const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
                      return (
                        <SkillTooltip key={s} skill={s}>
                          <span className={`card-skill-chip${tier !== "normal" ? ` tier-${tier}` : ""}`}>{s}</span>
                        </SkillTooltip>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Grid view: name/level below image + work icons top-right ── */}
        {gridView && (
          <>
            {/* Element icons top-left */}
            <div className="element-icons-grid">
              {pal.element?.map((el) => (
                <img key={el} src={elementIcon(el)} alt={el} title={el} className="element-icon" onError={imgError} />
              ))}
            </div>

            {/* Work suitability icons stacked top-right */}
            <div className="work-suit-grid">
              {workEntries(pal).slice(0, 6).map(([skill, lvl]) =>
                WORK_ICON_MAP[skill] ? (
                  <div key={skill} className="work-suit-grid-row" title={`${skill} Lv.${lvl}`}>
                    <img src={WORK_ICON_MAP[skill]} alt={skill} className="work-suit-grid-icon" onError={imgError} />
                    <span className="work-suit-grid-lvl">{lvl}</span>
                  </div>
                ) : null
              )}
            </div>

            {/* Name + level */}
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
      </div>

      {/* Edit button (home/collection cards, hover only) */}
      {home && (
        <div className={active ? "visible-button-wrap" : "hidden-button-wrap"}>
          <button className="secondary-btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}>Edit</button>
        </div>
      )}

      {/* Pencil indicator (edit page, non-selected hovered cards) */}
      {!home && !selected && hovered && (
        <div className="pencil-indicator">✏️</div>
      )}

      {/* Trash button (edit page cards) */}
      {!home && onDelete && (
        <div className="trash-corner">
          <button className="trash-btn" onClick={(e) => { e.stopPropagation(); onDelete(pal.id); }} title="Delete pal">
            🗑
          </button>
        </div>
      )}

      {/* Favorite star */}
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
          <button className="tree-btn-card" onClick={(e) => { e.stopPropagation(); onOpenTree(pal.id); }} title="View family tree">
            🌳
          </button>
        </div>
      )}
    </div>
  );
}