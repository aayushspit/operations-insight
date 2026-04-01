import { useState, useCallback } from "react";
import type { IssueNode } from "@/components/IssueTree";

const TREE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-tree`;

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

  const generateTree = useCallback(async (problem: string, scopingContext: string) => {
    setIsLoading(true);
    setDiagnosis((prev) => ({ ...prev, problemStatement: problem, selectedPath: [] }));

    try {
      const resp = await fetch(TREE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action: "generate_tree", problem, scopingContext }),
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

  const completeDiagnosis = useCallback(async (scopingContext: string) => {
    setIsLoading(true);

    try {
      const resp = await fetch(TREE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          action: "complete",
          problem: diagnosis.problemStatement,
          selectedPath: diagnosis.selectedPath,
          scopingContext,
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
    setIsLoading(false);
  }, []);

  return { diagnosis, isLoading, generateTree, selectNode, completeDiagnosis, reset };
}
