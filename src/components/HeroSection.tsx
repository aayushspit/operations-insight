import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="section-container flex min-h-[30vh] flex-col items-center justify-center py-16 text-center">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-3 text-[10px] font-light uppercase tracking-[0.2em] text-muted-foreground"
      >
        Supply Chain Diagnostics
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-3 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl"
      >
        Diagnose operational problems with structured thinking
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="max-w-md text-sm font-light leading-relaxed text-muted-foreground"
      >
        An AI tool that builds MECE issue trees for procurement, inventory,
        and supply chain challenges.
      </motion.p>
    </section>
  );
}
