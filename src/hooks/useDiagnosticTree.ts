import { useState, useCallback } from "react";
import type { IssueNode } from "@/components/IssueTree";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-tree`;

export interface TreeDiagnosis {
  tree: IssueNode | null;
  problemStatement: string;
  selectedPath: string[];
  confidence: "Low" | "Medium" | "High";
  isComplete: boolean;
  rootCauseSummary?: string;
  checklistItems?: string[];
  businessImpact?: string[];
}

export function useDiagnosticTree() {
  const [diagnosis, setDiagnosis] = useState<TreeDiagnosis>({
    tree: null,
    problemStatement: "",
    selectedPath: [],
    confidence: "Low",
    isComplete: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "tree" | "probing" | "complete">("idle");

  const generateTree = useCallback(async (problem: string) => {
    setIsLoading(true);
    setPhase("tree");
    setDiagnosis((prev) => ({ ...prev, problemStatement: problem, selectedPath: [] }));

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "generate_tree", problem }),
      });

      if (!resp.ok) {
        console.error("Tree generation failed:", resp.status);
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setDiagnosis((prev) => ({
        ...prev,
        tree: data.tree,
        problemStatement: data.problemStatement || problem,
      }));
      setPhase("probing");
    } catch (e) {
      console.error("Tree generation error:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectNode = useCallback((path: string[]) => {
    const depth = path.length;
    const confidence: "Low" | "Medium" | "High" =
      depth <= 2 ? "Low" : depth === 3 ? "Medium" : "High";
    setDiagnosis((prev) => ({ ...prev, selectedPath: path, confidence }));
  }, []);

  const completeDiagnosis = useCallback(async () => {
    setIsLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "complete",
          problem: diagnosis.problemStatement,
          selectedPath: diagnosis.selectedPath,
        }),
      });

      if (!resp.ok) {
        console.error("Completion failed:", resp.status);
        setIsLoading(false);
        return;
      }

      const data = await resp.json();
      setDiagnosis((prev) => ({
        ...prev,
        isComplete: true,
        rootCauseSummary: data.rootCauseSummary,
        checklistItems: data.checklistItems,
        businessImpact: data.businessImpact,
      }));
      setPhase("complete");
    } catch (e) {
      console.error("Completion error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [diagnosis.problemStatement, diagnosis.selectedPath]);

  const reset = useCallback(() => {
    setDiagnosis({
      tree: null,
      problemStatement: "",
      selectedPath: [],
      confidence: "Low",
      isComplete: false,
    });
    setPhase("idle");
    setIsLoading(false);
  }, []);

  return { diagnosis, isLoading, phase, generateTree, selectNode, completeDiagnosis, reset };
}
