export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, rate = 0.9, pitch = 0, voice } = req.body || {};
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Missing text" });
  }

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "TTS API key not configured" });

  // Default voice or custom voice (for podcast: Neural2-D male / Neural2-F female)
  const voiceName = voice || "en-US-Neural2-D";
  const ssmlGender = voiceName.includes("-F") || voiceName.includes("female") ? "FEMALE" : "MALE";

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text: text.slice(0, 500) },
          voice: {
            languageCode: "en-US",
            name: voiceName,
            ssmlGender,
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: Math.min(Math.max(rate, 0.5), 1.5),
            pitch,
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
    if (!data.audioContent) return res.status(500).json({ error: "No audio returned" });
    return res.status(200).json({ audio: data.audioContent });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
