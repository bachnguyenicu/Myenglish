export default async function handler(req, res) {
  // Allow CORS from any origin (your Vercel app)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { text, rate = 0.9, pitch = 0 } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing text" });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "TTS API key not configured" });
  }

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: text.slice(0, 500) }, // max 500 chars per request
          voice: {
            languageCode: "en-US",
            name: "en-US-Neural2-D",   // natural male voice
            ssmlGender: "MALE",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: Math.min(Math.max(rate, 0.5), 1.5),
            pitch: pitch,
            effectsProfileId: ["headphone-class-device"],
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "Google TTS error" });
    }

    const data = await response.json();
    const audioContent = data.audioContent; // base64 MP3

    if (!audioContent) {
      return res.status(500).json({ error: "No audio returned" });
    }

    // Return base64 audio
    return res.status(200).json({ audio: audioContent });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
