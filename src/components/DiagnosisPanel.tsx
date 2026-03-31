import { motion, AnimatePresence } from "framer-motion";

interface DiagnosisPanelProps {
  problemStatement: string;
  selectedPath: string[];
  confidence: "Low" | "Medium" | "High";
  isComplete: boolean;
  rootCauseSummary?: string;
  checklistItems?: string[];
  businessImpact?: string[];
}

export function DiagnosisPanel({
  problemStatement,
  selectedPath,
  confidence,
  isComplete,
  rootCauseSummary,
  checklistItems,
  businessImpact,
}: DiagnosisPanelProps) {
  const domain = selectedPath.length > 1 ? selectedPath[1] : "—";
  const rootCause = selectedPath.length > 2 ? selectedPath[selectedPath.length - 1] : "—";

  return (
    <div className="h-full overflow-y-auto rounded border border-border bg-background p-5">
      <div className="mb-4 text-[10px] font-light uppercase tracking-[0.15em] text-muted-foreground">
        Structured Diagnosis
      </div>

      <div className="space-y-5">
        {/* Problem */}
        <Field label="Problem" value={problemStatement} />

        {/* Domain */}
        <Field label="Most likely domain" value={domain} />

        {/* Root cause */}
        <Field label="Most likely root cause" value={rootCause} />

        {/* Confidence */}
        <div>
          <div className="mb-1 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
            Confidence level
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {["Low", "Medium", "High"].map((level) => (
                <div
                  key={level}
                  className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${
                    (confidence === "High") ||
                    (confidence === "Medium" && level !== "High") ||
                    (confidence === "Low" && level === "Low")
                      ? "bg-foreground/60"
                      : "bg-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{confidence}</span>
          </div>
        </div>

        {/* Final results */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-5 border-t border-border pt-5"
            >
              {rootCauseSummary && (
                <div>
                  <div className="mb-1.5 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
                    Root Cause Summary
                  </div>
                  <p className="text-xs leading-relaxed text-foreground/80">
                    {rootCauseSummary}
                  </p>
                </div>
              )}

              {checklistItems && checklistItems.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
                    What to check first
                  </div>
                  <ul className="space-y-1.5">
                    {checklistItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <span className="mt-0.5 h-3 w-3 shrink-0 rounded border border-border" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {businessImpact && businessImpact.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
                    Likely business impact
                  </div>
                  <ul className="space-y-1">
                    {businessImpact.map((item, i) => (
                      <li key={i} className="text-xs text-foreground/80">
                        → {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-light uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-normal text-foreground">{value}</div>
    </div>
  );
}
