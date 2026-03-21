import { useState } from "react";
import type { ReactNode } from "react";
import type { Pal, ParentRef } from "../types";
import { imgPath, imgError, titleOf } from "../utils/helpers";

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
  const [previewId, setPreviewId] = useState<number | null>(null);

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
    setPreviewId(val && val !== "wild" ? Number(val) : null);
  };

  const currentValue =
    value === "wild" ? "wild" :
    typeof value === "number" ? String(value) : "";

  const previewPal = previewId ? pals.find((p) => p.id === previewId) :
    typeof value === "number" ? pals.find((p) => p.id === value) : null;

  return (
    <>
      <label htmlFor={selectId}>{label}</label>
      <div style={{ position: "relative" }}>
        <select
          id={selectId}
          className={`input${disabled ? " is-disabled" : ""}`}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onMouseOver={(e) => {
            const opt = (e.target as HTMLSelectElement);
            const val = opt.value;
            setPreviewId(val && val !== "wild" ? Number(val) : null);
          }}
          onFocus={() => {
            if (typeof value === "number") setPreviewId(value);
          }}
          onBlur={() => setPreviewId(null)}
        >
          <option value="">Select {field === "parent1Id" ? "parent 1" : "parent 2"}</option>
          <option value="wild">🌿 Wild</option>
          {eligible.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {titleOf(p)}{p.gender ? (p.gender === "male" ? " ♂" : " ♀") : ""}
            </option>
          ))}
        </select>

        {/* passive skills preview bubble */}
        {previewPal && previewPal.passiveSkills.length > 0 && (
          <div className="parent-preview-bubble">
            <div className="parent-preview-header">
              <img src={imgPath(previewPal.species)} alt={previewPal.species} className="parent-preview-img" onError={imgError} />
              <div>
                <div className="parent-preview-name">{titleOf(previewPal)}</div>
                <div className="parent-preview-sub">Passive Skills</div>
              </div>
            </div>
            <div className="parent-preview-skills">
              {previewPal.passiveSkills.map((s) => (
                <div key={s} className="parent-preview-skill">{s}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}