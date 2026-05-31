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

  // Determine encoding from mimeType sent by client
  let encoding = "WEBM_OPUS";
  let sampleRate = 48000;
  if (mimeType) {
    if (mimeType.includes("ogg")) { encoding = "OGG_OPUS"; sampleRate = 48000; }
    else if (mimeType.includes("mp4") || mimeType.includes("aac")) { encoding = "MP3"; sampleRate = 16000; }
    else if (mimeType.includes("wav")) { encoding = "LINEAR16"; sampleRate = 16000; }
  }

  try {
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config: {
            encoding,
            sampleRateHertz: sampleRate,
            languageCode: "en-US",
            model: "latest_long",
            enableWordConfidence: true,
            useEnhanced: true,
            // Don't set sampleRateHertz if WEBM_OPUS — let Google auto-detect
            ...(encoding === "WEBM_OPUS" ? { sampleRateHertz: undefined } : {}),
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
    if (results.length === 0) {
      return res.status(200).json({ transcript: "", words: [], confidence: 0 });
    }

    const best = results[0].alternatives[0];
    return res.status(200).json({
      transcript: best.transcript || "",
      confidence: best.confidence || 0,
      words: (best.words || []).map(w => ({ word: w.word, confidence: w.confidence || 0 })),
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
