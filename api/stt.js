export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GOOGLE_TTS_API_KEY; // reuse same key
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { audio } = req.body || {};
  if (!audio) return res.status(400).json({ error: "Missing audio" });

  try {
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
            model: "latest_long",
            enableWordTimeOffsets: false,
            enableWordConfidence: true,   // ← confidence per word for pronunciation scoring
            alternativeLanguageCodes: [],
            useEnhanced: true,
          },
          audio: { content: audio }, // base64 encoded audio
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "STT error" });
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      return res.status(200).json({ transcript: "", words: [], confidence: 0 });
    }

    // Get best alternative
    const best = results[0].alternatives[0];
    const transcript = best.transcript || "";
    const confidence = best.confidence || 0;
    const words = (best.words || []).map(w => ({
      word: w.word,
      confidence: w.confidence || 0,
    }));

    return res.status(200).json({ transcript, confidence, words });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
