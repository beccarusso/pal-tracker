import type { ReactNode } from "react";
import type { Pal, ParentRef } from "../types";
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
  const otherPal = typeof other === "number" ? pals.find((p) => p.id === other) : null;
  const otherGender = otherPal?.gender ?? null;

  const eligible = pals.filter((p) => {
    if (p.id === selectedPal.id) return false;
    if (typeof other === "number" && p.id === other) return false;
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
            {titleOf(p)} (Lv.{p.level}){p.gender ? (p.gender === "male" ? " ♂" : " ♀") : ""}
          </option>
        ))}
      </select>
    </>
  );
}