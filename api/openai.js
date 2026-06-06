export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "OpenAI API key not configured" });

  const { model = "gpt-5-mini", messages, system, max_tokens = 1000 } = req.body || {};
  if (!messages?.length) return res.status(400).json({ error: "Missing messages" });

  const fullMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        max_completion_tokens: max_tokens, // GPT-5 uses max_completion_tokens
        // temperature: not supported for gpt-5-mini
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || "OpenAI error" });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    // Return in same format as Anthropic API
    return res.status(200).json({
      content: [{ type: "text", text }],
      model: data.model,
      usage: data.usage,
    });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal error" });
  }
}
