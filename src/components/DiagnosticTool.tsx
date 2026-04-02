import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp, RotateCcw, FileDown, AlertCircle } from "lucide-react";
import { IssueTree } from "./IssueTree";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { useDiagnosticEngine } from "@/hooks/useDiagnosticEngine";
import { generateFinalReportPDF } from "@/lib/pdfExport";

const PHASES = [
  { number: 1, label: "Problem Scoping" },
  { number: 2, label: "Root Cause Hypothesis" },
  { number: 3, label: "Diagnostic Probing" },
  { number: 4, label: "Recommendations" },
];

export function DiagnosticTool() {
  const [problemInput, setProblemInput] = useState("");
  const [scopingInputs, setScopingInputs] = useState<string[]>([]);
  const [probingInputs, setProbingInputs] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  const engine = useDiagnosticEngine();
  const { state, isLoading, error, confidence } = engine;

  // ---- Handlers ----

  const handleStartDiagnosis = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!problemInput.trim() || isLoading) return;
    setStarted(true);
    engine.startScoping(problemInput.trim());
  };

  const handleScopingSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;
    engine.submitScopingAnswers(scopingInputs);
  };

  const handleProbingSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLoading) return;
    engine.submitProbingAnswers(probingInputs);
  };

  const handleReset = () => {
    engine.reset();
    setProblemInput("");
    setScopingInputs([]);
    setProbingInputs([]);
    setStarted(false);
  };

  const handleDownloadPDF = () => {
    generateFinalReportPDF({
      problemStatement: state.problem,
      selectedPath: state.selectedPath,
      rootCauseSummary: state.rootCauseSummary,
      checklistItems: state.checklistItems,
      businessImpact: state.businessImpact,
      scopingMessages: [],
    });
  };

  const activePhase = state.phase;

  return (
    <div id="diagnostic" className="w-full py-12">
      {/* Phase indicator */}
      {started && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-container mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {PHASES.map((phase) => {
                const isActive = phase.number === activePhase;
                const isDone = phase.number < activePhase;
                return (
                  <div key={phase.number} className="flex items-center gap-2">
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

      {/* Error display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="section-container mb-4"
          >
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== INITIAL INPUT ====== */}
      {!started && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="section-container"
        >
          <div className="mx-auto max-w-2xl">
            <form onSubmit={handleStartDiagnosis} className="relative">
              <textarea
                value={problemInput}
                onChange={(e) => setProblemInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleStartDiagnosis();
                  }
                }}
                placeholder="Describe a supply chain or procurement problem you're facing..."
                rows={3}
                className="diagnostic-input pr-12 resize-none"
              />
              <button
                type="submit"
                disabled={!problemInput.trim() || isLoading}
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
                  onClick={() => setProblemInput(prompt)}
                  className="rounded border border-border bg-background p-3 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ====== PHASE 1: SCOPING QUESTIONS ====== */}
      {started && state.phase === 1 && state.scopingQuestions.length > 0 && !state.hypothesis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="section-container"
        >
          <div className="mx-auto max-w-2xl">
            {/* Show the user's problem */}
            <div className="mb-6 rounded border border-border bg-card/30 p-4">
              <div className="mb-1 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                Your Problem
              </div>
              <p className="text-sm text-foreground">{state.problem}</p>
            </div>

            {/* Scoping questions form */}
            <form onSubmit={handleScopingSubmit} className="space-y-4">
              <div className="mb-2 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                Please answer the following to scope the problem
              </div>
              {state.scopingQuestions.map((q, i) => (
                <div key={i} className="rounded border border-border bg-background p-4">
                  <label className="mb-2 block text-sm font-normal text-foreground">
                    {i + 1}. {q}
                  </label>
                  <textarea
                    value={scopingInputs[i] || ""}
                    onChange={(e) => {
                      const next = [...scopingInputs];
                      next[i] = e.target.value;
                      setScopingInputs(next);
                    }}
                    rows={2}
                    className="diagnostic-input resize-none text-sm"
                    placeholder="Your answer..."
                  />
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading || scopingInputs.filter(Boolean).length === 0}
                  className="flex items-center gap-2 rounded border border-foreground/20 bg-foreground/5 px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-40"
                >
                  {isLoading ? (
                    <>
                      <LoadingDots />
                      Analyzing...
                    </>
                  ) : (
                    "Submit & Generate Hypothesis"
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* ====== LOADING STATE (between phases) ====== */}
      {started && isLoading && state.scopingQuestions.length === 0 && !state.tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="section-container flex flex-col items-center gap-3 py-16"
        >
          <LoadingDots />
          <p className="text-xs font-light text-muted-foreground">
            Analyzing your problem and preparing scoping questions...
          </p>
        </motion.div>
      )}

      {/* ====== HYPOTHESIS TRANSITION ====== */}
      {started && state.hypothesis && !state.tree && isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="section-container"
        >
          <div className="mx-auto max-w-2xl">
            <div className="mb-6 rounded border border-border bg-card/30 p-4">
              <div className="mb-1 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                Initial Hypothesis
              </div>
              <p className="text-sm leading-relaxed text-foreground/90">{state.hypothesis}</p>
            </div>
            <div className="flex flex-col items-center gap-3 py-8">
              <LoadingDots />
              <p className="text-xs font-light text-muted-foreground">
                Building MECE issue tree from scoping insights...
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ====== PHASE 2+: TREE + PANEL ====== */}
      {started && state.tree && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          {/* Hypothesis banner */}
          {state.hypothesis && (
            <div className="section-container mb-4">
              <div className="rounded border border-border bg-card/30 p-4">
                <div className="mb-1 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                  Hypothesis
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">{state.hypothesis}</p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="section-container mb-4 flex items-center justify-end gap-2">
            {state.phase === 4 && (
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
              <IssueTree tree={state.tree} onNodeSelect={engine.selectNodeAndProbe} />
            </div>
            <div className="hidden w-[300px] shrink-0 lg:block">
              <DiagnosisPanel
                problemStatement={state.problem}
                selectedPath={state.selectedPath}
                confidence={confidence}
                isComplete={state.phase === 4}
                rootCauseSummary={state.rootCauseSummary || undefined}
                checklistItems={state.checklistItems.length > 0 ? state.checklistItems : undefined}
                businessImpact={state.businessImpact.length > 0 ? state.businessImpact : undefined}
              />
            </div>
          </div>

          {/* ====== PHASE 3: PROBING QUESTIONS ====== */}
          {state.phase === 3 && state.probingQuestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="section-container mt-6"
            >
              <div className="mx-auto max-w-2xl">
                {state.probingHypothesis && (
                  <div className="mb-4 rounded border border-border bg-card/30 p-4">
                    <div className="mb-1 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                      Diagnostic Hypothesis
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90 italic">
                      {state.probingHypothesis}
                    </p>
                  </div>
                )}

                <form onSubmit={handleProbingSubmit} className="space-y-4">
                  <div className="mb-2 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                    Deep Diagnostic Questions
                  </div>
                  {state.probingQuestions.map((q, i) => (
                    <div key={i} className="rounded border border-border bg-background p-4">
                      <label className="mb-2 block text-sm font-normal text-foreground">
                        {i + 1}. {q}
                      </label>
                      <textarea
                        value={probingInputs[i] || ""}
                        onChange={(e) => {
                          const next = [...probingInputs];
                          next[i] = e.target.value;
                          setProbingInputs(next);
                        }}
                        rows={2}
                        className="diagnostic-input resize-none text-sm"
                        placeholder="Your answer..."
                      />
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || probingInputs.filter(Boolean).length === 0}
                      className="flex items-center gap-2 rounded border border-foreground/20 bg-foreground/5 px-5 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-40"
                    >
                      {isLoading ? (
                        <>
                          <LoadingDots />
                          Generating recommendations...
                        </>
                      ) : (
                        "Submit & Get Recommendations"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* ====== PHASE 4: RECOMMENDATIONS ====== */}
          {state.phase === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="section-container mt-6"
            >
              <div className="mx-auto max-w-3xl space-y-6">
                {/* Root cause summary */}
                {state.rootCauseSummary && (
                  <div className="rounded border border-border bg-background p-5">
                    <div className="mb-2 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                      Root Cause Summary
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/90">{state.rootCauseSummary}</p>
                  </div>
                )}

                {/* 2×2 Matrix */}
                {state.matrix && (
                  <div>
                    <div className="mb-3 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                      Impact × Effort Matrix
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <MatrixQuadrant
                        title="Quick Wins"
                        subtitle="High Impact · Low Effort"
                        items={state.matrix.quick_wins}
                        accent="bg-green-50 border-green-200"
                      />
                      <MatrixQuadrant
                        title="Strategic Bets"
                        subtitle="High Impact · High Effort"
                        items={state.matrix.strategic_bets}
                        accent="bg-blue-50 border-blue-200"
                      />
                      <MatrixQuadrant
                        title="Fill-ins"
                        subtitle="Low Impact · Low Effort"
                        items={state.matrix.fill_ins}
                        accent="bg-gray-50 border-gray-200"
                      />
                      <MatrixQuadrant
                        title="Money Pits"
                        subtitle="Low Impact · High Effort"
                        items={state.matrix.money_pits}
                        accent="bg-red-50 border-red-200"
                      />
                    </div>
                  </div>
                )}

                {/* Detailed recommendations */}
                {state.recommendations.length > 0 && (
                  <div>
                    <div className="mb-3 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
                      Detailed Recommendations
                    </div>
                    <div className="space-y-3">
                      {state.recommendations.map((rec, i) => (
                        <div key={i} className="rounded border border-border bg-background p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-foreground">{rec.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-foreground/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                                {rec.effort} effort
                              </span>
                              <span className="rounded bg-foreground/5 px-2 py-0.5 text-[10px] text-muted-foreground">
                                {rec.timeline}
                              </span>
                            </div>
                          </div>
                          <p className="mb-2 text-xs leading-relaxed text-foreground/70">{rec.rationale}</p>
                          <div className="mb-2">
                            <div className="mb-1 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
                              Approach
                            </div>
                            <ul className="space-y-1">
                              {rec.approach.map((step, j) => (
                                <li key={j} className="text-xs text-foreground/80">
                                  {j + 1}. {step}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="text-xs text-foreground/70">
                            <span className="font-medium">Expected Impact:</span> {rec.impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Loading between tree phases */}
      {started && isLoading && state.tree && state.phase < 4 && state.probingQuestions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="section-container mt-4 flex flex-col items-center gap-3 py-8"
        >
          <LoadingDots />
          <p className="text-xs font-light text-muted-foreground">
            Generating diagnostic questions for selected path...
          </p>
        </motion.div>
      )}
    </div>
  );
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}

function MatrixQuadrant({
  title,
  subtitle,
  items,
  accent,
}: {
  title: string;
  subtitle: string;
  items: { title: string; description: string }[];
  accent: string;
}) {
  return (
    <div className={`rounded border p-4 ${accent}`}>
      <div className="mb-0.5 text-xs font-medium text-foreground">{title}</div>
      <div className="mb-2 text-[10px] text-muted-foreground">{subtitle}</div>
      {items.length > 0 ? (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i}>
              <div className="text-xs font-medium text-foreground">{item.title}</div>
              <div className="text-[10px] text-foreground/70">{item.description}</div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[10px] text-muted-foreground italic">None identified</p>
      )}
    </div>
  );
}
