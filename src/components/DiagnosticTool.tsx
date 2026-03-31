import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw, FileDown } from "lucide-react";
import { PhaseTracker } from "./PhaseTracker";
import { MessageBubble, TypingIndicator } from "./MessageBubble";
import { useDiagnostic } from "@/hooks/useDiagnostic";
import { generateDiagnosticPDF } from "@/lib/pdfExport";

export function DiagnosticTool() {
  const [input, setInput] = useState("");
  const { messages, isLoading, phases, sendMessage, reset } = useDiagnostic();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasRecommendations = phases[3].status === "active" || phases[3].status === "complete";

  return (
    <div id="diagnostic" className="section-container">
      <div className="mx-auto max-w-3xl">
        {messages.length > 0 && (
          <div className="mb-4 flex items-center justify-between">
            <PhaseTracker phases={phases} />
            <div className="flex items-center gap-2">
              {hasRecommendations && (
                <button
                  onClick={() => generateDiagnosticPDF(messages)}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <FileDown className="h-3 w-3" />
                  Export PDF
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <div className="mb-4 max-h-[60vh] space-y-4 overflow-y-auto rounded-lg border border-border bg-background p-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} index={i} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={chatEndRef} />
          </div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              messages.length === 0
                ? "Describe a supply chain or procurement problem you're facing..."
                : "Continue the diagnostic..."
            }
            rows={messages.length === 0 ? 3 : 2}
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
        </motion.form>

        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 grid gap-2 sm:grid-cols-3"
          >
            {[
              "Our procurement costs are 15% above industry benchmark. Where do we start?",
              "We're experiencing frequent stockouts despite holding excess inventory.",
              "Our OTIF rates have dropped to 72%. Help diagnose the root causes.",
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => {
                  setInput(prompt);
                  inputRef.current?.focus();
                }}
                className="rounded-lg border border-border bg-card p-3 text-left text-xs leading-relaxed text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
              >
                {prompt}
              </button>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
