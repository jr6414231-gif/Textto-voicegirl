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
      const audioBuffer = await generateEdgeTTS(text, voice);
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
          message: "Failed to generate realistic neural voice.",
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

// Direct WebSocket function for Microsoft Edge Neural TTS
function generateEdgeTTS(text, voice) {
  return new Promise((resolve, reject) => {
    const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EA5E40C2BC9219357070381B";
    const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
    
    const ws = new WebSocket(wsUrl);
    const audioChunks = [];

    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
      const configHeader = "Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n";
      const configContent = JSON.stringify({
        context: {
          synthesis: {
            audio: {
              metadataversion: "A6031215-D5D2-4710-A1A3-31359A9448C2",
              hasmetadata: "0"
            }
          }
        }
      });
      ws.send(configHeader + configContent);

      const requestId = crypto.randomUUID().replace(/-/g, "");
      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'><voice name='${voice}'>${text}</voice></speak>`;
      const ssmlHeader = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n`;
      ws.send(ssmlHeader + ssml);
    };

    ws.onmessage = (event) => {
      if (typeof event.data === "string") {
        if (event.data.includes("Path:turn.end")) {
          ws.close();
          let totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
          let combined = new Uint8Array(totalLength);
          let offset = 0;
          for (let chunk of audioChunks) {
            combined.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          resolve(combined);
        }
      } else if (event.data instanceof ArrayBuffer) {
        const view = new DataView(event.data);
        const headerLength = view.getUint16(0);
        const audioData = event.data.slice(headerLength + 2);
        if (audioData.byteLength > 0) {
          audioChunks.push(audioData);
        }
      }
    };

    ws.onerror = () => {
      reject(new Error("WebSocket Connection Failed"));
    };

    ws.onclose = () => {
      if (audioChunks.length === 0) {
        reject(new Error("No audio received from Edge TTS service"));
      }
    };
  });
}
