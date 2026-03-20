import type { Pal } from "../types";
import FavoriteButton from "./FavoriteButton";
import { imgError, imgPath, titleOf, elementIcon } from "../utils/helpers";

type Props = {
  pal: Pal;
  hovered: boolean;
  selected?: boolean;
  home?: boolean;
  onHover: (id: number | null) => void;
  onSelect: (id: number) => void;
  onToggleFavorite: (id: number) => void;
};

export default function PalCard({
  pal,
  hovered,
  selected = false,
  home = false,
  onHover,
  onSelect,
  onToggleFavorite,
}: Props) {
  const highlighted = selected || hovered;

  return (
    <div
      className={`${home ? "home-card" : "card"} ${
        highlighted ? "is-highlighted" : ""
      }`}
      onMouseEnter={() => onHover(pal.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(pal.id)}
    >
      <div className="favorite-corner">
        <FavoriteButton
          active={pal.favorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(pal.id);
          }}
        />
      </div>

      <div className={home ? "home-card-inner" : "card-inner"}>
        <div className={home ? "home-card-main" : "card-main"}>
          <img
            src={imgPath(pal.species)}
            alt={pal.species}
            className={home ? "img-home" : "img-sm"}
            onError={imgError}
          />

          <div className={home ? "home-card-text" : "card-text"}>
            <div className={home ? "home-card-title-row" : "card-title-row"}>
              <div className={home ? "home-card-title" : "card-title"}>
                {titleOf(pal)}
              </div>

              <div className="element-icons">
                {pal.element?.length ? (
                  pal.element.map((el) => (
                    <img
                      key={el}
                      src={elementIcon(el)}
                      alt={el}
                      title={el}
                      className="element-icon"
                      onError={imgError}
                    />
                  ))
                ) : (
                  <span className={home ? "home-meta" : "meta"}>Unknown</span>
                )}
              </div>
            </div>

            <div className={home ? "home-meta" : "meta"}>
              Species: {pal.species}
            </div>

            <div className={home ? "home-meta" : "meta"}>
              Level: {pal.level}
            </div>
          </div>
        </div>

        {!home && !selected && (
          <div
            className={hovered ? "visible-button-wrap" : "hidden-button-wrap"}
          >
            <button
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(pal.id);
              }}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {home && (
        <div className="home-actions">
          <div
            className={hovered ? "visible-button-wrap" : "hidden-button-wrap"}
          >
            <button
              className="btn"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(pal.id);
              }}
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}