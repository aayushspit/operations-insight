import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, FileDown } from "lucide-react";
import { IssueTree } from "./IssueTree";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { useDiagnostic } from "@/hooks/useDiagnostic";
import { useDiagnosticTree } from "@/hooks/useDiagnosticTree";
import { generateFinalReportPDF } from "@/lib/pdfExport";
import ReactMarkdown from "react-markdown";

const PHASES = [
  { key: "scoping", number: 1, label: "Problem Scoping" },
  { key: "hypothesis", number: 2, label: "Root Cause Hypothesis" },
  { key: "probing", number: 3, label: "Diagnostic Probing" },
  { key: "recommendations", number: 4, label: "Recommendations" },
];

type ToolPhase = "input" | "scoping" | "tree-building" | "tree" | "complete";

export function DiagnosticTool() {
  const [input, setInput] = useState("");
  const [toolPhase, setToolPhase] = useState<ToolPhase>("input");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chat = useDiagnostic();
  const tree = useDiagnosticTree();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages]);

  // When scoping completes, auto-generate the tree
  useEffect(() => {
    if (chat.scopingComplete && toolPhase === "scoping" && !tree.diagnosis.tree) {
      setToolPhase("tree-building");
      const problem = chat.messages.find((m) => m.role === "user")?.content || "";
      const scopingContext = chat.getScopingContext();
      tree.generateTree(problem, scopingContext);
    }
  }, [chat.scopingComplete, toolPhase, tree.diagnosis.tree]);

  // When tree is generated, move to tree phase
  useEffect(() => {
    if (tree.diagnosis.tree && toolPhase === "tree-building") {
      setToolPhase("tree");
    }
  }, [tree.diagnosis.tree, toolPhase]);

  // When diagnosis completes
  useEffect(() => {
    if (tree.diagnosis.isComplete) {
      setToolPhase("complete");
    }
  }, [tree.diagnosis.isComplete]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chat.isLoading) return;
    if (toolPhase === "input") {
      setToolPhase("scoping");
    }
    chat.sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleReset = () => {
    chat.reset();
    tree.reset();
    setToolPhase("input");
    setInput("");
  };

  const handleDownloadPDF = () => {
    generateFinalReportPDF({
      problemStatement: tree.diagnosis.problemStatement,
      selectedPath: tree.diagnosis.selectedPath,
      rootCauseSummary: tree.diagnosis.rootCauseSummary || "",
      checklistItems: tree.diagnosis.checklistItems || [],
      businessImpact: tree.diagnosis.businessImpact || [],
      scopingMessages: chat.messages,
    });
  };

  // Determine active phase number
  const activePhaseNumber =
    toolPhase === "input" ? 0
    : toolPhase === "scoping" ? 1
    : toolPhase === "tree-building" || toolPhase === "tree" ? 2
    : toolPhase === "complete" ? 4
    : 1;

  // Clean phase markers from displayed content
  const cleanContent = (content: string) =>
    content.replace(/PHASE_\d_COMPLETE/g, "").trim();

  return (
    <div id="diagnostic" className="w-full py-12">
      {/* Phase indicator */}
      {toolPhase !== "input" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-container mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {PHASES.map((phase) => {
                const isActive = phase.number === activePhaseNumber;
                const isDone = phase.number < activePhaseNumber;
                return (
                  <div key={phase.key} className="flex items-center gap-2">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium transition-all duration-300 ${
                        isDone
                          ? "bg-[hsl(var(--phase-complete))] text-white"
                          : isActive
                          ? "bg-foreground text-background"
                          : "bg-border text-muted-foreground"
                      }`}
                    >
                      {phase.number}
                    </div>
                    <span
                      className={`text-[11px] transition-all duration-300 ${
                        isActive
                          ? "font-medium text-foreground"
                          : isDone
                          ? "font-light text-foreground/60"
                          : "font-light text-muted-foreground/50"
                      }`}
                    >
                      {phase.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>
        </motion.div>
      )}

      {/* Input area */}
      {toolPhase === "input" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="section-container"
        >
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe a supply chain or procurement problem you're facing..."
                rows={3}
                className="diagnostic-input pr-12 resize-none"
                disabled={chat.isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || chat.isLoading}
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
                  onClick={() => setInput(prompt)}
                  className="rounded border border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Chat-based scoping phase */}
      {toolPhase === "scoping" && (
        <div className="section-container">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {chat.messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-foreground/5 text-foreground"
                        : "bg-background border border-border text-foreground/90"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none text-foreground/90 prose-headings:text-foreground prose-strong:text-foreground prose-li:text-foreground/90">
                        <ReactMarkdown>{cleanContent(msg.content)}</ReactMarkdown>
                      </div>
                    ) : (
                      cleanContent(msg.content)
                    )}
                  </div>
                </motion.div>
              ))}
              {chat.isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-lg border border-border bg-background px-4 py-3">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Answer the diagnostic questions..."
                rows={2}
                className="diagnostic-input pr-12 resize-none"
                disabled={chat.isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || chat.isLoading}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background transition-opacity disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tree building loading */}
      <AnimatePresence>
        {toolPhase === "tree-building" && tree.isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="section-container flex flex-col items-center gap-3 py-16"
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
              Building MECE issue tree from scoping insights...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tree + Panel layout */}
      {(toolPhase === "tree" || toolPhase === "complete") && tree.diagnosis.tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Controls */}
          <div className="section-container mb-4 flex items-center justify-end gap-2">
            {tree.diagnosis.selectedPath.length >= 3 && !tree.diagnosis.isComplete && (
              <button
                onClick={() => tree.completeDiagnosis(chat.getScopingContext())}
                disabled={tree.isLoading}
                className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-xs font-light text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              >
                Complete Diagnosis
              </button>
            )}
            {tree.diagnosis.isComplete && (
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 rounded border border-foreground/20 bg-foreground/5 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10"
              >
                <FileDown className="h-3.5 w-3.5" />
                Download Final Recommendation PDF
              </button>
            )}
          </div>

          {/* Main content: Tree + Panel */}
          <div className="flex gap-6 px-4 lg:px-8">
            <div className="min-w-0 flex-1 overflow-x-auto rounded border border-border bg-card/30 p-4">
              <IssueTree tree={tree.diagnosis.tree} onNodeSelect={tree.selectNode} />
            </div>
            <div className="hidden w-[300px] shrink-0 lg:block">
              <DiagnosisPanel
                problemStatement={tree.diagnosis.problemStatement}
                selectedPath={tree.diagnosis.selectedPath}
                confidence={tree.diagnosis.confidence}
                isComplete={tree.diagnosis.isComplete}
                rootCauseSummary={tree.diagnosis.rootCauseSummary}
                checklistItems={tree.diagnosis.checklistItems}
                businessImpact={tree.diagnosis.businessImpact}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
