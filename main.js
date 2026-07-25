Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Cross-Origin Resource Sharing (CORS) headers تاکہ آپ اسے کسی بھی ویب سائٹ میں استعمال کر سکیں
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "*",
  };

  // OPTIONS درخواستوں کا جواب (Preflight requests)
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // صرف /api/tts کے لیے ریکویسٹ کو سنیں
  if (url.pathname === "/api/tts") {
    const text = url.searchParams.get("text");
    // بائی ڈیفالٹ فی میل وائس رکھی گئی ہے (اگر چاہیں تو سرچ پیرامیٹر سے وائس بھی بدل سکتے ہیں)
    const voice = url.searchParams.get("voice") || "ur-PK-UzmaNeural";

    if (!text) {
      return new Response(
        JSON.stringify({ status: "error", message: "Please provide 'text' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      // StreamElements API کا یو آر ایل
      const streamElementsUrl = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(
        voice
      )}&text=${encodeURIComponent(text)}`;

      // User-Agent ہیڈر کے ساتھ درخواست بھیجنا
      const audioResponse = await fetch(streamElementsUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!audioResponse.ok) {
        throw new Error(`StreamElements returned status: ${audioResponse.status}`);
      }

      // جنریٹڈ آڈیو واپس کسٹمر کو بھیجیں
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
          message: "Failed to generate neural female voice.",
          details: error.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // ہوم پیج یا کسی اور روٹ کے لیے ڈیفالٹ میسج
  return new Response(
    JSON.stringify({
      status: "success",
      message: "Text-to-Speech API is running successfully!",
      usage: "/api/tts?text=Hello",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
