import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface IssueNode {
  id: string;
  label: string;
  children?: IssueNode[];
}

interface IssueTreeProps {
  tree: IssueNode;
  onNodeSelect: (path: string[]) => void;
}

export function IssueTree({ tree, onNodeSelect }: IssueTreeProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleNode = (nodeId: string, path: string[]) => {
    setSelectedId(nodeId);
    onNodeSelect(path);
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        for (const key of prev) {
          if (key.startsWith(nodeId)) next.delete(key);
        }
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  if (!tree.children?.length) return null;

  return (
    <div className="w-full py-6">
      {/* Root node */}
      <div className="flex flex-col items-center">
        <div className="mb-1 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
          Problem Statement
        </div>
        <div className="rounded border border-foreground/20 bg-background px-6 py-3 text-center text-sm font-medium tracking-tight text-foreground">
          {tree.label}
        </div>

        {/* Vertical connector */}
        <div className="h-6 w-px bg-border" />

        {/* Level 1 */}
        <div className="mb-2 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
          Level 1 · Root Cause Categories
        </div>

        {/* Level 1 nodes with horizontal connector */}
        <div className="relative mt-2 inline-flex flex-col items-center">
          {/* Horizontal line */}
          <div
            className="h-px bg-border"
            style={{
              width: `calc(100% - 140px)`,
              position: "absolute",
              top: 0,
              left: "70px",
              right: "70px",
            }}
          />
          <div className="flex gap-3">
            {tree.children.map((l1) => (
              <L1Branch
                key={l1.id}
                node={l1}
                expandedPaths={expandedPaths}
                selectedId={selectedId}
                onToggle={toggleNode}
                path={[tree.label, l1.label]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function L1Branch({
  node,
  expandedPaths,
  selectedId,
  onToggle,
  path,
}: {
  node: IssueNode;
  expandedPaths: Set<string>;
  selectedId: string | null;
  onToggle: (id: string, path: string[]) => void;
  path: string[];
}) {
  const isExpanded = expandedPaths.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div className="flex flex-col items-center">
      <div className="h-4 w-px bg-border" />
      <button
        onClick={() => onToggle(node.id, path)}
        className={`min-w-[130px] max-w-[160px] rounded border px-3 py-2.5 text-xs font-normal transition-all duration-200 ${
          isSelected
            ? "border-foreground/30 bg-foreground/5 text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
        }`}
      >
        {node.label}
      </button>

      <AnimatePresence>
        {isExpanded && node.children?.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-visible"
          >
            <div className="flex flex-col items-center">
              <div className="h-5 w-px bg-border" />
              <div className="mb-1 text-[9px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                Level 2 · Hypotheses
              </div>
              <div className="relative mt-1 inline-flex flex-col items-center">
                <div
                  className="h-px bg-border"
                  style={{
                    width: `calc(100% - 120px)`,
                    position: "absolute",
                    top: 0,
                    left: "60px",
                    right: "60px",
                  }}
                />
                <div className="flex gap-2">
                  {node.children.map((l2) => (
                    <L2Branch
                      key={l2.id}
                      node={l2}
                      expandedPaths={expandedPaths}
                      selectedId={selectedId}
                      onToggle={onToggle}
                      path={[...path, l2.label]}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function L2Branch({
  node,
  expandedPaths,
  selectedId,
  onToggle,
  path,
}: {
  node: IssueNode;
  expandedPaths: Set<string>;
  selectedId: string | null;
  onToggle: (id: string, path: string[]) => void;
  path: string[];
}) {
  const isExpanded = expandedPaths.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div className="flex flex-col items-center">
      <div className="h-3 w-px bg-border" />
      <button
        onClick={() => onToggle(node.id, path)}
        className={`min-w-[110px] max-w-[140px] rounded border px-2.5 py-2 text-[11px] font-normal transition-all duration-200 ${
          isSelected
            ? "border-foreground/30 bg-foreground/5 text-foreground"
            : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
        }`}
      >
        {node.label}
      </button>

      <AnimatePresence>
        {isExpanded && node.children?.length && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-visible"
          >
            <div className="flex flex-col items-center">
              <div className="h-4 w-px bg-border" />
              <div className="mb-1 text-[9px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                Level 3 · Root Causes
              </div>
              <div className="relative mt-1 inline-flex flex-col items-center">
                <div
                  className="h-px bg-border"
                  style={{
                    width: `calc(100% - 110px)`,
                    position: "absolute",
                    top: 0,
                    left: "55px",
                    right: "55px",
                  }}
                />
                <div className="flex gap-2">
                  {node.children.map((l3) => (
                    <div key={l3.id} className="flex flex-col items-center">
                      <div className="h-3 w-px bg-border" />
                      <button
                        onClick={() => onToggle(l3.id, [...path, l3.label])}
                        className={`min-w-[100px] max-w-[130px] rounded border px-2 py-1.5 text-[10px] font-normal transition-all duration-200 ${
                          selectedId === l3.id
                            ? "border-foreground/30 bg-foreground/5 text-foreground"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                        }`}
                      >
                        {l3.label}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
