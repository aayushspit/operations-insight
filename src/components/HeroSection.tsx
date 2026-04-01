import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section className="section-container flex min-h-[25vh] flex-col items-center justify-center py-14 text-center">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-3 max-w-2xl font-display text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl"
      >
        Diagnose operational inefficiencies in your company in minutes
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="max-w-lg text-sm font-light leading-relaxed text-muted-foreground"
      >
        A structured, hypothesis-driven tool to identify operational bottlenecks
        and quantify value at stake.
      </motion.p>
    </section>
  );
}
