import { motion } from "framer-motion";
import type { DiagnosticPhase } from "@/hooks/useDiagnostic";
import { Check } from "lucide-react";

interface PhaseTrackerProps {
  phases: DiagnosticPhase[];
}

export function PhaseTracker({ phases }: PhaseTrackerProps) {
  return (
    <div className="flex items-center gap-1 py-4">
      {phases.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-1">
          <div className="flex items-center gap-2">
            <motion.div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                phase.status === "complete"
                  ? "bg-phase-complete/10 text-phase-complete"
                  : phase.status === "active"
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
              animate={phase.status === "active" ? { scale: [1, 1.05, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {phase.status === "complete" ? <Check className="h-3 w-3" /> : phase.id}
            </motion.div>
            <span
              className={`hidden text-xs font-medium sm:block ${
                phase.status === "active"
                  ? "text-foreground"
                  : phase.status === "complete"
                  ? "text-phase-complete"
                  : "text-muted-foreground"
              }`}
            >
              {phase.label}
            </span>
          </div>
          {i < phases.length - 1 && (
            <div
              className={`mx-1 h-px w-8 transition-colors ${
                phase.status === "complete" ? "bg-phase-complete/40" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
