import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { passiveEntries } from "../data/constants";

type Props = {
  skill: string;
  children: React.ReactNode;
};

export default function SkillTooltip({ skill, children }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const entry = passiveEntries.find((e) => e.name === skill);
  const desc = entry?.desc ?? "";

  const show = (e: React.MouseEvent) => {
    if (!desc || !skill) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const top = rect.bottom + 6;
    const left = rect.left;
    timer.current = setTimeout(() => setPos({ top, left }), 400);
  };

  const hide = () => {
    if (timer.current) clearTimeout(timer.current);
    setPos(null);
  };

  return (
    <>
      <span className="skill-tooltip-trigger" onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {pos && desc && createPortal(
        <div className="skill-desc-bubble" style={{ top: pos.top, left: pos.left }}>
          <div className="skill-desc-name">{skill}</div>
          <div className="skill-desc-text">
            {desc.split("\\n").map((line, i) => (
              <div key={i} className={line.startsWith("*") ? "skill-desc-note" : ""}>{line}</div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}