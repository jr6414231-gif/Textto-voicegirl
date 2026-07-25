Deno.serve(async (req) => {
  const url = new URL(req.url);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      // Direct & Reliable Neural TTS Endpoint
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
        text
      )}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

      const audioResponse = await fetch(ttsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!audioResponse.ok) {
        throw new Error("Failed to fetch audio stream");
      }

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
        JSON.stringify({
          status: "error",
          message: "Voice generation failed.",
          details: error.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Text-to-Voice API is active!",
      usage: "/api/tts?text=سلام",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
