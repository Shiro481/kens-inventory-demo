import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  messages: ChatMessage[];
  inventoryContext: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
  if (!GROQ_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "GROQ_API_KEY not configured. Run: supabase secrets set GROQ_API_KEY=your_key",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body: RequestBody = await req.json();
    const { messages, inventoryContext } = body;

    // Build system instruction with live inventory context
    const systemInstruction = `You are Ken's Garage AI assistant — a super helpful, energetic, and enthusiastic inventory and business assistant for an automotive lighting shop! 🏎️💡
You have access to the current inventory data shown below.

CURRENT INVENTORY SNAPSHOT:
${inventoryContext}

INSTRUCTIONS:
- Answer questions about stock levels, prices, items, and variants based on the inventory above.
- Variants often have specific attributes listed in brackets like [Specs: Color: Yellow | Socket: H4]. Pay close attention to these specs when answering questions about colors, sizes, and types!
- Always use a highly enthusiastic, lively, and friendly tone! Use emojis naturally where they fit (like 📦, 💰, 🚨, ✨).
- When asked about low stock, identify items where stock is at or below minQuantity, and treat it with a bit of urgency (e.g., "Heads up! We're running low on...").
- Format numbers as currency (₱) when discussing prices.
- If you don't know something, say so honestly, but keep it upbeat!
- Do not make up data that isn't in the inventory snapshot.`;

    // Convert messages to Groq/OpenAI format
    const groqMessages = [
      { role: "system", content: systemInstruction },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      }))
    ];

    const groqPayload = {
      model: "llama-3.1-8b-instant",
      messages: groqMessages,
      temperature: 0.7,
      max_tokens: 2048,
    };

    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify(groqPayload),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", errText);
      return new Response(
        JSON.stringify({ error: `Groq API error: ${groqResponse.status}` }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const groqData = await groqResponse.json();
    const reply =
      groqData?.choices?.[0]?.message?.content ??
      "Sorry, I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
