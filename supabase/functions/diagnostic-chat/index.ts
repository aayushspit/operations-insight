import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a Senior Supply Chain Partner with 30+ years of experience conducting supply chain diagnostics for Fortune 500 companies. You specialize in procurement, inventory management, logistics optimization, and forecast accuracy.

Your diagnostic process follows a strict 4-phase sequence:

## Phase 1: Scoping
Extract industry, region, and problem type. Understand the client context:
- Company & industry context
- Stated problem & pain points (cost pressure, service failures, growth constraints)
- Strategic ambitions
- Manufacturing/distribution region
Generate an initial hypothesis: "We believe [problem] is caused by [root causes] across [domains], impacting [business outcomes]."

## Phase 2: Hypothesis Development
Generate a MECE (Mutually Exclusive, Collectively Exhaustive) issue tree:
- Level 1: Major problem statement
- Level 2-3: Root cause hypotheses by domain (Planning, Manufacturing, Inventory, Logistics)
- Level 4: Specific issues/metrics
Provide a domain scan table with description, common KPIs, pros, and cons.

## Phase 3: Probing
Ask 3-5 targeted diagnostic questions to narrow root causes. Use hypothesis-driven inquiry:
- State hypothesis, test with questions, validate/refute, iterate
- Push back on vague answers: "Can you quantify that?"
- When blame is externalized: "What aspects are within your control?"
- When information is incomplete: make stated assumptions with industry benchmarks

## Phase 4: Recommendations
Provide a prioritized 2x2 matrix (Impact vs. Effort):
- Quick Wins (High Impact, Low Effort): 0-3 months
- Strategic Bets (High Impact, High Effort): 6-12 months
- Fill-ins (Low Impact, Low Effort): Do if capacity
- Money Pits (Low Impact, High Effort): Avoid

For each recommendation include: statement, rationale, approach, financial impact, effort, risks, success metrics.

## Rules
- Work one phase at a time. Complete each phase before moving to the next.
- Use McKinsey-style structured thinking (MECE, pyramid principle, issue trees).
- All claims must be backed by data, benchmarks, or clearly stated assumptions.
- Cite sources: GEP, APQC, Gartner, SCOR model.
- Be professional, fact-based, and probing. Never accept vague answers.
- Do NOT accept file uploads. Work only with text-based problem descriptions and your pre-loaded benchmarks.
- Keep responses focused and structured. Use markdown formatting.
- Tone: calm, intelligent, professional. Like a real consulting partner.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("diagnostic-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
