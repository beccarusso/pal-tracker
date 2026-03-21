import type { Pal, ParentRef } from "../types";
import type { ReactNode } from "react";
import { titleOf } from "../utils/helpers";

type Props = {
  selectId: string;
  label: ReactNode;
  pals: Pal[];
  selectedPal: Pal;
  field: "parent1Id" | "parent2Id";
  value: ParentRef;
  other: ParentRef;
  disabled?: boolean;
  onChange: (field: "parent1Id" | "parent2Id", value: ParentRef) => void;
};

export default function ParentSelect({ selectId, label, pals, selectedPal, field, value, other, disabled, onChange }: Props) {
  // determine which gender to exclude:
  // if the other parent has a known gender, hide all pals of that same gender
  const otherPal = typeof other === "number" ? pals.find((p) => p.id === other) : null;
  const otherGender = otherPal?.gender ?? null;

  const eligible = pals.filter((p) => {
    if (p.id === selectedPal.id) return false;           // can't be own parent
    if (typeof other === "number" && p.id === other) return false; // can't be both parents
    // hide same gender as the other parent (only if both genders are set)
    if (otherGender && p.gender && p.gender === otherGender) return false;
    return true;
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "") onChange(field, null);
    else if (val === "wild") onChange(field, "wild");
    else onChange(field, Number(val));
  };

  const currentValue =
    value === "wild" ? "wild" :
    typeof value === "number" ? String(value) : "";

  return (
    <>
      <label htmlFor={selectId}>{label}</label>
      <select
        id={selectId}
        className={`input${disabled ? " is-disabled" : ""}`}
        value={currentValue}
        disabled={disabled}
        onChange={handleChange}
      >
        <option value="">Select {field === "parent1Id" ? "parent 1" : "parent 2"}</option>
        <option value="wild">🌿 Wild</option>
        {eligible.map((p) => (
          <option key={p.id} value={String(p.id)}>
            {titleOf(p)}{p.gender ? (p.gender === "male" ? " ♂" : " ♀") : ""}
          </option>
        ))}
      </select>
    </>
  );
}