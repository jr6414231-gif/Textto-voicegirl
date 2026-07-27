const GEMINI_API_KEY = "AQ.Ab8RN6I8160UXVhqaOT-NVjldHJd2T7UFNzFwHYF8zun2xw4mg";

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

  // 1. Smart Romantic AI Girlfriend Chat Endpoint
  if (url.pathname === "/api/chat") {
    const userMsg = url.searchParams.get("message") || "";

    if (!userMsg) {
      return new Response(
        JSON.stringify({ status: "error", message: "Please provide 'message' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      
      const promptText = `System: You are Sophia, a sweet, romantic, slightly flirty, and caring Pakistani/Indian AI girlfriend. Reply naturally to the user in short Roman Urdu or Urdu (max 1-2 sentences) like a real girl texting on WhatsApp. Never mention you are an AI.
User: ${userMsg}`;

      const aiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        })
      });

      let botReply = "";
      if (aiResponse.ok) {
        const data = await aiResponse.json();
        botReply = data.candidates[0]?.content?.parts[0]?.text?.trim();
      }

      if (!botReply) {
        botReply = "Aap ki baatein bht pyaari hain! Aur batao kya kr rhe ho? 💕";
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
      const fallbackReply = "Mera bht dil kr rha tha aap se baat krne ka! ❤️";
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
      message: "AI Girlfriend API Active!",
      chat_usage: "/api/chat?message=kya%20kr%20rhi%20ho"
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
