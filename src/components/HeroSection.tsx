import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="section-container flex min-h-[40vh] flex-col items-center justify-center py-20 text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        Supply Chain Diagnostics
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-4 max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl"
      >
        Diagnose operational problems like a consultant
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-10 max-w-lg text-base leading-relaxed text-muted-foreground"
      >
        An AI-powered diagnostic tool that applies structured consulting
        frameworks to procurement, inventory, and supply chain challenges.
      </motion.p>
      <motion.a
        href="#diagnostic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm font-medium text-foreground underline underline-offset-4 decoration-border hover:decoration-foreground transition-colors"
      >
        Try the diagnostic tool ↓
      </motion.a>
    </section>
  );
}
