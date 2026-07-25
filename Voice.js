Deno.serve(async (req) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS Headers (تاکہ آپ اسے کسی بھی فرنٹ اینڈ ویب سائٹ میں استعمال کر سکیں)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  // -------------------------------------------------------------
  // ROUTE: /api/tts (Real Female Neural Voice)
  // -------------------------------------------------------------
  if (path === "/api/tts") {
    let text = url.searchParams.get("text");
    let lang = url.searchParams.get("lang") || "ur"; // ur = Urdu, en = English, hi = Hindi

    // اگر POST ریکویسٹ بھیجی جائے
    if (req.method === "POST") {
      try {
        const body = await req.json();
        text = body.text || text;
        lang = body.lang || lang;
      } catch (_) {}
    }

    if (!text) {
      return new Response(
        JSON.stringify({
          status: "error",
          message: "Please provide 'text' parameter.",
          example: "/api/tts?text=سلام! آپ کیسی ہیں؟&lang=ur",
        }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // High-Quality Ultra-Real Female Voices
    let femaleVoice = "ur-PK-UzmaNeural"; // Default: Pakistan Urdu Female (عظمیٰ)

    if (lang === "en") {
      femaleVoice = "en-US-JennyNeural"; // US Natural Female (جینی)
    } else if (lang === "hi") {
      femaleVoice = "hi-IN-SwaraNeural"; // Hindi Female (سوپرا/سوئرا)
    }

    try {
      // Direct Stream from Microsoft Edge Neural Voice API
      const ttsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${femaleVoice}&text=${encodeURIComponent(text)}`;

      const response = await fetch(ttsUrl);

      if (!response.ok) {
        throw new Error("Failed to generate neural female voice.");
      }

      const audioBuffer = await response.arrayBuffer();

      // Return MP3 Audio
      return new Response(audioBuffer, {
        status: 200,
        headers: {
          ...headers,
          "Content-Type": "audio/mpeg",
          "Content-Disposition": `inline; filename="female_voice.mp3"`,
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ status: "error", message: err.message }),
        { status: 500, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }
  }

  // API Documentation Page
  return new Response(
    JSON.stringify({
      status: "online",
      engine: "MA LEGEND Real Female Neural Voice API",
      endpoint: "/api/tts",
      supported_languages: {
        ur: "Urdu (ur-PK-UzmaNeural)",
        en: "English (en-US-JennyNeural)",
        hi: "Hindi (hi-IN-SwaraNeural)"
      },
      examples: [
        "/api/tts?text=سلام! میں آپ کی کیا مدد کر سکتی ہوں؟&lang=ur",
        "/api/tts?text=Hey MA LEGEND, your custom female API is ready!&lang=en",
      ],
    }),
    { status: 200, headers: { ...headers, "Content-Type": "application/json" } }
  );
});
