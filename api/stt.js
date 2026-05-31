export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const { audio, mimeType } = req.body || {};
  if (!audio) return res.status(400).json({ error: "Missing audio" });

  // For WEBM_OPUS: do NOT set sampleRateHertz, Google auto-detects it
  // Use latest_long model which handles longer audio better
  const isWebm = !mimeType || mimeType.includes("webm");

  try {
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding: "WEBM_OPUS",
            languageCode: "en-US",
            model: "latest_long",          // handles up to 1min audio
            enableWordConfidence: true,
            useEnhanced: true,
            enableAutomaticPunctuation: true,
            // sampleRateHertz intentionally omitted for WEBM_OPUS
          },
          audio: { content: audio },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = err?.error?.message || JSON.stringify(err);
      return res.status(response.status).json({ error: errMsg });
    }

    const data = await response.json();
    const results = data.results || [];

    // Combine all result segments (for longer audio)
    const fullTranscript = results.map(r => r.alternatives[0]?.transcript || "").join(" ").trim();
    const allWords = results.flatMap(r => r.alternatives[0]?.words || []);
    const avgConfidence = results.length > 0
      ? results.reduce((s, r) => s + (r.alternatives[0]?.confidence || 0), 0) / results.length
      : 0;

    return res.status(200).json({
      transcript: fullTranscript,
      confidence: avgConfidence,
      words: allWords.map(w => ({ word: w.word, confidence: w.confidence || 0 })),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
