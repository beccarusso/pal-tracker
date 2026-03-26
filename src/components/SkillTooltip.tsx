// src/components/SkillTooltip.tsx
import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { passiveEntries } from "../data/constants";

type Props = { skill: string; children: React.ReactNode; };

export default function SkillTooltip({ skill, children }: Props) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entry = passiveEntries.find((e) => e.name === skill);
  const desc  = entry?.desc ?? "";

  const show = (e: React.MouseEvent) => {
    if (!desc || !skill) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    timer.current = setTimeout(() => setPos({ top: rect.bottom + 6, left: rect.left }), 400);
  };
  const hide = () => { if (timer.current) clearTimeout(timer.current); setPos(null); };

  return (
    <>
      <span className="cursor-default" onMouseEnter={show} onMouseLeave={hide}>{children}</span>
      {pos && desc && createPortal(
        <div className="skill-bubble" style={{ top: pos.top, left: pos.left }}>
          <div className="text-xs font-bold text-white mb-1">{skill}</div>
          <div className="text-[11px] text-pal-sft leading-relaxed flex flex-col gap-0.5">
            {desc.split("\\n").map((line, i) => (
              <div key={i} className={line.startsWith("*") ? "text-pal-mut italic text-[10px]" : ""}>{line}</div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
