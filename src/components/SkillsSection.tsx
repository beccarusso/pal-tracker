type Props = {
  title: string;
  value: string;
  setValue: (value: string) => void;
  options: string[];
  skills: string[];
  onAdd: () => void;
  onRemove: (skill: string) => void;
  placeholder: string;
};

export default function SkillSection({
  title,
  value,
  setValue,
  options,
  skills,
  onAdd,
  onRemove,
  placeholder,
}: Props) {
  return (
    <div className="section">
      <h2 className="section-title">{title}</h2>

      <div className="row">
        <select
          className="input"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        >
          <option value="">{placeholder}</option>
          {options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <button type="button" className="btn" onClick={onAdd}>
          Add
        </button>
      </div>

      <div className="chips">
        {skills.map((s) => (
          <button
            type="button"
            key={s}
            className="chip"
            onClick={() => onRemove(s)}
          >
            {s} ×
          </button>
        ))}
      </div>
    </div>
  );
}