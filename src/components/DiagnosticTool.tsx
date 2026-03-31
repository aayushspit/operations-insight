import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, FileDown } from "lucide-react";
import { IssueTree } from "./IssueTree";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { useDiagnosticTree } from "@/hooks/useDiagnosticTree";

export function DiagnosticTool() {
  const [input, setInput] = useState("");
  const { diagnosis, isLoading, phase, generateTree, selectNode, completeDiagnosis, reset } =
    useDiagnosticTree();

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    generateTree(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div id="diagnostic" className="section-container py-12">
      <div className="mx-auto max-w-6xl">
        {/* Input area - shown when idle */}
        {phase === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl"
          >
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe a supply chain or procurement problem you're facing..."
                rows={3}
                className="diagnostic-input pr-12 resize-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background transition-opacity disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                "Our procurement costs are 15% above industry benchmark. Where do we start?",
                "We're experiencing frequent stockouts despite holding excess inventory.",
                "Our OTIF rates have dropped to 72%. Help diagnose the root causes.",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                  }}
                  className="rounded border border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Loading state */}
        <AnimatePresence>
          {isLoading && phase === "tree" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 py-16"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
              <p className="text-xs font-light text-muted-foreground">
                Building issue tree...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tree + Panel layout */}
        {phase !== "idle" && diagnosis.tree && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Controls */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {["Scoping", "Hypothesis", "Probing", "Results"].map((label, i) => {
                  const phaseMap = ["tree", "tree", "probing", "complete"];
                  const currentIdx =
                    phase === "tree" ? 1 : phase === "probing" ? 2 : phase === "complete" ? 3 : 0;
                  const status = i < currentIdx ? "complete" : i === currentIdx ? "active" : "pending";
                  return (
                    <div key={label} className="flex items-center gap-1.5">
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          status === "complete"
                            ? "bg-[hsl(var(--phase-complete))]"
                            : status === "active"
                            ? "bg-foreground"
                            : "bg-border"
                        }`}
                      />
                      <span
                        className={`text-[10px] font-light ${
                          status === "active" ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                {diagnosis.selectedPath.length >= 3 && !diagnosis.isComplete && (
                  <button
                    onClick={completeDiagnosis}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-light text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                  >
                    Complete Diagnosis
                  </button>
                )}
                {diagnosis.isComplete && (
                  <button
                    onClick={() => {
                      // PDF export could be added here
                    }}
                    className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <FileDown className="h-3 w-3" />
                    Export
                  </button>
                )}
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>

            {/* Main content: Tree + Panel */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
              <div className="overflow-x-auto rounded border border-border bg-card/30 p-4">
                <IssueTree tree={diagnosis.tree} onNodeSelect={selectNode} />
              </div>
              <div className="hidden lg:block">
                <DiagnosisPanel
                  problemStatement={diagnosis.problemStatement}
                  selectedPath={diagnosis.selectedPath}
                  confidence={diagnosis.confidence}
                  isComplete={diagnosis.isComplete}
                  rootCauseSummary={diagnosis.rootCauseSummary}
                  checklistItems={diagnosis.checklistItems}
                  businessImpact={diagnosis.businessImpact}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
