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

export default function PalCard({
  pal,
  home = false,
  selected = false,
  hovered = false,
  onHover,
  onSelect,
  onToggleFavorite,
}: PalCardProps) {
  const wrapperClass = home ? "home-card" : "card";
  const innerClass = home ? "home-card-inner" : "card-inner";
  const mainClass = home ? "home-card-main" : "card-main";
  const textClass = home ? "home-card-text" : "card-text";
  const titleRowClass = home ? "home-card-title-row" : "card-title-row";
  const titleClass = home ? "home-card-title" : "card-title";

  return (
    <div
      className={`${wrapperClass} ${selected || hovered ? "is-highlighted" : ""}`}
      onMouseEnter={() => onHover(pal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(pal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(pal.id);
      }}
    >
      <div className="favorite-corner">
        <button
          className={`favorite-btn ${pal.favorite ? "active" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(pal.id);
          }}
        >
          {pal.favorite ? "★" : "☆"}
        </button>
      </div>

      <div className={innerClass}>
        <div className={mainClass}>
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className={home ? "img-home" : "img-sm"}
            onError={imgError}
          />

          <div className={textClass}>
            <div className={titleRowClass}>
              <div className={titleClass}>
                <span>{titleOf(pal)}</span>
                <span style={{ fontSize: "0.78em", lineHeight: 1 }}>
                  · Lv. {pal.level}
                </span>
              </div>

              <div className="element-icons">
                {pal.element.map((el) => (
                  <img
                    key={el}
                    src={elementIcon(el)}
                    alt={el}
                    title={el}
                    className="element-icon"
                    onError={imgError}
                  />
                ))}
              </div>
            </div>

            <div className={home ? "home-meta" : "meta"}>Species: {pal.species}</div>
            <div className={home ? "home-meta" : "meta"}>Level: {pal.level}</div>
          </div>
        </div>

        {!home && (
          <div className={hovered || selected ? "visible-button-wrap" : "hidden-button-wrap"}>
            {!selected && (
              <button
                className="secondary-btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(pal.id);
                }}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}