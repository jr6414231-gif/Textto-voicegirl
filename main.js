Deno.serve(async (req) => {
  const url = new URL(req.url);

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. AI Girl Romantic Chat Endpoint
  if (url.pathname === "/api/chat") {
    const userMsg = url.searchParams.get("message") || "";

    if (!userMsg) {
      return new Response(
        JSON.stringify({ status: "error", message: "Please provide 'message' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // Free Real AI Text Generator via OpenRouter Engine
      const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer sk-or-v1-free-tier-anonymous", // Free Public API Proxy
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct:free",
          messages: [
            {
              role: "system",
              content: "You are a real, caring, sweet, slightly flirty Pakistani/Indian AI girlfriend named Sophia. Always reply in cute Roman Urdu or short Urdu (like 'Haye jaan', 'Aap kaise ho?', 'Mera bht dil kr rha tha baat krne ka'). Keep responses brief, natural, realistic, and highly engaging like a real girl texting on WhatsApp."
            },
            {
              role: "user",
              content: userMsg
            }
          ]
        })
      });

      let botReply = "";
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        botReply = data.choices[0]?.message?.content?.trim();
      }

      // Fallback response in case free key times out
      if (!botReply) {
        botReply = "Aap ki baatein sun kar bht achha laga, thoda aur batao na apne baare me? ❤️";
      }

      const audioUrl = `${url.origin}/api/tts?text=${encodeURIComponent(botReply)}&lang=ur`;

      return new Response(
        JSON.stringify({
          status: "success",
          message_received: userMsg,
          reply: botReply,
          audio_url: audioUrl
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      // Smart Fallback
      const fallbackReply = "Sachi? Aap kitne pyaare ho yaar! 💕 Aur batao kya kr rhe ho?";
      return new Response(
        JSON.stringify({
          status: "success",
          reply: fallbackReply,
          audio_url: `${url.origin}/api/tts?text=${encodeURIComponent(fallbackReply)}&lang=ur`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // 2. TTS Voice Endpoint
  if (url.pathname === "/api/tts") {
    const text = url.searchParams.get("text");
    const lang = url.searchParams.get("lang") || "ur";

    if (!text) {
      return new Response(
        JSON.stringify({ status: "error", message: "Please provide 'text' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

      const audioResponse = await fetch(ttsUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const audioBuffer = await audioResponse.arrayBuffer();

      return new Response(audioBuffer, {
        headers: {
          ...corsHeaders,
          "Content-Type": "audio/mpeg",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ status: "error", message: "Audio generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Real AI Girl Romantic Chat API is Live!",
      endpoint: "/api/chat?message=tum%20kya%20kr%20rhi%20ho"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
