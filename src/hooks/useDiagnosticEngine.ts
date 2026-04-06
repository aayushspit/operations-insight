import { useState, useCallback } from "react";
import type { IssueNode } from "@/components/IssueTree";

const ENGINE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-engine`;

export type EnginePhase = 1 | 2 | 3 | 4;

export interface ScopingQA {
  questions: string[];
  answers: string[];
}

export interface Recommendation {
  title: string;
  rationale: string;
  approach: string[];
  impact: string;
  effort: string;
  timeline: string;
}

export interface MatrixItem {
  title: string;
  description: string;
}

export interface RecommendationMatrix {
  quick_wins: MatrixItem[];
  strategic_bets: MatrixItem[];
  fill_ins: MatrixItem[];
  money_pits: MatrixItem[];
}

export interface EngineState {
  phase: EnginePhase;
  problem: string;
  // Phase 1
  scopingQuestions: string[];
  scopingAnswers: string[];
  hypothesis: string;
  // Phase 2
  tree: IssueNode | null;
  // Phase 3
  selectedPath: string[];
  probingHypothesis: string;
  probingQuestions: string[];
  probingAnswers: string[];
  // Phase 4
  rootCauseSummary: string;
  checklistItems: string[];
  businessImpact: string[];
  recommendations: Recommendation[];
  matrix: RecommendationMatrix | null;
}

const initialState: EngineState = {
  phase: 1,
  problem: "",
  scopingQuestions: [],
  scopingAnswers: [],
  hypothesis: "",
  tree: null,
  selectedPath: [],
  probingHypothesis: "",
  probingQuestions: [],
  probingAnswers: [],
  rootCauseSummary: "",
  checklistItems: [],
  businessImpact: [],
  recommendations: [],
  matrix: null,
};

async function callEngine(body: Record<string, unknown>) {
  const resp = await fetch(ENGINE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export function useDiagnosticEngine() {
  const [state, setState] = useState<EngineState>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildScopingContext = useCallback(() => {
    const parts: string[] = [];
    state.scopingQuestions.forEach((q, i) => {
      parts.push(`Q: ${q}`);
      if (state.scopingAnswers[i]) {
        parts.push(`A: ${state.scopingAnswers[i]}`);
      }
    });
    return parts.join("\n");
  }, [state.scopingQuestions, state.scopingAnswers]);

  // Phase 1: Start scoping - ask initial questions
  const startScoping = useCallback(async (problem: string) => {
    setIsLoading(true);
    setError(null);
    setState((prev) => ({ ...prev, problem }));

    try {
      const data = await callEngine({ phase: "scoping", problem });
      setState((prev) => ({
        ...prev,
        phase: 1,
        problem,
        scopingQuestions: data.questions || [],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start scoping");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Phase 1: Submit scoping answers, then generate hypothesis + tree
  const submitScopingAnswers = useCallback(async (answers: string[]) => {
    setIsLoading(true);
    setError(null);
    setState((prev) => ({ ...prev, scopingAnswers: answers }));

    // Build context from Q&A
    const contextParts: string[] = [];
    state.scopingQuestions.forEach((q, i) => {
      contextParts.push(`Q: ${q}`);
      if (answers[i]) contextParts.push(`A: ${answers[i]}`);
    });
    const scopingContext = contextParts.join("\n");

    try {
      // Step 1: Generate hypothesis
      const hypData = await callEngine({
        phase: "hypothesis",
        problem: state.problem,
        scopingContext,
      });

      setState((prev) => ({
        ...prev,
        hypothesis: hypData.hypothesis || "",
        scopingAnswers: answers,
      }));

      // Brief delay to avoid rate limiting between sequential calls
      await new Promise(r => setTimeout(r, 2000));

      // Step 2: Auto-generate MECE tree (Phase 2)
      const treeData = await callEngine({
        phase: "tree",
        problem: state.problem,
        scopingContext,
      });

      setState((prev) => ({
        ...prev,
        phase: 2,
        tree: treeData.tree || null,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate analysis");
    } finally {
      setIsLoading(false);
    }
  }, [state.problem, state.scopingQuestions]);

  // Phase 3: User selects a path in the tree, trigger probing
  const selectNodeAndProbe = useCallback(async (path: string[]) => {
    setState((prev) => ({ ...prev, selectedPath: path }));

    // Only trigger probing when path is deep enough (>= 3 levels)
    if (path.length < 3) return;

    setIsLoading(true);
    setError(null);

    const contextParts: string[] = [];
    state.scopingQuestions.forEach((q, i) => {
      contextParts.push(`Q: ${q}`);
      if (state.scopingAnswers[i]) contextParts.push(`A: ${state.scopingAnswers[i]}`);
    });
    const scopingContext = contextParts.join("\n");

    try {
      const data = await callEngine({
        phase: "probing",
        problem: state.problem,
        scopingContext,
        selectedPath: path,
      });

      setState((prev) => ({
        ...prev,
        phase: 3,
        selectedPath: path,
        probingHypothesis: data.hypothesis_statement || "",
        probingQuestions: data.questions || [],
        probingAnswers: [],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate probing questions");
    } finally {
      setIsLoading(false);
    }
  }, [state.problem, state.scopingQuestions, state.scopingAnswers]);

  // Phase 4: Submit probing answers, get recommendations
  const submitProbingAnswers = useCallback(async (answers: string[]) => {
    setIsLoading(true);
    setError(null);
    setState((prev) => ({ ...prev, probingAnswers: answers }));

    const contextParts: string[] = [];
    state.scopingQuestions.forEach((q, i) => {
      contextParts.push(`Q: ${q}`);
      if (state.scopingAnswers[i]) contextParts.push(`A: ${state.scopingAnswers[i]}`);
    });
    const scopingContext = contextParts.join("\n");

    const probingParts: string[] = [];
    state.probingQuestions.forEach((q, i) => {
      probingParts.push(`Q: ${q}`);
      if (answers[i]) probingParts.push(`A: ${answers[i]}`);
    });
    const probingAnswersText = probingParts.join("\n");

    try {
      const data = await callEngine({
        phase: "recommendations",
        problem: state.problem,
        scopingContext,
        selectedPath: state.selectedPath,
        probingAnswers: probingAnswersText,
      });

      setState((prev) => ({
        ...prev,
        phase: 4,
        probingAnswers: answers,
        rootCauseSummary: data.rootCauseSummary || "",
        checklistItems: data.checklistItems || [],
        businessImpact: data.businessImpact || [],
        recommendations: data.recommendations || [],
        matrix: data.matrix || null,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  }, [state.problem, state.scopingQuestions, state.scopingAnswers, state.probingQuestions, state.selectedPath]);

  const reset = useCallback(() => {
    setState(initialState);
    setIsLoading(false);
    setError(null);
  }, []);

  const confidence = (() => {
    if (state.phase === 4) return "High" as const;
    if (state.selectedPath.length >= 3) return "Medium" as const;
    return "Low" as const;
  })();

  return {
    state,
    isLoading,
    error,
    confidence,
    startScoping,
    submitScopingAnswers,
    selectNodeAndProbe,
    submitProbingAnswers,
    reset,
  };
}
