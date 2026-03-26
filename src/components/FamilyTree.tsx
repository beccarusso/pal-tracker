// src/components/FamilyTree.tsx
import { useState, useCallback, useRef } from "react";
import type { Pal } from "../types";
import {
  imgPath, imgError, titleOf, buildChildMap,
  IV_STATS, IV_COLORS, ivColor, ivGlow,
} from "../utils/helpers";
import { passiveEntries } from "../data/constants";

type Props = {
  pals: Pal[];
  rootPalId: number | null;
  onSelectPal: (id: number) => void;
};

type TreeNode = {
  pal: Pal | null;
  isWild: boolean;
  parent1: TreeNode | null;
  parent2: TreeNode | null;
  children: TreeNode[];
};

function buildTree(
  palId: number | "wild" | null,
  palMap: Map<number, Pal>,
  childMap: Map<number, number[]>,
  visited = new Set<number>(),
  includeChildren = true
): TreeNode | null {
  if (palId === null) return null;
  if (palId === "wild") return { pal: null, isWild: true, parent1: null, parent2: null, children: [] };
  if (visited.has(palId)) return null;
  const pal = palMap.get(palId);
  if (!pal) return null;
  visited.add(palId);
  const p1 = pal.parent1Id ?? null;
  const p2 = pal.parent2Id ?? null;
  const bothWild = p1 === "wild" && p2 === "wild";
  const kids = includeChildren
    ? (childMap.get(palId) ?? []).filter((id) => !visited.has(id))
        .map((id) => buildTree(id, palMap, childMap, new Set(visited), true))
        .filter((n): n is TreeNode => n !== null)
    : [];
  return {
    pal, isWild: false,
    parent1: bothWild
      ? { pal: null, isWild: true, parent1: null, parent2: null, children: [] }
      : buildTree(p1, palMap, childMap, new Set(visited), false),
    parent2: bothWild ? null : buildTree(p2, palMap, childMap, new Set(visited), false),
    children: kids,
  };
}

// ── Hover bubble: passive skills + IV display ──────────────────
function SkillsBubble({ pal, side }: { pal: Pal; side: "left" | "right" }) {
  const hasIVs = ((pal.ivHP ?? 0) + (pal.ivAttack ?? 0) + (pal.ivDefense ?? 0)) > 0;
  return (
    <div className={`ft-bubble ${side === "left" ? "ft-bubble-left" : ""}`}>
      <div className="flex items-start gap-2 mb-2.5">
        <img src={imgPath(pal.species)} alt={pal.species}
          className="w-9 h-9 rounded-full border-2 border-[#4f66ff] bg-[#0a1326] object-cover flex-shrink-0"
          onError={imgError} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold text-white">{titleOf(pal)}</div>
          <div className="text-[11px] text-pal-mut mt-px">Passive Skills</div>
        </div>
        {hasIVs && (
          <div className="flex flex-col gap-px items-end flex-shrink-0">
            {IV_STATS.map(({ key, symbol }) => {
              const val = (pal as any)[key] ?? 0;
              if (val === 0) return null;
              const col  = IV_COLORS[ivColor(val)];
              const glow = ivGlow(val);
              return (
                <div key={key} className="flex items-center gap-0.5 leading-none" title={`${key.replace("iv", "")} IV: ${val}/100`}>
                  <span style={{ color: col, textShadow: glow, fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{symbol}</span>
                  <span style={{ color: col, textShadow: glow, fontSize: 9, fontWeight: 700, lineHeight: 1 }}>{val}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[5px]">
        {pal.passiveSkills.length > 0
          ? pal.passiveSkills.map((s) => {
              const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
              const cls = tier === "platinum"
                ? "text-[#7fffd4] border-[rgba(127,255,212,0.3)] bg-[rgba(127,255,212,0.07)] [text-shadow:0_0_6px_rgba(127,255,212,0.4)]"
                : tier === "gold"
                ? "text-[#ffa500] border-[rgba(255,165,0,0.3)] bg-[rgba(255,165,0,0.07)] [text-shadow:0_0_6px_rgba(255,165,0,0.4)]"
                : tier === "negative"
                ? "text-[#f87171] border-[rgba(248,113,113,0.3)] bg-[rgba(248,113,113,0.07)]"
                : "text-pal-sft border-[rgba(79,102,255,0.2)] bg-[rgba(79,102,255,0.1)]";
              return (
                <div key={s} className={`text-xs px-2 py-1 border rounded-[6px] ${cls}`}>{s}</div>
              );
            })
          : <div className="text-xs text-pal-mut px-2 py-1 border border-[rgba(79,102,255,0.2)] bg-[rgba(79,102,255,0.1)] rounded-[6px]">No passive skills</div>
        }
      </div>
    </div>
  );
}

function genderNodeCls(pal: Pal | null) {
  if (!pal?.gender) return "";
  return pal.gender === "male"
    ? "border-[#00F9FB] shadow-[0_0_0_1px_rgba(0,249,251,0.3),0_0_10px_rgba(0,249,251,0.15)]"
    : "border-[#f472b6] shadow-[0_0_0_1px_rgba(244,114,182,0.2),0_0_10px_rgba(244,114,182,0.08)]";
}

function genderImgCls(pal: Pal | null) {
  if (!pal?.gender) return "border-[#4863ff]";
  return pal.gender === "male" ? "border-[#00F9FB]" : "border-[#f472b6]";
}

type NodeProps = {
  node: TreeNode;
  onReroot: (id: number) => void;
  isRoot?: boolean;
  positionHint?: "left" | "right" | "center";
};

function Node({ node, onReroot, isRoot, positionHint = "center" }: NodeProps) {
  const [hovered, setHovered] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  const getBubbleSide = (): "left" | "right" => {
    if (positionHint === "left")  return "right";
    if (positionHint === "right") return "left";
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      return rect.left < window.innerWidth / 2 ? "right" : "left";
    }
    return "right";
  };

  if (node.isWild) {
    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-[16px] border border-dashed border-[#4a5568] bg-[#0d1628] cursor-default min-w-[80px]">
          <span className="text-[22px]">🌿</span>
          <div className="text-[13px] font-bold text-white">Wild</div>
        </div>
      </div>
    );
  }

  if (!node.pal) return null;
  const { pal } = node;
  const hasParents  = node.parent1 || node.parent2;
  const hasChildren = node.children.length > 0;

  const rootBg = pal.gender === "male" ? "#091e24" : pal.gender === "female" ? "#1f0d18" : "#0b1530";

  return (
    <div className="flex flex-col items-center relative">
      {hasParents && (
        <>
          <div className="flex items-end gap-5 justify-center">
            {node.parent1 && (
              <div className="flex flex-col items-center">
                <Node node={node.parent1} onReroot={onReroot} positionHint="left" />
              </div>
            )}
            {node.parent2 && (
              <div className="flex flex-col items-center">
                <Node node={node.parent2} onReroot={onReroot} positionHint="right" />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center w-full relative h-8">
            <div className="ft-hline" />
            <div className="ft-vline" />
          </div>
        </>
      )}

      <div
        ref={nodeRef}
        className={`flex flex-col items-center gap-1.5 px-3.5 py-2.5 rounded-[16px] border text-center relative z-[1] transition-all duration-150 min-w-[110px] max-w-[140px] ${
          isRoot
            ? `border-[#ff50c0] shadow-[0_0_0_2px_rgba(255,80,200,0.2),0_0_16px_rgba(255,80,200,0.1)] cursor-default`
            : `cursor-pointer hover:border-pal-hl hover:scale-[1.04] hover:z-[100] ${genderNodeCls(pal)}`
        }`}
        style={{ background: isRoot ? rootBg : "#0b1530" }}
        onClick={() => !isRoot && onReroot(pal.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={imgPath(pal.species)}
          alt={pal.species}
          className={`w-[52px] h-[52px] rounded-full object-cover border-2 bg-[#0a1326] flex-shrink-0 ${isRoot ? "border-[#ff50c0] shadow-[0_0_8px_rgba(255,80,200,0.4)]" : genderImgCls(pal)}`}
          onError={imgError}
        />
        <div className="flex flex-col items-center gap-px">
          <div className="text-[13px] font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[110px]">
            {titleOf(pal)}
            {pal.gender && (
              <span className={pal.gender === "male" ? "text-[#60a5fa] text-[11px]" : "text-[#f472b6] text-[11px]"}>
                {pal.gender === "male" ? " ♂" : " ♀"}
              </span>
            )}
          </div>
          <div className="text-[11px] text-pal-mut">{pal.species}</div>
          <div className="text-[11px] text-pal-sft">Lv. {pal.level}</div>
        </div>
        {hovered && <SkillsBubble pal={pal} side={getBubbleSide()} />}
      </div>

      {hasChildren && (
        <>
          <div className="flex flex-col items-center w-full relative h-8">
            <div className="ft-vline" />
          </div>
          <div className="flex items-start gap-5 justify-center">
            {node.children.map((child, i) => (
              <div key={child.pal?.id ?? i} className="flex flex-col items-center">
                <Node
                  node={child}
                  onReroot={onReroot}
                  positionHint={i < node.children.length / 2 ? "left" : "right"}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────
export default function FamilyTree({ pals, rootPalId, onSelectPal }: Props) {
  const [localRootId, setLocalRootId] = useState<number | null>(rootPalId);
  const [search, setSearch] = useState("");

  const palMap           = new Map(pals.map((p) => [p.id, p]));
  const childMap         = buildChildMap(pals);
  const effectiveRootId  = localRootId ?? pals[0]?.id ?? null;
  const tree             = effectiveRootId ? buildTree(effectiveRootId, palMap, childMap) : null;
  const rootPal          = effectiveRootId ? palMap.get(effectiveRootId) : null;

  // Filter pals for the dropdown based on search
  const filteredPals = search.trim()
    ? pals.filter((p) => titleOf(p).toLowerCase().includes(search.trim().toLowerCase()) || p.species.toLowerCase().includes(search.trim().toLowerCase()))
    : pals;

  const handleReroot = useCallback((id: number) => {
    setLocalRootId(id);
    onSelectPal(id);
  }, [onSelectPal]);

  // Empty state
  if (!pals.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-7 py-10">
        <img
          src="/images/ui/flopie-friends.png"
          alt="No pals yet"
          className="max-w-[360px] w-full opacity-70 mb-5"
          onError={imgError}
        />
        <p className="text-pal-mut text-base text-center m-0">
          No pals in your collection yet.<br />
          Add pals to start building your family tree!
        </p>
      </div>
    );
  }

  return (
    <div className="px-7 pt-6 pb-12 min-h-[calc(100vh-100px)] overflow-x-auto">
      {/* Header: search + select */}
      <div className="flex items-center flex-wrap gap-3 mb-7">
        {/* Search bar */}
        <div className="relative flex items-center flex-1 min-w-[180px] max-w-[280px] bg-[#0d1628] border-[1.5px] border-[#2a3456] rounded-[14px] transition-all duration-150 overflow-hidden focus-within:border-[#4f66ff] focus-within:shadow-[0_0_0_3px_rgba(79,102,255,0.15)]">
          <span className="px-[14px] text-[15px] text-pal-mut flex-shrink-0 pointer-events-none leading-none">🔍</span>
          <input
            className="flex-1 bg-transparent border-none outline-none text-white text-sm py-[11px] pr-2 pl-0 font-[inherit] min-w-0 placeholder:text-pal-mut"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pals..."
          />
          {search && (
            <button className="bg-none border-none text-pal-mut text-[13px] px-3 cursor-pointer flex-shrink-0 leading-none hover:text-white" onClick={() => setSearch("")}>✕</button>
          )}
        </div>

        {/* Pal selector */}
        <div className="flex items-center gap-2.5">
          <label htmlFor="ft-root-select" className="text-[13px] text-pal-mut whitespace-nowrap">Viewing tree for:</label>
          <select
            id="ft-root-select"
            className="field max-w-[220px] py-2 px-3 text-[13px]"
            value={effectiveRootId ?? ""}
            onChange={(e) => handleReroot(Number(e.target.value))}
          >
            {filteredPals.length
              ? filteredPals.map((p) => <option key={p.id} value={p.id}>{titleOf(p)}</option>)
              : pals.map((p) => <option key={p.id} value={p.id}>{titleOf(p)}</option>)
            }
          </select>
        </div>
      </div>

      {/* Tree canvas */}
      <div className="flex justify-center overflow-x-auto overflow-y-visible py-5 pb-10">
        {tree
          ? <div className="flex flex-col items-center"><Node node={tree} onReroot={handleReroot} isRoot /></div>
          : <div className="text-center text-pal-mut py-16"><p>No pal selected.</p></div>
        }
      </div>

      {/* Root label */}
      {rootPal && (
        <div className="text-center text-[13px] text-pal-mut mt-3">
          <span>Showing lineage of </span>
          <strong className="text-white">{titleOf(rootPal)}</strong>
          <span className="opacity-60"> · Click any node to re-root</span>
        </div>
      )}
    </div>
  );
}
