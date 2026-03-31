import { motion } from "framer-motion";

const problems = [
  {
    title: "Procurement Cost Reduction",
    description:
      "Identified 18% cost reduction opportunity across indirect spend categories through should-cost modeling and supplier consolidation.",
    tags: ["Should-Cost Analysis", "Supplier Consolidation", "Category Management"],
  },
  {
    title: "Inventory Optimization — FMCG",
    description:
      "Reduced safety stock levels by 22% while maintaining 97% service levels through statistical reorder point methodology.",
    tags: ["Safety Stock", "ABC-XYZ Analysis", "Working Capital"],
  },
  {
    title: "Logistics Network Redesign",
    description:
      "Optimized distribution network from 12 to 8 warehouses, reducing freight costs by $3.2M annually with improved OTIF performance.",
    tags: ["Network Design", "Freight Optimization", "OTIF"],
  },
  {
    title: "Manufacturing OEE Improvement",
    description:
      "Diagnosed root causes of 62% OEE across 3 production lines. Implemented targeted interventions to reach 78% within 6 months.",
    tags: ["OEE", "Root Cause Analysis", "Lean Manufacturing"],
  },
  {
    title: "Demand Forecasting & S&OP",
    description:
      "Built consensus forecasting process reducing MAPE from 38% to 19%, enabling better inventory positioning and reduced expediting.",
    tags: ["Forecast Accuracy", "S&OP", "MAPE Reduction"],
  },
  {
    title: "Supplier Performance Analytics",
    description:
      "Developed supplier scorecard system tracking quality, delivery, and cost metrics across 200+ suppliers for a manufacturing client.",
    tags: ["Supplier Scorecard", "KPI Dashboards", "Vendor Management"],
  },
];

export function ProblemsSection() {
  return (
    <section id="problems" className="section-container py-24">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-12"
      >
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Track Record
        </p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Real problems worked on
        </h2>
      </motion.div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-foreground/15"
          >
            <h3 className="mb-2 font-display text-base font-semibold text-foreground">
              {problem.title}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
              {problem.description}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {problem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
