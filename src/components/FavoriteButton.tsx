import type { MouseEvent } from "react";

type Props = {
  active: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
};

export default function FavoriteButton({ active, onClick }: Props) {
  return (
    <button
      type="button"
      className={`favorite-btn ${active ? "active" : ""}`}
      onClick={onClick}
      title={active ? "Unfavorite pal" : "Favorite pal"}
    >
      {active ? "★" : "☆"}
    </button>
  );
}