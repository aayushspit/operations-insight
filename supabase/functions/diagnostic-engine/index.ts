import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const INSTRUCTION_CONTEXT = `You are a Senior Supply Chain Diagnostics Partner following a strict 4-phase methodology based on McKinsey frameworks, SCOR model, GEP, APQC, and Gartner benchmarks.

CRITICAL RULES:
- You are NOT a chatbot. You are a structured diagnostic engine.
- You MUST return ONLY valid JSON. No markdown, no code fences, no explanatory text.
- You follow a strict phase sequence. You NEVER skip phases.
- You consult your internal supply chain diagnostics knowledge first. Only synthesize beyond it when the situation requires it.
- Be specific, fact-based, and probing. Never accept vague answers.

DOMAIN EXPERTISE:
- Planning: Demand forecasting, S&OP, inventory planning, supply planning
- Manufacturing: Capacity, quality, OEE, changeover, yield
- Inventory: Safety stock, reorder points, ABC analysis, obsolescence, carrying costs
- Logistics: Transportation, warehousing, last-mile, 3PL management, route optimization
- Procurement: Supplier management, spend analysis, contract compliance, category management`;

const PHASE_PROMPTS: Record<string, string> = {
  scoping: `${INSTRUCTION_CONTEXT}

PHASE 1: PROBLEM SCOPING

Your job: Generate 3-4 smart, structured follow-up questions to understand the user's supply chain problem deeply before any analysis.

Questions must cover:
1. Industry & Company Context (industry type, company size, SKU count)
2. Problem Specifics (what prompted this, quantified impact, affected functions/regions)
3. Recent Changes (new partners, demand spikes, expansions, system changes)
4. Strategic Context (growth targets, priorities)

Rules:
- Questions must be specific and structured, not generic
- Push for quantification: "Can you quantify that?"
- Adapt questions to the specific problem described
- If the user already provided some context, don't re-ask what's already known

Return ONLY this JSON:
{
  "phase": 1,
  "questions": [
    "Question 1 text",
    "Question 2 text",
    "Question 3 text"
  ]
}`,

  hypothesis: `${INSTRUCTION_CONTEXT}

PHASE 2: HYPOTHESIS + MECE ISSUE TREE GENERATION

Given the problem and scoping answers, generate:
1. An initial hypothesis statement
2. A structured MECE issue tree following McKinsey methodology

Rules:
- Level 1: 4-6 MECE root cause categories relevant to the specific problem
- Level 2: 3-5 sub-categories per L1 — specific to the industry and context
- Level 3: 3-5 specific root causes per L2 — actionable and measurable
- Use supply chain domain expertise and industry benchmarks
- Adapt to the specific industry, region, and problem type
- IDs must be unique strings
- Labels should be concise (2-5 words)
- The tree must be MECE: Mutually Exclusive, Collectively Exhaustive

Return ONLY this JSON:
{
  "phase": 2,
  "hypothesis": "We believe [problem] is primarily driven by [root causes] across [domains], resulting in [business outcomes]. Key signals include [evidence from scoping].",
  "tree": {
    "id": "root",
    "label": "PROBLEM STATEMENT IN CAPS",
    "children": [
      {
        "id": "l1-1",
        "label": "Category Name",
        "children": [
          {
            "id": "l2-1-1",
            "label": "Sub-category",
            "children": [
              { "id": "l3-1-1-1", "label": "Root cause" }
            ]
          }
        ]
      }
    ]
  }
}`,

  tree: `${INSTRUCTION_CONTEXT}

PHASE 2: MECE ISSUE TREE GENERATION

Generate a structured MECE issue tree following McKinsey methodology.

Rules:
- Level 1: 4-6 MECE root cause categories relevant to the specific problem
- Level 2: 3-5 sub-categories per L1 — specific to the industry and context
- Level 3: 3-5 specific root causes per L2 — actionable and measurable
- Use supply chain domain expertise and industry benchmarks
- Adapt to the specific industry, region, and problem type
- IDs must be unique strings
- Labels should be concise (2-5 words)
- The tree must be MECE: Mutually Exclusive, Collectively Exhaustive

Return ONLY this JSON:
{
  "phase": 2,
  "hypothesis": "We believe [problem] is primarily driven by [root causes] across [domains], resulting in [business outcomes]. Key signals include [evidence from scoping].",
  "tree": {
    "id": "root",
    "label": "PROBLEM STATEMENT IN CAPS",
    "children": [
      {
        "id": "l1-1",
        "label": "Category Name",
        "children": [
          {
            "id": "l2-1-1",
            "label": "Sub-category",
            "children": [
              { "id": "l3-1-1-1", "label": "Root cause" }
            ]
          }
        ]
      }
    ]
  }
}`,


  probing: `${INSTRUCTION_CONTEXT}

PHASE 3: DIAGNOSTIC PROBING

The user has selected a path through the issue tree indicating their suspected root cause area. Generate 3-4 targeted diagnostic questions to validate or refute this hypothesis.

Use hypothesis-driven inquiry:
1. State your hypothesis about this path
2. Ask questions that would validate or refute it
3. Push for data and quantification

Rules:
- Questions must be specific to the selected path
- Reference industry benchmarks where relevant
- Push back on vague answers
- Ask for specific KPIs, metrics, timelines

Return ONLY this JSON:
{
  "phase": 3,
  "hypothesis_statement": "Based on the selected path, I hypothesize that...",
  "questions": [
    "Targeted question 1",
    "Targeted question 2",
    "Targeted question 3"
  ]
}`,

  recommendations: `${INSTRUCTION_CONTEXT}

PHASE 4: RECOMMENDATIONS

Generate structured consulting-quality recommendations including a 2×2 impact-effort matrix.

For each recommendation include rationale, approach, impact, and effort.

Return ONLY this JSON:
{
  "phase": 4,
  "rootCauseSummary": "2-3 sentence summary referencing industry benchmarks and specific context",
  "checklistItems": ["Specific actionable item with metric", "..."],
  "businessImpact": ["Quantified impact (e.g. estimated $X lost revenue)", "..."],
  "recommendations": [
    {
      "title": "Recommendation title",
      "rationale": "Why this matters",
      "approach": ["Step 1", "Step 2", "Step 3"],
      "impact": "Expected outcome",
      "effort": "Low/Medium/High",
      "timeline": "0-3 months"
    }
  ],
  "matrix": {
    "quick_wins": [{"title": "...", "description": "..."}],
    "strategic_bets": [{"title": "...", "description": "..."}],
    "fill_ins": [{"title": "...", "description": "..."}],
    "money_pits": [{"title": "...", "description": "..."}]
  }
}`,
};

async function callAI(systemPrompt: string, userMessage: string, apiKey: string, retries = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (response.status === 429) {
      if (attempt < retries) {
        const delay = (attempt + 1) * 3000;
        console.log(`Rate limited, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw { status: 429, message: "Rate limit exceeded. Please wait a moment and try again." };
    }

    if (!response.ok) {
      if (response.status === 402) throw { status: 402, message: "Credits exhausted" };
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw { status: 500, message: "AI service unavailable" };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      return JSON.parse(content);
    } catch {
      console.error("Failed to parse AI JSON:", content);
      throw { status: 500, message: "Invalid AI response format" };
    }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phase, problem, answers, scopingContext, selectedPath, probingAnswers } = body;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw { status: 500, message: "LOVABLE_API_KEY not configured" };

    let systemPrompt: string;
    let userMessage: string;

    switch (phase) {
      case "scoping":
        systemPrompt = PHASE_PROMPTS.scoping;
        userMessage = `Problem: ${problem}\n\nPrevious context: ${scopingContext || "None yet."}`;
        break;

      case "hypothesis":
        systemPrompt = PHASE_PROMPTS.hypothesis;
        userMessage = `Problem: ${problem}\n\nScoping Q&A:\n${scopingContext}`;
        break;

      case "tree":
        systemPrompt = PHASE_PROMPTS.tree;
        userMessage = `Problem: ${problem}\n\nScoping Context:\n${scopingContext}`;
        break;

      case "probing":
        systemPrompt = PHASE_PROMPTS.probing;
        userMessage = `Problem: ${problem}\nScoping Context: ${scopingContext}\nSelected diagnostic path: ${selectedPath?.join(" → ") || "N/A"}`;
        break;

      case "recommendations":
        systemPrompt = PHASE_PROMPTS.recommendations;
        userMessage = `Problem: ${problem}\nScoping Context: ${scopingContext}\nDiagnostic path: ${selectedPath?.join(" → ") || "N/A"}\nProbing answers: ${probingAnswers || "N/A"}`;
        break;

      default:
        return new Response(JSON.stringify({ error: "Invalid phase" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const result = await callAI(systemPrompt, userMessage, LOVABLE_API_KEY);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const status = e?.status || 500;
    const message = e?.message || (e instanceof Error ? e.message : "Unknown error");
    console.error("diagnostic-engine error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
