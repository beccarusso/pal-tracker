import type { Dispatch, SetStateAction } from "react";
import type { Pal } from "../types";
import { elementIcon, imgError, imgPath, titleOf } from "../utils/helpers";

type PalCardProps = {
  pal: Pal;
  home?: boolean;
  selected?: boolean;
  hovered?: boolean;
  onHover: Dispatch<SetStateAction<number | null>>;
  onSelect: Dispatch<SetStateAction<number | null>>;
  onToggleFavorite: (id: number) => void;
};

export default function PalCard({ pal, home = false, selected = false, hovered = false, onHover, onSelect, onToggleFavorite }: PalCardProps) {
  const p = home ? "home-" : "";
  const active = selected || hovered;

  return (
    <div
      className={`${p}card${active ? " is-highlighted" : ""}`}
      onMouseEnter={() => onHover(pal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(pal.id)}
      role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(pal.id); }}
    >
      <div className={home ? "favorite-corner-home" : "favorite-corner"}>
        <button
          className={`favorite-btn${home ? " favorite-btn-home" : ""}${pal.favorite ? " active" : ""}`}
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(pal.id); }}
        >
          {pal.favorite ? "★" : "☆"}
        </button>
      </div>

      <div className={`${p}card-inner`}>
        <div className={`${p}card-main`}>
          <img src={imgPath(pal.species)} alt={pal.species} className={home ? "img-home" : "img-sm"} onError={imgError} />
          <div className={`${p}card-text`}>
            <div className={`${p}card-title-row`}>
              <div className={`${p}card-title`}>
                <span className="card-title-name">{titleOf(pal)}</span>
                <span className="card-title-level">&nbsp;· Lv. {pal.level}</span>
              </div>
              <div className="element-icons">
                {pal.element.map((el) => (
                  <img key={el} src={elementIcon(el)} alt={el} title={el} className="element-icon" onError={imgError} />
                ))}
              </div>
            </div>
            <div className={`${p}meta`}>{pal.species}</div>
          </div>
        </div>

        {!home && (
          <div className={active ? "visible-button-wrap" : "hidden-button-wrap"}>
            {!selected && (
              <button className="secondary-btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(pal.id); }}>
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}