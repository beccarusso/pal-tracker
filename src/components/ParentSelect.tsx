import type { Pal, ParentRef } from "../types";
import { titleOf } from "../utils/helpers";

type Props = {
  id: string;
  label: string;
  pals: Pal[];
  selectedPal: Pal;
  field: "parent1Id" | "parent2Id";
  value: ParentRef;
  other: ParentRef;
  disabled?: boolean;
  onChange: (field: "parent1Id" | "parent2Id", value: ParentRef) => void;
};

export default function ParentSelect({
  id,
  label,
  pals,
  selectedPal,
  field,
  value,
  other,
  disabled = false,
  onChange,
}: Props) {
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        className={`input ${disabled ? "is-disabled" : ""}`}
        disabled={disabled}
        value={value === null ? "" : value === "wild" ? "wild" : String(value)}
        onChange={(e) =>
          onChange(
            field,
            !e.target.value
              ? null
              : e.target.value === "wild"
              ? "wild"
              : Number(e.target.value)
          )
        }
      >
        <option value="">{`Select ${label.toLowerCase()}`}</option>
        {field === "parent1Id" && (
          <option value="wild">Wild (caught/tamed)</option>
        )}
        {pals
          .filter((p) => p.id !== selectedPal.id && p.id !== other)
          .map((p) => (
            <option key={p.id} value={p.id}>
              {titleOf(p)} ({p.species})
            </option>
          ))}
      </select>
    </>
  );
}