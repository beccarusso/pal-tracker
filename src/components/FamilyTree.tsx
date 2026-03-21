import { useState, useCallback, useRef } from "react";
import type { Pal } from "../types";
import { imgPath, imgError, titleOf } from "../utils/helpers";
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
    parent1: bothWild ? { pal: null, isWild: true, parent1: null, parent2: null, children: [] } : buildTree(p1, palMap, childMap, new Set(visited), false),
    parent2: bothWild ? null : buildTree(p2, palMap, childMap, new Set(visited), false),
    children: kids,
  };
}

function buildChildMap(pals: Pal[]): Map<number, number[]> {
  const map = new Map<number, number[]>();
  pals.forEach((pal) => {
    [pal.parent1Id, pal.parent2Id].forEach((ref) => {
      if (typeof ref === "number") map.set(ref, [...(map.get(ref) ?? []), pal.id]);
    });
  });
  return map;
}

function SkillsBubble({ pal, side }: { pal: Pal; side: "left" | "right" }) {
  return (
    <div className={`ft-skills-bubble ft-skills-bubble-${side}`}>
      <div className="parent-preview-header">
        <img src={imgPath(pal.species)} alt={pal.species} className="parent-preview-img" onError={imgError} />
        <div>
          <div className="parent-preview-name">{titleOf(pal)}</div>
          <div className="parent-preview-sub">Passive Skills</div>
        </div>
      </div>
      <div className="parent-preview-skills">
        {pal.passiveSkills.length > 0
          ? pal.passiveSkills.map((s) => {
              const tier = passiveEntries.find((e) => e.name === s)?.tier ?? "normal";
              return <div key={s} className={`parent-preview-skill${tier !== "normal" ? ` tier-${tier}` : ""}`}>{s}</div>;
            })
          : <div className="parent-preview-skill" style={{ color: "var(--text-muted)" }}>No passive skills</div>
        }
      </div>
    </div>
  );
}

function genderNodeClass(pal: Pal | null) {
  if (!pal?.gender) return "";
  return pal.gender === "male" ? "ft-node-male" : "ft-node-female";
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

  // determine which side to show bubble: if node is on left half, show right; otherwise show left
  const getBubbleSide = (): "left" | "right" => {
    if (positionHint === "left") return "right";
    if (positionHint === "right") return "left";
    if (nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      return rect.left < window.innerWidth / 2 ? "right" : "left";
    }
    return "right";
  };

  if (node.isWild) {
    return (
      <div className="ft-col">
        <div className="ft-node ft-node-wild">
          <span className="ft-node-wild-icon">🌿</span>
          <div className="ft-node-info"><div className="ft-node-name">Wild</div></div>
        </div>
      </div>
    );
  }

  if (!node.pal) return null;
  const { pal } = node;
  const hasParents = node.parent1 || node.parent2;
  const hasChildren = node.children.length > 0;

  return (
    <div className="ft-col">
      {hasParents && (
        <>
          <div className="ft-parents-row">
            {node.parent1 && <div className="ft-parent-slot"><Node node={node.parent1} onReroot={onReroot} positionHint="left" /></div>}
            {node.parent2 && <div className="ft-parent-slot"><Node node={node.parent2} onReroot={onReroot} positionHint="right" /></div>}
          </div>
          <div className="ft-connector">
            <div className="ft-connector-hline" />
            <div className="ft-connector-vline" />
          </div>
        </>
      )}

      <div
        ref={nodeRef}
        className={`ft-node ${isRoot ? "ft-node-root" : ""} ${genderNodeClass(pal)}`}
        style={{ position: "relative" }}
        onClick={() => !isRoot && onReroot(pal.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={isRoot ? titleOf(pal) : `Re-root on ${titleOf(pal)}`}
      >
        <img src={imgPath(pal.species)} alt={pal.species} className="ft-node-img" onError={imgError} />
        <div className="ft-node-info">
          <div className="ft-node-name">
            {titleOf(pal)}
            {pal.gender && (
              <span className={pal.gender === "male" ? "ft-gender-male" : "ft-gender-female"}>
                {pal.gender === "male" ? " ♂" : " ♀"}
              </span>
            )}
          </div>
          <div className="ft-node-species">{pal.species}</div>
          <div className="ft-node-level">Lv. {pal.level}</div>
        </div>
        {hovered && <SkillsBubble pal={pal} side={getBubbleSide()} />}
      </div>

      {hasChildren && (
        <>
          <div className="ft-connector"><div className="ft-connector-vline" /></div>
          <div className="ft-children-row">
            {node.children.map((child, i) => (
              <div key={child.pal?.id ?? i} className="ft-parent-slot">
                <Node node={child} onReroot={onReroot} positionHint={i < node.children.length / 2 ? "left" : "right"} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FamilyTree({ pals, rootPalId, onSelectPal }: Props) {
  const [localRootId, setLocalRootId] = useState<number | null>(rootPalId);
  const palMap = new Map(pals.map((p) => [p.id, p]));
  const childMap = buildChildMap(pals);
  const effectiveRootId = localRootId ?? pals[0]?.id ?? null;
  const tree = effectiveRootId ? buildTree(effectiveRootId, palMap, childMap) : null;
  const rootPal = effectiveRootId ? palMap.get(effectiveRootId) : null;

  const handleReroot = useCallback((id: number) => {
    setLocalRootId(id);
    onSelectPal(id);
  }, [onSelectPal]);

  return (
    <div className="ft-page">
      <div className="ft-header">
        <div className="ft-header-right">
          <label htmlFor="ft-root-select" className="ft-select-label">Viewing tree for:</label>
          <select id="ft-root-select" className="input ft-root-select" value={effectiveRootId ?? ""}
            onChange={(e) => handleReroot(Number(e.target.value))}>
            {pals.map((p) => <option key={p.id} value={p.id}>{titleOf(p)}</option>)}
          </select>
        </div>
      </div>
      <div className="ft-canvas">
        {tree
          ? <div className="ft-tree-wrap"><Node node={tree} onReroot={handleReroot} isRoot /></div>
          : <div className="ft-empty"><p>No pal selected.</p></div>
        }
      </div>
      {rootPal && (
        <div className="ft-root-label">
          <span>Showing lineage of </span><strong>{titleOf(rootPal)}</strong>
          <span className="ft-root-hint"> · Click any node to re-root</span>
        </div>
      )}
    </div>
  );
}