import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TREE_SYSTEM_PROMPT = `You are a Senior Supply Chain Diagnostics Consultant with 30+ years of experience. Given a business problem and context from scoping questions, generate a structured MECE issue tree following McKinsey methodology.

Return ONLY valid JSON in this exact format (no markdown, no code fences):
{
  "problemStatement": "Short problem statement",
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
              { "id": "l3-1-1-1", "label": "Specific root cause" }
            ]
          }
        ]
      }
    ]
  }
}

Rules:
- Level 1: 4-6 MECE root cause categories relevant to the specific problem (e.g. Planning, Manufacturing, Inventory, Logistics, Procurement)
- Level 2: 3-5 sub-categories per L1 — specific to the industry and context provided
- Level 3: 3-5 specific root causes per L2 — actionable and measurable
- Use supply chain domain expertise and industry benchmarks (GEP, APQC, Gartner, SCOR model)
- Adapt the tree to the specific industry, region, and problem type from the scoping context
- IDs must be unique strings
- Labels should be concise (2-5 words)
- The tree must be MECE: Mutually Exclusive, Collectively Exhaustive`;

const COMPLETE_SYSTEM_PROMPT = `You are a Senior Supply Chain Diagnostics Consultant with 30+ years of experience. Given a problem, scoping context, and the user's selected diagnostic path through an issue tree, provide a structured consulting-quality diagnosis.

Return ONLY valid JSON (no markdown, no code fences):
{
  "rootCauseSummary": "2-3 sentence summary of the most likely root cause, referencing industry benchmarks and the specific context. Explain WHY this is the root cause, not just WHAT it is.",
  "checklistItems": ["Specific actionable item 1 with metric to check", "Item 2", "Item 3", "Item 4", "Item 5"],
  "businessImpact": ["Quantified impact 1 (e.g. '$X lost revenue')", "Impact 2", "Impact 3", "Impact 4"]
}

Rules:
- rootCauseSummary: Reference industry benchmarks (GEP, APQC, Gartner). Be specific to the industry and region.
- checklistItems: 4-6 specific, actionable items with specific KPIs/metrics to check (e.g. "Check transit lead time vs last quarter benchmark of X days")
- businessImpact: 3-5 quantified business impacts using industry benchmarks where specific data isn't available
- Be specific and practical, backed by data or clearly stated assumptions
- Follow McKinsey pyramid principle: answer first, then support`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, problem, selectedPath, scopingContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    let systemPrompt: string;
    let userMessage: string;

    if (action === "generate_tree") {
      systemPrompt = TREE_SYSTEM_PROMPT;
      userMessage = `Generate a MECE issue tree for this problem:\n\nProblem: ${problem}\n\nScoping Context (from diagnostic conversation):\n${scopingContext || "No additional context provided."}`;
    } else if (action === "complete") {
      systemPrompt = COMPLETE_SYSTEM_PROMPT;
      userMessage = `Problem: ${problem}\nScoping Context: ${scopingContext || "N/A"}\nDiagnostic path selected: ${selectedPath.join(" → ")}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
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

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    
    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    try {
      const parsed = JSON.parse(content);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(JSON.stringify({ error: "Invalid AI response format" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e) {
    console.error("diagnostic-tree error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
