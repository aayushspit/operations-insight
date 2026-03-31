import { useState, useRef, useCallback } from "react";

export interface DiagnosticMessage {
  role: "user" | "assistant";
  content: string;
}

export interface DiagnosticPhase {
  id: number;
  name: string;
  label: string;
  status: "pending" | "active" | "complete";
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-chat`;

export function useDiagnostic() {
  const [messages, setMessages] = useState<DiagnosticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [phases, setPhases] = useState<DiagnosticPhase[]>([
    { id: 1, name: "scoping", label: "Scoping", status: "pending" },
    { id: 2, name: "hypothesis", label: "Hypothesis", status: "pending" },
    { id: 3, name: "probing", label: "Probing", status: "pending" },
    { id: 4, name: "recommendations", label: "Recommendations", status: "pending" },
  ]);
  const abortRef = useRef<AbortController | null>(null);

  const updatePhaseFromContent = useCallback((allContent: string) => {
    const lower = allContent.toLowerCase();
    setPhases(prev => prev.map(p => {
      if (p.name === "scoping") {
        if (lower.includes("hypothesis") || lower.includes("issue tree")) return { ...p, status: "complete" };
        if (lower.includes("scope") || lower.includes("industry") || lower.includes("context")) return { ...p, status: "active" };
      }
      if (p.name === "hypothesis") {
        if (lower.includes("probing") || lower.includes("diagnostic question")) return { ...p, status: "complete" };
        if (lower.includes("hypothesis") || lower.includes("issue tree") || lower.includes("mece")) return { ...p, status: "active" };
      }
      if (p.name === "probing") {
        if (lower.includes("recommendation") || lower.includes("prioritization") || lower.includes("quick win")) return { ...p, status: "complete" };
        if (lower.includes("probing") || lower.includes("diagnostic question") || lower.includes("root cause")) return { ...p, status: "active" };
      }
      if (p.name === "recommendations") {
        if (lower.includes("recommendation") || lower.includes("prioritization") || lower.includes("quick win") || lower.includes("strategic")) return { ...p, status: "active" };
      }
      return p;
    }));
  }, []);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: DiagnosticMessage = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    if (phases[0].status === "pending") {
      setPhases(prev => prev.map((p, i) => i === 0 ? { ...p, status: "active" } : p));
    }

    abortRef.current = new AbortController();
    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok || !resp.body) {
        const errorText = await resp.text();
        console.error("Chat error:", resp.status, errorText);
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              const currentContent = assistantSoFar;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: currentContent } : m);
                }
                return [...prev, { role: "assistant", content: currentContent }];
              });
              updatePhaseFromContent(currentContent);
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [messages, phases, updatePhaseFromContent]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    setPhases(prev => prev.map(p => ({ ...p, status: "pending" as const })));
  }, []);

  return { messages, isLoading, phases, sendMessage, reset };
}
