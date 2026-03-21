import { useState, useCallback } from "react";
import type { Pal } from "../types";
import { imgPath, imgError, titleOf } from "../utils/helpers";

type Props = {
  pals: Pal[];
  rootPalId: number | null;
  onSelectPal: (id: number) => void;
};

type TreeNode = {
  pal: Pal | null; // null = wild
  isWild: boolean;
  parent1: TreeNode | null;
  parent2: TreeNode | null;
};

function buildTree(
  palId: number | "wild" | null,
  palMap: Map<number, Pal>,
  visited = new Set<number>()
): TreeNode | null {
  if (palId === null) return null;

  if (palId === "wild") {
    return { pal: null, isWild: true, parent1: null, parent2: null };
  }

  if (visited.has(palId)) return null;
  const pal = palMap.get(palId);
  if (!pal) return null;

  visited.add(palId);
  const p1 = pal.parent1Id ?? null;
  const p2 = pal.parent2Id ?? null;

  // if both parents are wild, show one shared wild node
  const bothWild = p1 === "wild" && p2 === "wild";

  return {
    pal,
    isWild: false,
    parent1: bothWild ? { pal: null, isWild: true, parent1: null, parent2: null } : buildTree(p1, palMap, new Set(visited)),
    parent2: bothWild ? null : buildTree(p2, palMap, new Set(visited)),
  };
}

function nodeGenderClass(pal: Pal | null): string {
  if (!pal) return "";
  if (pal.gender === "male") return "ft-node-male";
  if (pal.gender === "female") return "ft-node-female";
  return "";
}

type NodeProps = {
  node: TreeNode;
  onReroot: (id: number) => void;
  isRoot?: boolean;
};

function Node({ node, onReroot, isRoot }: NodeProps) {
  const hasParents = node.parent1 || node.parent2;

  if (node.isWild) {
    return (
      <div className="ft-col">
        <div className="ft-node ft-node-wild">
          <span className="ft-node-wild-icon">🌿</span>
          <div className="ft-node-info">
            <div className="ft-node-name">Wild</div>
          </div>
        </div>
      </div>
    );
  }

  if (!node.pal) return null;
  const { pal } = node;

  return (
    <div className="ft-col">
      {hasParents && (
        <div className="ft-parents-row">
          {node.parent1 && (
            <div className="ft-parent-slot">
              <Node node={node.parent1} onReroot={onReroot} />
            </div>
          )}
          {node.parent2 && (
            <div className="ft-parent-slot">
              <Node node={node.parent2} onReroot={onReroot} />
            </div>
          )}
        </div>
      )}

      {hasParents && (
        <div className="ft-connector">
          <div className="ft-connector-hline" />
          <div className="ft-connector-vline" />
        </div>
      )}

      <div
        className={`ft-node ${isRoot ? "ft-node-root" : ""} ${nodeGenderClass(pal)}`}
        onClick={() => !isRoot && onReroot(pal.id)}
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
      </div>
    </div>
  );
}

export default function FamilyTree({ pals, rootPalId, onSelectPal }: Props) {
  const [localRootId, setLocalRootId] = useState<number | null>(rootPalId);

  const palMap = new Map(pals.map((p) => [p.id, p]));
  const effectiveRootId = localRootId ?? pals[0]?.id ?? null;
  const tree = effectiveRootId ? buildTree(effectiveRootId, palMap) : null;
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
          <select
            id="ft-root-select"
            className="input ft-root-select"
            value={effectiveRootId ?? ""}
            onChange={(e) => handleReroot(Number(e.target.value))}
          >
            {pals.map((p) => (
              <option key={p.id} value={p.id}>{titleOf(p)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="ft-canvas">
        {tree ? (
          <div className="ft-tree-wrap">
            <Node node={tree} onReroot={handleReroot} isRoot />
          </div>
        ) : (
          <div className="ft-empty">
            <p>No pal selected. Choose one from the dropdown above.</p>
          </div>
        )}
      </div>

      {rootPal && (
        <div className="ft-root-label">
          <span>Showing lineage of </span>
          <strong>{titleOf(rootPal)}</strong>
          <span className="ft-root-hint"> · Click any ancestor to re-root the tree on them</span>
        </div>
      )}
    </div>
  );
}