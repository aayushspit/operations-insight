import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface CaseStudy {
  title: string;
  description: string;
  tags: string[];
  detail: {
    context: string;
    problem: string;
    approach: string;
    result: string;
    impact: string[];
    keyLearning: string;
  };
}

const problems: CaseStudy[] = [
  {
    title: "Procurement Cost Reduction",
    description:
      "Identified 18% cost reduction opportunity across indirect spend categories through should-cost modeling and supplier consolidation.",
    tags: ["Should-Cost Analysis", "Supplier Consolidation", "Category Management"],
    detail: {
      context: "Mid-size manufacturing company with $120M annual indirect spend across 400+ suppliers, no centralized procurement function.",
      problem: "Procurement costs were 15-20% above industry benchmarks (APQC) with fragmented supplier base, no spend visibility, and maverick buying across business units.",
      approach: "Conducted should-cost modeling on top 20 categories. Built ABC supplier segmentation. Ran competitive RFQs on consolidated volumes. Implemented category management structure.",
      result: "Achieved 18% cost reduction ($21.6M annualized savings) within 9 months. Reduced supplier base from 400+ to 180 strategic suppliers.",
      impact: [
        "$21.6M annualized savings (18% reduction)",
        "Supplier base reduced by 55%",
        "Procurement cycle time reduced by 40%",
        "Maverick spend reduced from 35% to 8%",
      ],
      keyLearning: "Spend visibility is the foundation — without clean data, category strategies are guesswork. Quick wins from consolidation fund longer-term capability building.",
    },
  },
  {
    title: "Inventory Optimization — FMCG",
    description:
      "Reduced safety stock levels by 22% while maintaining 97% service levels through statistical reorder point methodology.",
    tags: ["Safety Stock", "ABC-XYZ Analysis", "Working Capital"],
    detail: {
      context: "Large FMCG company with 3,000+ SKUs across 8 distribution centers in India. $45M in inventory carrying costs annually.",
      problem: "Excess safety stock driven by blanket 'days of cover' policies (no demand variability consideration). Service levels inconsistent (85-99%) across SKUs.",
      approach: "Implemented ABC-XYZ classification. Built statistical safety stock model using demand variability and lead time variability. Differentiated service level targets by segment.",
      result: "Reduced safety stock by 22% while improving service levels to consistent 97% across all A-category SKUs.",
      impact: [
        "$9.9M working capital released",
        "Service level improved from avg 91% to 97%",
        "Obsolescence write-offs reduced by 30%",
        "Inventory turns improved from 6.2 to 8.1",
      ],
      keyLearning: "One-size-fits-all inventory policies destroy value. Statistical methods beat rules of thumb every time, but require clean demand data.",
    },
  },
  {
    title: "Logistics Network Redesign",
    description:
      "Optimized distribution network from 12 to 8 warehouses, reducing freight costs by $3.2M annually with improved OTIF performance.",
    tags: ["Network Design", "Freight Optimization", "OTIF"],
    detail: {
      context: "Consumer goods company with 12 warehouses serving pan-India distribution. Growing freight costs and declining OTIF (78%).",
      problem: "Network evolved organically over 15 years with no optimization. Overlapping catchment areas, suboptimal warehouse locations, and excessive cross-docking.",
      approach: "Built gravity model for optimal warehouse placement. Analyzed shipment data (2 years). Modeled scenarios for 6, 8, and 10 warehouse configurations. Phased migration plan.",
      result: "Consolidated to 8 warehouses. Freight costs reduced by $3.2M. OTIF improved from 78% to 91%.",
      impact: [
        "$3.2M annual freight savings",
        "OTIF improved from 78% to 91%",
        "Average delivery time reduced by 1.2 days",
        "Warehouse utilization improved from 62% to 85%",
      ],
      keyLearning: "Network redesign is high-effort but high-impact. The key is phased migration — don't try to change everything at once. Data-driven placement beats intuition.",
    },
  },
  {
    title: "Manufacturing OEE Improvement",
    description:
      "Diagnosed root causes of 62% OEE across 3 production lines. Implemented targeted interventions to reach 78% within 6 months.",
    tags: ["OEE", "Root Cause Analysis", "Lean Manufacturing"],
    detail: {
      context: "Automotive parts manufacturer with 3 production lines running at 62% OEE (industry benchmark: 85%). High changeover times and unplanned downtime.",
      problem: "OEE at 62% driven by: availability losses (unplanned breakdowns), performance losses (slow cycles), and quality losses (high scrap rates on Line 2).",
      approach: "Deployed OEE waterfall analysis per line. Implemented SMED for changeover reduction. Established TPM program. Root-caused Line 2 quality issues to tooling wear patterns.",
      result: "OEE improved from 62% to 78% in 6 months. Changeover time reduced by 45%. Scrap rate on Line 2 reduced from 8% to 2.5%.",
      impact: [
        "OEE improved from 62% to 78% (+16 pp)",
        "Changeover time reduced by 45%",
        "Scrap rate reduced from 8% to 2.5%",
        "Equivalent capacity gain of 0.5 additional production lines",
      ],
      keyLearning: "OEE improvement requires disaggregating losses by type (availability, performance, quality) and attacking the biggest contributor first.",
    },
  },
  {
    title: "Demand Forecasting & S&OP",
    description:
      "Built consensus forecasting process reducing MAPE from 38% to 19%, enabling better inventory positioning and reduced expediting.",
    tags: ["Forecast Accuracy", "S&OP", "MAPE Reduction"],
    detail: {
      context: "Pharma distribution company with 1,200 SKUs. No formal S&OP process. Sales and operations planning done in silos.",
      problem: "Forecast accuracy (MAPE) at 38% — nearly double the industry benchmark of 20%. Resulted in excess inventory for slow movers and stockouts for fast movers.",
      approach: "Implemented 3-tier forecasting: statistical baseline + commercial input + consensus review. Established monthly S&OP cadence. Built forecast accuracy dashboards by SKU segment.",
      result: "MAPE reduced from 38% to 19%. Stockouts reduced by 60%. Expediting costs reduced by $1.8M annually.",
      impact: [
        "MAPE reduced from 38% to 19%",
        "Stockouts reduced by 60%",
        "$1.8M reduction in expediting costs",
        "Inventory days reduced from 45 to 32",
      ],
      keyLearning: "Forecast accuracy improves most from process discipline (S&OP cadence, accountability) rather than better algorithms. Statistical baseline + human judgment beats either alone.",
    },
  },
  {
    title: "Supplier Performance Analytics",
    description:
      "Developed supplier scorecard system tracking quality, delivery, and cost metrics across 200+ suppliers for a manufacturing client.",
    tags: ["Supplier Scorecard", "KPI Dashboards", "Vendor Management"],
    detail: {
      context: "Industrial manufacturing company sourcing from 200+ suppliers across 3 countries. No systematic supplier performance tracking.",
      problem: "Supplier quality issues causing 12% incoming rejection rate. On-time delivery at 71%. No data-driven basis for supplier development or exit decisions.",
      approach: "Built weighted scorecard (Quality 40%, Delivery 30%, Cost 20%, Responsiveness 10%). Automated data collection from ERP. Quarterly business reviews with top 30 suppliers.",
      result: "Incoming rejection rate dropped from 12% to 4%. On-time delivery improved to 89%. Exited 15 chronic underperformers.",
      impact: [
        "Incoming rejection rate: 12% → 4%",
        "On-time delivery: 71% → 89%",
        "15 underperforming suppliers exited",
        "$2.1M quality cost savings",
      ],
      keyLearning: "What gets measured gets managed. The scorecard itself drives improvement because suppliers know they're being tracked. Quarterly reviews with data create accountability.",
    },
  },
];

export function ProblemsSection() {
  const [selectedCase, setSelectedCase] = useState<CaseStudy | null>(null);

  return (
    <>
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
          <p className="mt-2 text-sm text-muted-foreground">
            Click any card to explore the full case study.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, i) => (
            <motion.button
              key={problem.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedCase(problem)}
              className="group rounded-lg border border-border bg-card p-6 text-left transition-all hover:border-foreground/15 hover:shadow-sm"
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
              <div className="mt-4 text-[10px] uppercase tracking-widest text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                Click to explore →
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Case Study Modal */}
      <AnimatePresence>
        {selectedCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm p-4"
            onClick={() => setSelectedCase(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-border bg-background p-8 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedCase(null)}
                className="absolute right-4 top-4 rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                Case Study
              </div>
              <h3 className="mb-6 font-display text-2xl font-semibold tracking-tight text-foreground">
                {selectedCase.title}
              </h3>

              <div className="space-y-6">
                <CaseField label="Context" value={selectedCase.detail.context} />
                <CaseField label="Problem" value={selectedCase.detail.problem} />
                <CaseField label="What I Did" value={selectedCase.detail.approach} />
                <CaseField label="Result" value={selectedCase.detail.result} />

                <div>
                  <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
                    Impact
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {selectedCase.detail.impact.map((item, i) => (
                      <div
                        key={i}
                        className="rounded border border-border bg-muted/30 px-3 py-2 text-xs text-foreground"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <CaseField label="Key Learning" value={selectedCase.detail.keyLearning} />
              </div>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {selectedCase.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CaseField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </div>
      <p className="text-sm leading-relaxed text-foreground/85">{value}</p>
    </div>
  );
}
