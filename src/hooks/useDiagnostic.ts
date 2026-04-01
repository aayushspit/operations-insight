import { useState, useRef, useCallback } from "react";

export interface DiagnosticMessage {
  role: "user" | "assistant";
  content: string;
}

export type DiagnosticPhase = "scoping" | "hypothesis" | "probing" | "recommendations";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/diagnostic-chat`;

export function useDiagnostic() {
  const [messages, setMessages] = useState<DiagnosticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<DiagnosticPhase>("scoping");
  const [scopingComplete, setScopingComplete] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const detectPhase = useCallback((content: string) => {
    if (content.includes("PHASE_3_COMPLETE")) {
      setCurrentPhase("recommendations");
    } else if (content.includes("PHASE_2_COMPLETE")) {
      setCurrentPhase("probing");
    } else if (content.includes("PHASE_1_COMPLETE")) {
      setCurrentPhase("hypothesis");
      setScopingComplete(true);
    }
  }, []);

  const getScopingContext = useCallback(() => {
    return messages
      .map((m) => `${m.role === "user" ? "User" : "Consultant"}: ${m.content}`)
      .join("\n\n");
  }, [messages]);

  const sendMessage = useCallback(async (input: string) => {
    const userMsg: DiagnosticMessage = { role: "user", content: input };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

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
              detectPhase(currentContent);
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
  }, [messages, detectPhase]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setIsLoading(false);
    setCurrentPhase("scoping");
    setScopingComplete(false);
  }, []);

  return { messages, isLoading, currentPhase, scopingComplete, sendMessage, reset, getScopingContext };
}
