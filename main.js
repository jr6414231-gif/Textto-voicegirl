import { MsEdgeTTS, OUTPUT_FORMAT } from "npm:msedge-tts";

Deno.serve(async (req) => {
  const url = new URL(req.url);

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
    const voice = url.searchParams.get("voice") || "ur-PK-UzmaNeural";

    if (!text) {
      return new Response(
        JSON.stringify({ status: "error", message: "Please provide 'text' parameter." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    try {
      const tts = new MsEdgeTTS();
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

      // In-Memory Stream جنریٹ کرنا (ڈسک پر فائل سیو نہیں ہوگی)
      const readableStream = tts.toStream(text);
      
      const chunks = [];
      for await (const chunk of readableStream) {
        chunks.push(chunk);
      }
      
      const audioBuffer = new Uint8Array(
        chunks.reduce((acc, chunk) => [...acc, ...new Uint8Array(chunk)], [])
      );

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
          message: "Failed to generate neural voice.",
          details: error.message,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({
      status: "success",
      message: "Edge Neural Voice TTS API is running!",
      usage: "/api/tts?text=سلام",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
