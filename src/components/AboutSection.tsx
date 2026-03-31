import { motion } from "framer-motion";
import { FileText } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="section-container py-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl"
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          About
        </p>
        <h2 className="mb-8 font-display text-3xl font-semibold tracking-tight text-foreground">
          Background
        </h2>

        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Operations and supply chain professional with experience in
            procurement analytics, cost reduction, and inventory optimization
            across manufacturing and retail environments.
          </p>
          <p>
            Focused on applying structured problem-solving frameworks —
            hypothesis-driven diagnostics, MECE issue trees, and data-backed
            recommendations — to complex operational challenges.
          </p>
          <p>
            Built this diagnostic tool to demonstrate how consulting-style
            thinking can be embedded into an interactive, AI-powered experience.
          </p>
        </div>

        <div className="mt-8 flex items-center gap-4">
          <a
            href="/cv.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            View CV
          </a>
          <p className="text-xs text-muted-foreground">PDF • Updated 2025</p>
        </div>
      </motion.div>
    </section>
  );
}
