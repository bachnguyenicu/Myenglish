import { useState, useEffect, useCallback, useRef } from "react";

// ─── API Key Gate ─────────────────────────────────────────────────────────
function ApiKeyGate({ children }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("lx_apikey") || "");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [testing, setTesting] = useState(false);

  const handleSave = async () => {
    const key = input.trim();
    if (!key.startsWith("sk-ant-")) {
      setError("API key không hợp lệ. Key phải bắt đầu bằng sk-ant-");
      return;
    }
    setTesting(true); setError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 10,
          messages: [{ role: "user", content: "hi" }]
        })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d?.error?.message || "Key không hợp lệ hoặc chưa có credit");
      }
      localStorage.setItem("lx_apikey", key);
      setApiKey(key);
    } catch(e) {
      setError("Lỗi: " + e.message);
    } finally {
      setTesting(false);
    }
  };

  if (apiKey) {
    return children(apiKey, () => { localStorage.removeItem("lx_apikey"); setApiKey(""); });
  }

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#09071a,#13082a)", display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem", fontFamily:"Georgia,serif" }}>
      <div style={{ maxWidth:420, width:"100%", background:"rgba(167,139,250,.07)", border:"1px solid rgba(167,139,250,.2)", borderRadius:24, padding:"2rem" }}>
        <div style={{ textAlign:"center", marginBottom:"1.6rem" }}>
          <div style={{ fontFamily:"serif", fontSize:"2.2rem", fontWeight:900, background:"linear-gradient(90deg,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Lexicon</div>
          <div style={{ fontSize:".7rem", color:"#5a4a6a", letterSpacing:".15em", textTransform:"uppercase", marginTop:".2rem" }}>English Vocabulary Trainer</div>
        </div>

        <div style={{ fontSize:".92rem", color:"#9a8888", lineHeight:1.7, marginBottom:"1.3rem", fontFamily:"serif" }}>
          App dùng <b style={{color:"#c4b5fd"}}>Claude AI</b> để tra từ, tạo bài tập và chấm writing. Bạn cần nhập <b style={{color:"#c4b5fd"}}>Anthropic API Key</b>.
        </div>

        <div style={{ background:"rgba(0,0,0,.3)", borderRadius:14, padding:"1rem", marginBottom:"1.2rem", fontSize:".82rem", color:"#7a6a8a", lineHeight:1.85 }}>
          <b style={{color:"#a78bfa", display:"block", marginBottom:".3rem"}}>📋 Cách lấy API Key:</b>
          1. Vào <b style={{color:"#f472b6"}}>console.anthropic.com</b><br/>
          2. Đăng ký tài khoản (dùng Google hoặc email)<br/>
          3. Vào mục <b>API Keys</b> → nhấn <b>Create Key</b><br/>
          4. Copy key bắt đầu bằng <b>sk-ant-...</b><br/>
          5. Vào <b>Billing</b> → nạp tối thiểu <b>$5</b>
        </div>

        <div style={{ marginBottom:".65rem" }}>
          <div style={{ fontSize:".72rem", color:"#6a5a7a", marginBottom:".28rem" }}>Dán API Key vào đây</div>
          <input
            type="password"
            placeholder="sk-ant-api03-..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSave()}
            style={{ width:"100%", background:"rgba(255,255,255,.06)", border:"1.5px solid rgba(255,255,255,.12)", borderRadius:10, padding:".6rem .9rem", color:"#e8e0f0", fontFamily:"monospace", fontSize:".88rem", outline:"none", boxSizing:"border-box" }}
          />
        </div>

        {error && (
          <div style={{ color:"#fca5a5", fontSize:".8rem", marginBottom:".65rem", padding:".45rem .8rem", background:"rgba(248,113,113,.1)", borderRadius:8 }}>
            ⚠ {error}
          </div>
        )}

        <button onClick={handleSave} disabled={testing || !input.trim()}
          style={{ width:"100%", padding:".85rem", borderRadius:12, background: testing ? "rgba(167,139,250,.3)" : "linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", border:"none", fontSize:"1rem", fontWeight:600, cursor: testing ? "not-allowed" : "pointer", fontFamily:"serif" }}>
          {testing ? "⏳ Đang kiểm tra key..." : "🚀 Bắt đầu học"}
        </button>

        <div style={{ textAlign:"center", fontSize:".7rem", color:"#3a2a4a", marginTop:".9rem", lineHeight:1.7 }}>
          🔒 Key lưu trên máy bạn, không gửi đi đâu khác ngoài Anthropic.<br/>
          Chỉ dùng khi tra từ mới, tạo bài tập hoặc chấm writing.
        </div>
      </div>
    </div>
  );
}


// ─── Vocabulary Database ──────────────────────────────────────────────────
const BUILT_IN = [
  { word: "Happy", phonetic: "/ˈhæp.i/", meaning: "Vui vẻ, hạnh phúc", meaningEn: "Feeling or showing pleasure or contentment.", example: "She felt happy after receiving the good news.", type: "adj", level: "A1" },
  { word: "Brave", phonetic: "/breɪv/", meaning: "Dũng cảm, can đảm", meaningEn: "Ready to face danger or difficulty without fear.", example: "The brave firefighter saved the child.", type: "adj", level: "A2" },
  { word: "Curious", phonetic: "/ˈkjʊər.i.əs/", meaning: "Tò mò, háo hức khám phá", meaningEn: "Eager to know or learn something.", example: "Children are naturally curious about the world.", type: "adj", level: "A2" },
  { word: "Determined", phonetic: "/dɪˈtɜː.mɪnd/", meaning: "Quyết tâm, kiên quyết", meaningEn: "Having made a firm decision and resolved not to change it.", example: "She was determined to finish the marathon.", type: "adj", level: "B1" },
  { word: "Accomplish", phonetic: "/əˈkʌm.plɪʃ/", meaning: "Hoàn thành, đạt được mục tiêu", meaningEn: "To succeed in doing or completing something.", example: "He accomplished all his goals this year.", type: "verb", level: "B1" },
  { word: "Significant", phonetic: "/sɪɡˈnɪf.ɪ.kənt/", meaning: "Có ý nghĩa quan trọng, đáng kể", meaningEn: "Important and deserving attention.", example: "This is a significant discovery in science.", type: "adj", level: "B1" },
  { word: "Resilient", phonetic: "/rɪˈzɪl.i.ənt/", meaning: "Có khả năng phục hồi nhanh chóng", meaningEn: "Able to recover quickly from difficult conditions.", example: "She is resilient in the face of adversity.", type: "adj", level: "B2" },
  { word: "Tenacious", phonetic: "/təˈneɪ.ʃəs/", meaning: "Kiên trì, bền bỉ không bỏ cuộc", meaningEn: "Not giving up easily; persistent and determined.", example: "A tenacious athlete never gives up.", type: "adj", level: "B2" },
  { word: "Ambiguous", phonetic: "/æmˈbɪɡ.ju.əs/", meaning: "Mơ hồ, có thể hiểu nhiều nghĩa", meaningEn: "Open to more than one interpretation; unclear.", example: "The instructions were ambiguous.", type: "adj", level: "B2" },
  { word: "Persevere", phonetic: "/ˌpɜː.sɪˈvɪər/", meaning: "Kiên trì theo đuổi dù khó khăn", meaningEn: "Continue in a course of action despite difficulty.", example: "You must persevere to succeed.", type: "verb", level: "B2" },
  { word: "Versatile", phonetic: "/ˈvɜː.sə.taɪl/", meaning: "Linh hoạt, đa năng trong nhiều lĩnh vực", meaningEn: "Able to adapt or be adapted to many functions.", example: "She is a versatile musician.", type: "adj", level: "B2" },
  { word: "Ephemeral", phonetic: "/ɪˈfem.ər.əl/", meaning: "Tồn tại trong thời gian ngắn", meaningEn: "Lasting for a very short time.", example: "The ephemeral beauty of cherry blossoms.", type: "adj", level: "C1" },
  { word: "Eloquent", phonetic: "/ˈel.ə.kwənt/", meaning: "Hùng hồn, khéo léo trong lời nói", meaningEn: "Fluent or persuasive in speaking or writing.", example: "He gave an eloquent speech.", type: "adj", level: "C1" },
  { word: "Meticulous", phonetic: "/məˈtɪk.jʊ.ləs/", meaning: "Tỉ mỉ, cẩn thận từng chi tiết", meaningEn: "Showing great attention to detail; very careful.", example: "She is meticulous in her work.", type: "adj", level: "C1" },
  { word: "Pragmatic", phonetic: "/præɡˈmæt.ɪk/", meaning: "Thực dụng, thiên về thực tế", meaningEn: "Dealing with things sensibly and realistically.", example: "A pragmatic approach solves problems.", type: "adj", level: "C1" },
  { word: "Ubiquitous", phonetic: "/juːˈbɪk.wɪ.təs/", meaning: "Có mặt khắp nơi, phổ biến rộng rãi", meaningEn: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous.", type: "adj", level: "C2" },
  { word: "Laconic", phonetic: "/ləˈkɒn.ɪk/", meaning: "Ngắn gọn, súc tích trong lời nói", meaningEn: "Using very few words; brief and concise.", example: "His laconic reply surprised everyone.", type: "adj", level: "C2" },
];

// ─── SRS (SM-2) ───────────────────────────────────────────────────────────
function getNextReview(card, quality) {
  const now = Date.now();
  const interval = card.interval || 1;
  const ef = card.easeFactor || 2.5;
  let ni, nef;
  if (quality === 0) { ni = 1; nef = Math.max(1.3, ef - 0.2); }
  else if (quality === 1) { ni = Math.max(1, Math.round(interval * 1.2)); nef = Math.max(1.3, ef - 0.1); }
  else { ni = Math.round(interval * ef); nef = Math.min(3.0, ef + 0.1); }
  return { interval: ni, easeFactor: nef, nextReview: now + ni * 86400000, lastReview: now, totalReviews: (card.totalReviews || 0) + 1 };
}
function isDue(card) { return !card.nextReview || card.nextReview <= Date.now(); }

const LEVELS = ["All","A1","A2","B1","B2","C1","C2"];
const MODES = { DAILY:"daily", FLASHCARD:"flashcard", QUIZ:"quiz", SRS:"srs", FILL:"fill", LISTEN_DEF:"listen_def", DICTATION:"dictation", WRITING:"writing", SPEAKING:"speaking", CONVO:"convo", GRAMMAR:"grammar", REVIEW:"review", ADD:"add" };
const LC = { A1:"#4ade80", A2:"#86efac", B1:"#60a5fa", B2:"#818cf8", C1:"#f472b6", C2:"#fb923c" };
function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }
function getBestVoice(voices) {
  // Priority list — best quality voices first
  const priorities = [
    // iOS — Siri-quality premium voices (available on iOS 16+)
    v => v.name === "Samantha" && v.lang.startsWith("en"),
    v => v.name.includes("Samantha"),
    v => v.name === "Daniel" && v.lang.startsWith("en"),
    v => v.name.includes("Karen"),
    v => v.name.includes("Moira"),
    // macOS / Chrome — Google voices are highest quality
    v => v.name.toLowerCase().includes("google") && v.lang.startsWith("en-US"),
    v => v.name.toLowerCase().includes("google") && v.lang.startsWith("en"),
    // macOS built-in
    v => v.name === "Alex",
    v => v.name === "Fred",
    // Fallback: any en-US then any en
    v => v.lang === "en-US",
    v => v.lang.startsWith("en"),
  ];
  for (const test of priorities) {
    const found = voices.find(test);
    if (found) return found;
  }
  return null;
}

function speak(text, rate=0.92) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";

  // iOS needs slower rate to sound cleaner (its TTS engine clips at high rates)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  u.rate = isIOS ? Math.min(rate, 0.82) : rate;

  // iOS: slightly lower pitch sounds more natural on Samantha voice
  u.pitch = isIOS ? 0.95 : 1.0;

  // Volume slightly reduced on iOS prevents distortion
  u.volume = isIOS ? 0.9 : 1.0;

  const trySpeak = () => {
    const vs = window.speechSynthesis.getVoices();
    if (vs.length > 0) {
      const best = getBestVoice(vs);
      if (best) u.voice = best;
    }
    window.speechSynthesis.speak(u);
  };

  // iOS sometimes hasn't loaded voices yet — wait for them
  const vs = window.speechSynthesis.getVoices();
  if (vs.length > 0) {
    trySpeak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      trySpeak();
    };
    // Fallback if onvoiceschanged never fires (some iOS versions)
    setTimeout(trySpeak, 250);
  }
}
function loadState(key, def) {
  try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; }
}


// ─── Supabase Sync ────────────────────────────────────────────────────────
// All sync goes through a single "user_data" row identified by a local userId.
// userId is generated once and stored in localStorage — no login required.

function getSupabaseConfig() {
  try {
    return {
      url: localStorage.getItem("lx_sb_url") || "",
      key: localStorage.getItem("lx_sb_key") || "",
    };
  } catch { return { url: "", key: "" }; }
}

function getUserId() {
  // Use a fixed sync ID set by user (same across all devices) — falls back to random if not set
  return localStorage.getItem("lx_syncid") || localStorage.getItem("lx_userid") || "default";
}

async function sbFetch(path, options, sb) {
  if (!sb?.url || !sb?.key) return null;
  try {
    const res = await fetch(`${sb.url}/rest/v1${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "apikey": sb.key,
        "Authorization": `Bearer ${sb.key}`,
        "Prefer": "return=representation",
        ...(options.headers || {}),
      },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch { return null; }
}

async function loadFromSupabase(sb) {
  const userId = getUserId();
  const rows = await sbFetch(`/lexicon_data?user_id=eq.${userId}&select=*`, { method: "GET" }, sb);
  if (!rows || rows.length === 0) return null;
  return rows[0];
}

async function saveToSupabase(sb, payload) {
  const userId = getUserId();
  // Upsert — insert or update based on user_id
  await sbFetch(
    `/lexicon_data?user_id=eq.${userId}`,
    {
      method: "POST",
      headers: { "Prefer": "resolution=merge-duplicates" },
      body: JSON.stringify({ user_id: userId, ...payload, updated_at: new Date().toISOString() }),
    },
    sb
  );
}

// ─── AI Word Lookup ───────────────────────────────────────────────────────
async function aiLookupWord(input, apiKey) {
  const systemPrompt = "You are a bilingual English-Vietnamese dictionary. Always respond with only a raw JSON object, no markdown, no explanation.";

  const userPrompt = `Look up this input: "${input}"

If it is an English word, provide its entry.
If it is a Vietnamese word or phrase, find the best English equivalent and provide that word's entry.

Return ONLY this JSON (no backticks, no extra text):
{"word":"<English word>","phonetic":"<IPA>","type":"<adj|verb|noun|adv|phrase>","level":"<A1|A2|B1|B2|C1|C2>","meaning":"<Vietnamese meaning>","meaningEn":"<English definition>","example":"<example sentence>"}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  let data;
  try { data = await res.json(); } catch(e) { throw new Error("Không đọc được phản hồi từ server"); }

  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }

  const raw = (data.content || []).map(b => b.text || "").join("").trim();

  // Extract JSON object even if model wraps it in backticks
  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error("Phản hồi không đúng định dạng: " + raw.slice(0, 80));

  let parsed;
  try { parsed = JSON.parse(jsonMatch[0]); }
  catch(e) { throw new Error("Lỗi parse JSON: " + jsonMatch[0].slice(0, 80)); }

  if (!parsed.word || !parsed.meaning) throw new Error("Thiếu trường dữ liệu trong kết quả");
  return parsed;
}


// ─── Claude API — Generate Fill-in-the-blank passage ─────────────────────
async function generatePassage(words, apiKey) {
  const wordList = words.map(w => `"${w.word}" (${w.meaning})`).join(", ");
  const prompt = `Create a coherent English paragraph (4-6 sentences) that naturally uses ALL of these ${words.length} vocabulary words: ${wordList}.

Rules:
- Replace each vocabulary word with a blank shown as [BLANK_1], [BLANK_2], etc. in the ORDER the words appear in the text
- The paragraph should have a clear topic and flow naturally
- Each blank should be clearly inferable from context
- Make it interesting and educational

Respond ONLY with this JSON (no markdown, no backticks):
{"topic":"<short topic title in Vietnamese>","passage":"<paragraph with [BLANK_1], [BLANK_2] etc.>","blanks":["word1","word2"],"meanings":["Vietnamese meaning 1","Vietnamese meaning 2"]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: "You are a helpful assistant. Always respond with only raw JSON, no markdown fences, no explanation.",
      messages: [{ role: "user", content: prompt }]
    })
  });
  let data;
  try { data = await res.json(); } catch(e) { throw new Error("Không đọc được phản hồi"); }
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const raw = (data.content || []).map(b => b.text || "").join("").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Phản hồi không đúng định dạng: " + raw.slice(0, 80));
  const parsed = JSON.parse(match[0]);
  if (!parsed.passage || !parsed.blanks) throw new Error("Thiếu trường dữ liệu");
  return parsed;
}


// ─── JSON repair helper ───────────────────────────────────────────────────
function repairAndParseJSON(raw) {
  // Extract outermost { ... }
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Không tìm thấy JSON trong phản hồi");
  let s = raw.slice(start, end + 1);
  // Normalize smart/curly quotes to straight quotes
  s = s.replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/[\u2018\u2019\u201A\u201B]/g, "'");
  // Remove control chars except tab/newline
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  // Try direct parse
  try { return JSON.parse(s); } catch(_) {}
  // Fallback: extract each field individually
  const str = (key) => { const m = s.match(new RegExp('"' + key + '"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"', "s")); return m ? m[1] : ""; };
  const num = (key) => { const m = s.match(new RegExp('"' + key + '"\\s*:\\s*(\\d+)')); return m ? parseInt(m[1]) : 5; };
  const bool = (key) => { const m = s.match(new RegExp('"' + key + '"\\s*:\\s*(true|false)')); return m ? m[1] === "true" : true; };
  const arr = (key) => {
    const re = new RegExp('"' + key + '"\\s*:\\s*(\\[[\\s\\S]*?\\])(?=\\s*[,}])');
    const m = s.match(re); if (!m) return [];
    try { return JSON.parse(m[1]); } catch(_) { return []; }
  };
  return {
    overallScore: num("overallScore"),
    wordUsed: bool("wordUsed"),
    wordUsedCorrectly: bool("wordUsedCorrectly"),
    correctedSentence: str("correctedSentence"),
    spellingErrors: arr("spellingErrors"),
    grammarErrors: arr("grammarErrors"),
    styleAdvice: str("styleAdvice"),
    lessons: arr("lessons"),
    encouragement: str("encouragement") || "Tiếp tục luyện tập nhé!",
  };
}

// ─── Claude API — Writing Checker ─────────────────────────────────────────
async function checkWriting(word, sentence, apiKey) {
  // Use XML-tagged output to avoid JSON quote escaping issues entirely
  const prompt = `Analyze this English sentence from a Vietnamese learner.
Word: ${word.word} | Type: ${word.type} | Level: ${word.level} | Meaning: ${word.meaning}
Sentence: ${sentence}

Return ONLY a JSON object. Critical rules:
- No markdown, no backticks, no explanation outside JSON
- String values must NOT contain double-quote characters — use single quotes or rephrase instead
- No line breaks inside string values
- Arrays can be empty []

JSON structure:
{"overallScore":7,"wordUsed":true,"wordUsedCorrectly":true,"correctedSentence":"the corrected sentence","spellingErrors":[{"wrong":"wrng","correct":"wrong","tip":"spelling tip"}],"grammarErrors":[{"error":"bad form","correction":"good form","rule":"quy tac bang tieng Viet"}],"styleAdvice":"loi khuyen van phong bang tieng Viet","lessons":[{"title":"Ten bai hoc","explanation":"Giai thich bang tieng Viet, khong dung dau ngoac kep","example":"An example sentence."}],"encouragement":"Loi dong vien bang tieng Viet."}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      system: "You are an English writing coach. Output ONLY a single-line compact JSON object. Never put double-quote characters inside JSON string values — use single quotes or reword instead. Never add markdown.",
      messages: [{ role: "user", content: prompt }]
    })
  });

  let data;
  try { data = await res.json(); } catch(e) { throw new Error("Không đọc được phản hồi"); }
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const raw = (data.content || []).map(b => b.text || "").join("").trim();
  try {
    return repairAndParseJSON(raw);
  } catch(e) {
    throw new Error("Lỗi đọc kết quả: " + e.message);
  }
}


// ─── Claude API — Generate Dictation Sentence ─────────────────────────────
async function generateDictationSentence(word, apiKey) {
  const prompt = `Create ONE natural English sentence using the word "${word.word}" (${word.type}, meaning: ${word.meaning}).

Requirements:
- Length: 15-25 words
- Natural, fluid English (conversational or academic)
- The word must appear exactly once in the sentence
- Varied vocabulary, realistic context, grammatically perfect

Reply with ONLY the sentence, no quotes, no explanation.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "anthropic-dangerous-direct-browser-access": "true",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 120,
      system: "Reply with ONLY one English sentence. No quotes. No explanation.",
      messages: [{ role: "user", content: prompt }]
    })
  });
  let data;
  try { data = await res.json(); } catch(e) { throw new Error("Không đọc được phản hồi"); }
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const sentence = (data.content || []).map(b => b.text || "").join("").trim().replace(/^["\']+|["\']+$/g, "");
  if (!sentence || sentence.length < 20) throw new Error("Câu quá ngắn, thử lại");
  return sentence;
}


// ─── Claude API — Generate Conversation Script ────────────────────────────
async function generateConvoScript(topic, level, words, apiKey) {
  const wordHint = words.length > 0
    ? `Try to naturally include 1-2 of these vocabulary words: ${words.slice(0,4).map(w=>w.word).join(", ")}.`
    : "";
  const prompt = `Create a natural 2-person English conversation for a Vietnamese learner at ${level} level.
Topic: "${topic || "daily life, travel, or work"}"
${wordHint}

Rules:
- 5-7 turns total (alternating AI then User)
- AI speaks first
- Each turn: 1-2 natural sentences, realistic dialogue
- User turns should be achievable for ${level} level
- No greetings/farewells needed, dive into the topic
- Keep it conversational, not textbook-stiff

Reply ONLY with this JSON (no markdown):
{"topic":"<topic in Vietnamese>","turns":[{"role":"ai","text":"<AI says this>"},{"role":"user","prompt":"<hint in Vietnamese: what the user should say>","ideal":"<ideal English response>"}]}

Alternate strictly: ai, user, ai, user... Start with ai.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:900,
      system:"Output ONLY raw JSON. No markdown. No explanation.",
      messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Phản hồi không hợp lệ");
  const parsed = JSON.parse(m[0]);
  if (!parsed.turns || parsed.turns.length < 2) throw new Error("Kịch bản không hợp lệ");
  return parsed;
}

// ─── Claude API — Review Full Conversation ────────────────────────────────
async function reviewConversation(turns, apiKey) {
  const transcript = turns
    .filter(t => t.role === "user" && t.userSaid)
    .map((t,i) => `User turn ${i+1}:\n  Said: "${t.userSaid}"\n  Ideal: "${t.ideal}"`)
    .join("\n");

  const prompt = `Review this English conversation from a Vietnamese learner. Analyze each user turn.

${transcript}

For each user turn, provide:
1. Pronunciation score estimate (based on similarity to ideal, 0-100)
2. Grammar corrections if needed
3. More natural/refined version
4. One specific tip

Reply ONLY with raw JSON (no markdown, no unescaped quotes inside strings):
{"overallScore":75,"summary":"tong ket bang tieng Viet","turns":[{"turnIndex":1,"said":"what they said","refined":"more natural version","grammarNote":"grammar fix or empty string","pronunciationTip":"one phonetic tip","score":80}]}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:1200,
      system:"You are an English conversation coach. Output ONLY compact single-line JSON. Never use unescaped double quotes inside string values.",
      messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  try { return repairAndParseJSON(raw); } catch(e) { throw new Error("Lỗi đọc review: " + e.message); }
}


// ─── Claude API — Generate Daily Challenge ────────────────────────────────
async function generateDailyChallenge(words, level, apiKey) {
  // Pick 1 focus word — prefer learning words
  const focus = words[Math.floor(Math.random() * Math.min(words.length, 8))];
  const prompt = `Create a daily English learning challenge for a Vietnamese learner at ${level || "B1"} level.
Focus word: "${focus.word}" (${focus.type}) — meaning: ${focus.meaning}

Generate a mini challenge with 3 tasks. Reply ONLY with raw JSON:
{
  "focusWord": "${focus.word}",
  "focusMeaning": "${focus.meaning}",
  "focusPhonetic": "${focus.phonetic}",
  "topic": "<interesting topic in Vietnamese, 3-5 words>",
  "listenSentence": "<1 natural sentence 12-20 words using ${focus.word}, for listening practice>",
  "writePrompt": "<question in Vietnamese asking them to write 1-2 sentences using ${focus.word}>",
  "writeIdeal": "<ideal 1-2 sentence English answer>",
  "speakSentence": "<same or similar sentence for speaking practice>"
}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json","anthropic-dangerous-direct-browser-access":"true","x-api-key":apiKey,"anthropic-version":"2023-06-01"},
    body:JSON.stringify({model:"claude-haiku-4-5-20251001",max_tokens:500,
      system:"Output ONLY raw JSON. No markdown.",
      messages:[{role:"user",content:prompt}]})
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("Phản hồi không hợp lệ");
  return JSON.parse(m[0]);
}

// ══════════════════════════════════════════════════════════════════════════
function VocabApp({ apiKey }) {
  const [allWords, setAllWords] = useState(() => loadState("lx_words", BUILT_IN));
  const [srsData, setSrsData] = useState(() => loadState("lx_srs", {}));
  const [knownArr, setKnownArr] = useState(() => loadState("lx_known", []));
  const [learningArr, setLearningArr] = useState(() => loadState("lx_learning", []));
  const knownSet = new Set(knownArr);
  const learningSet = new Set(learningArr);

  const [mode, setMode] = useState(MODES.FLASHCARD);
  const [levelFilter, setLevelFilter] = useState("All");
  const [cardIdx, setCardIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [streak, setStreak] = useState(0);
  const [streakAnim, setStreakAnim] = useState(false);
  // Quiz
  const [quizQ, setQuizQ] = useState(null);
  const [quizScore, setQuizScore] = useState({ c:0, t:0 });
  const [quizDone, setQuizDone] = useState(false);
  // SRS
  const [srsQueue, setSrsQueue] = useState([]);
  const [srsCurrent, setSrsCurrent] = useState(null);
  const [srsFlipped, setSrsFlipped] = useState(false);
  const [srsDone, setSrsDone] = useState(false);
  const [srsSess, setSrsSess] = useState({ r:0, c:0 });
  // Add word AI
  const [addInput, setAddInput] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addPreview, setAddPreview] = useState(null); // AI result preview
  const [addErr, setAddErr] = useState("");
  const [addOk, setAddOk] = useState("");
  const inputRef = useRef(null);
  // Fill-in-the-blank
  const [fillLoading, setFillLoading] = useState(false);
  const [fillPassage, setFillPassage] = useState(null);
  const [fillAnswers, setFillAnswers] = useState([]);
  const [fillChecked, setFillChecked] = useState(false);
  const [fillErr, setFillErr] = useState("");

  // Writing practice
  const [writingWord, setWritingWord] = useState(null);
  const [writingInput, setWritingInput] = useState("");
  const [writingResult, setWritingResult] = useState(null);
  const [writingLoading, setWritingLoading] = useState(false);
  const [writingHistory, setWritingHistory] = useState([]);
  const [savedLessons, setSavedLessons] = useState(() => loadState("lx_grammar_lessons", []));
  // Daily Challenge
  const [dailyProgress, setDailyProgress] = useState(() => loadState("lx_daily", null));
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [dailyStep, setDailyStep]   = useState(0);   // 0=intro,1=listen,2=write,3=speak,4=done
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyListened, setDailyListened] = useState(false);
  const [dailyWriteInput, setDailyWriteInput] = useState("");
  const [dailyWriteResult, setDailyWriteResult] = useState(null);
  const [dailyWriteLoading, setDailyWriteLoading] = useState(false);
  const [dailySpeakResult, setDailySpeakResult] = useState(null);
  const [dailySpeakListening, setDailySpeakListening] = useState(false);
  const dailySpeakRecRef = useRef(null);
  // Listen & Dictation shared
  const [listenQueue, setListenQueue] = useState([]);
  const [listenIdx, setListenIdx] = useState(0);
  const [listenInput, setListenInput] = useState("");
  const [listenChecked, setListenChecked] = useState(false);
  const [listenScore, setListenScore] = useState({ c:0, t:0 });
  const [listenDone, setListenDone] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [dictSentences, setDictSentences] = useState({}); // cache: word -> AI sentence
  const [dictGenLoading, setDictGenLoading] = useState(false);
  // Speaking / Pronunciation
  const [spkWord, setSpkWord] = useState(null);
  const [spkMode, setSpkMode] = useState("word"); // "word" | "sentence"
  const [spkResult, setSpkResult] = useState(null); // {transcript, score, feedback}
  const [spkListening, setSpkListening] = useState(false);
  const [spkPlaying, setSpkPlaying] = useState(false);
  const [spkHistory, setSpkHistory] = useState([]); // [{word, score, ts}]
  const recognitionRef = useRef(null);
  // Conversation mode
  const [convoScript, setConvoScript] = useState(null);   // [{role:"ai"|"user", text, prompt}]
  const [convoTurn, setConvoTurn]     = useState(0);       // current turn index
  const [convoLog, setConvoLog]       = useState([]);       // [{role, text, userSaid, score, diff}]
  const [convoListening, setConvoListening] = useState(false);
  const [convoPlaying, setConvoPlaying]     = useState(false);
  const [convoLoading, setConvoLoading]     = useState(false);
  const [convoReview, setConvoReview]       = useState(null); // full review from AI
  const [convoReviewLoading, setConvoReviewLoading] = useState(false);
  const [convoPhase, setConvoPhase]   = useState("setup"); // setup|convo|review
  const [convoTopic, setConvoTopic]   = useState("");
  const [convoLevel, setConvoLevel]   = useState("B1");
  const convoRecRef   = useRef(null);
  const convoTurnRef  = useRef(0);      // mirrors convoTurn but always fresh in callbacks
  const convoScriptRef = useRef(null);  // mirrors convoScript but always fresh
  const convoLogRef   = useRef([]);     // mirrors convoLog but always fresh
  const convoResultPending = useRef(false); // guard against duplicate onresult fires
  const [convoLiveText, setConvoLiveText] = useState("");
  const [showSbSetup, setShowSbSetup] = useState(false);
  const [sbForm, setSbForm] = useState({ url: "", key: "", syncId: "" });
  const [sbTesting, setSbTesting] = useState(false);
  const [sbMsg, setSbMsg] = useState("");

  const filtered = levelFilter === "All" ? allWords : allWords.filter(w => w.level === levelFilter);
  const card = filtered[cardIdx] || filtered[0];

  // Supabase config
  const [sb] = useState(() => getSupabaseConfig());
  const [syncStatus, setSyncStatus] = useState("idle"); // idle | syncing | ok | error | nosb
  const [lastSync, setLastSync] = useState(null);
  const syncTimer = useRef(null);

  // Load from Supabase on first mount (if configured)
  useEffect(() => {
    if (!sb.url || !sb.key) { setSyncStatus("nosb"); return; }
    setSyncStatus("syncing");
    loadFromSupabase(sb).then(row => {
      if (row) {
        if (row.words)    { setAllWords(row.words);    localStorage.setItem("lx_words", JSON.stringify(row.words)); }
        if (row.srs_data) { setSrsData(row.srs_data);  localStorage.setItem("lx_srs", JSON.stringify(row.srs_data)); }
        if (row.known)    { setKnownArr(row.known);    localStorage.setItem("lx_known", JSON.stringify(row.known)); }
        if (row.learning) { setLearningArr(row.learning); localStorage.setItem("lx_learning", JSON.stringify(row.learning)); }
        if (row.grammar_lessons) { setSavedLessons(row.grammar_lessons); localStorage.setItem("lx_grammar_lessons", JSON.stringify(row.grammar_lessons)); }
        setLastSync(new Date());
      }
      setSyncStatus("ok");
    }).catch(() => setSyncStatus("error"));
  }, []);

  // Debounced save — waits 2s after last change before pushing to Supabase
  const scheduleSave = useCallback((words, srs, known, learning, lessons) => {
    if (!sb.url || !sb.key) return;
    clearTimeout(syncTimer.current);
    setSyncStatus("syncing");
    syncTimer.current = setTimeout(async () => {
      await saveToSupabase(sb, { words, srs_data: srs, known, learning, grammar_lessons: lessons });
      setLastSync(new Date());
      setSyncStatus("ok");
    }, 2000);
  }, [sb]);

  // Persist to localStorage + schedule cloud save
  useEffect(() => { try { localStorage.setItem("lx_words", JSON.stringify(allWords)); } catch {} }, [allWords]);
  useEffect(() => { try { localStorage.setItem("lx_srs", JSON.stringify(srsData)); } catch {} }, [srsData]);
  useEffect(() => { try { localStorage.setItem("lx_known", JSON.stringify(knownArr)); } catch {} }, [knownArr]);
  useEffect(() => { try { localStorage.setItem("lx_learning", JSON.stringify(learningArr)); } catch {} }, [learningArr]);
  useEffect(() => { try { localStorage.setItem("lx_grammar_lessons", JSON.stringify(savedLessons)); } catch {} }, [savedLessons]);
  useEffect(() => { try { localStorage.setItem("lx_daily", JSON.stringify(dailyProgress)); } catch {} }, [dailyProgress]);

  // Trigger cloud sync whenever any data changes
  useEffect(() => {
    scheduleSave(allWords, srsData, knownArr, learningArr, savedLessons);
  }, [allWords, srsData, knownArr, learningArr, savedLessons]);

  useEffect(() => { setCardIdx(0); setFlipped(false); }, [levelFilter]);
  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);

  // Manual sync
  const doManualSync = async () => {
    if (!sb.url || !sb.key) return;
    setSyncStatus("syncing");
    try {
      await saveToSupabase(sb, { words: allWords, srs_data: srsData, known: knownArr, learning: learningArr, grammar_lessons: savedLessons });
      setLastSync(new Date());
      setSyncStatus("ok");
    } catch { setSyncStatus("error"); }
  };


  // Supabase setup modal
  const testAndSaveSb = async () => {
    const url = sbForm.url.trim().replace(/\/$/, "");
    const key = sbForm.key.trim();
    if (!url || !key) { setSbMsg("error:Vui lòng nhập đủ URL và Key"); return; }
    if (!url.includes("supabase.co")) { setSbMsg("error:URL không đúng, phải có dạng https://xxx.supabase.co"); return; }
    setSbTesting(true); setSbMsg("");
    try {
      // Test by reading from the table
      const res = await fetch(`${url}/rest/v1/lexicon_data?limit=1`, {
        headers: { "apikey": key, "Authorization": `Bearer ${key}` }
      });
      if (res.status === 401) throw new Error("Key không hợp lệ hoặc không có quyền truy cập");
      if (res.status === 404) throw new Error("Bảng lexicon_data chưa được tạo — hãy chạy SQL trong hướng dẫn trước");
      if (!res.ok) throw new Error(`Lỗi kết nối (${res.status})`);
      // Save to localStorage
      const syncId = sbForm.syncId.trim() || localStorage.getItem("lx_syncid") || "myaccount";
      localStorage.setItem("lx_sb_url", url);
      localStorage.setItem("lx_sb_key", key);
      localStorage.setItem("lx_syncid", syncId);
      setSbMsg("ok:Kết nối thành công! Đang tải dữ liệu...");
      // Reload page to re-init with new config
      setTimeout(() => window.location.reload(), 1200);
    } catch(e) {
      setSbMsg("error:" + e.message);
    } finally {
      setSbTesting(false);
    }
  };

  // Quiz
  const startQuiz = useCallback(() => {
    const pool = filtered.length >= 4 ? filtered : allWords;
    const qs = shuffle(pool).slice(0, Math.min(10, pool.length)).map(item => {
      const wrong = shuffle(pool.filter(v => v.word !== item.word)).slice(0, 3);
      return { item, options: shuffle([item, ...wrong]), selected: null };
    });
    setQuizQ(qs); setQuizScore({ c:0, t:0 }); setQuizDone(false);
  }, [filtered, allWords]);
  useEffect(() => { if (mode === MODES.QUIZ) startQuiz(); }, [mode]);

  // SRS
  const buildSrs = useCallback(() => {
    const due = allWords.filter(w => isDue(srsData[w.word] || {}));
    setSrsQueue(shuffle(due)); setSrsCurrent(null); setSrsFlipped(false); setSrsDone(false); setSrsSess({ r:0, c:0 });
  }, [allWords, srsData]);
  useEffect(() => { if (mode === MODES.SRS) buildSrs(); }, [mode]);
  useEffect(() => {
    if (mode !== MODES.SRS) return;
    if (srsQueue.length > 0 && !srsCurrent) { setSrsCurrent(srsQueue[0]); setSrsFlipped(false); }
    else if (srsQueue.length === 0 && !srsDone) setSrsDone(true);
  }, [srsQueue, mode, srsCurrent, srsDone]);

  // Flashcard
  const doFlashcard = (dir) => {
    if (!card) return;
    setFlipped(false);
    setTimeout(() => {
      const w = card.word;
      if (dir === "known") {
        setKnownArr(p => [...new Set([...p, w])]);
        setLearningArr(p => p.filter(x => x !== w));
        setStreak(s => s + 1); setStreakAnim(true); setTimeout(() => setStreakAnim(false), 900);
        setSrsData(p => ({ ...p, [w]: getNextReview(p[w] || {}, 2) }));
      } else {
        setLearningArr(p => [...new Set([...p, w])]);
        setKnownArr(p => p.filter(x => x !== w));
        setStreak(0);
        setSrsData(p => ({ ...p, [w]: getNextReview(p[w] || {}, 0) }));
      }
      setCardIdx(i => (i + 1) % filtered.length);
    }, 130);
  };

  // Quiz
  const doQuiz = (qi, optWord) => {
    setQuizQ(prev => {
      if (!prev || prev[qi].selected) return prev;
      const ok = optWord === prev[qi].item.word;
      const upd = prev.map((q, i) => i === qi ? { ...q, selected: optWord, correct: ok } : q);
      const ans = upd.filter(q => q.selected).length;
      const cor = upd.filter(q => q.correct).length;
      setQuizScore({ c: cor, t: ans });
      if (ans === upd.length) setQuizDone(true);
      return upd;
    });
  };

  // SRS
  const doSrs = (quality) => {
    if (!srsCurrent) return;
    const next = getNextReview(srsData[srsCurrent.word] || {}, quality);
    setSrsData(p => ({ ...p, [srsCurrent.word]: next }));
    if (quality > 0) { setKnownArr(p => [...new Set([...p, srsCurrent.word])]); setLearningArr(p => p.filter(x => x !== srsCurrent.word)); }
    else { setLearningArr(p => [...new Set([...p, srsCurrent.word])]); }
    setSrsSess(p => ({ r: p.r+1, c: p.c + (quality>0?1:0) }));
    setSrsQueue(p => p.slice(1)); setSrsCurrent(null);
  };

  // ── AI Lookup ─────────────────────────────────────────────────────────
  const handleLookup = async () => {
    const q = addInput.trim();
    if (!q) return;
    setAddErr(""); setAddPreview(null); setAddLoading(true);
    try {
      const result = await aiLookupWord(q, apiKey);
      if (!result.word || !result.meaning || !result.example) throw new Error("Kết quả không hợp lệ");
      setAddPreview(result);
    } catch (e) {
      setAddErr("Lỗi: " + (e.message || "Không thể tra cứu. Vui lòng thử lại."));
    } finally {
      setAddLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!addPreview) return;
    if (allWords.find(w => w.word.toLowerCase() === addPreview.word.toLowerCase())) {
      setAddErr(`"${addPreview.word}" đã tồn tại trong danh sách!`);
      return;
    }
    setAllWords(p => [...p, { ...addPreview, custom: true }]);
    setAddOk(`✅ Đã thêm "${addPreview.word}" thành công!`);
    setAddInput(""); setAddPreview(null); setAddErr("");
    setTimeout(() => setAddOk(""), 2500);
    inputRef.current?.focus();
  };

  const handleEditPreview = (key, val) => {
    setAddPreview(p => ({ ...p, [key]: val }));
  };

  const dueCount = allWords.filter(w => isDue(srsData[w.word] || {})).length;
  const masteredCount = Object.entries(srsData).filter(([,d]) => d.interval >= 7).length;

  // ── CSS ───────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    .card3d{perspective:1400px;cursor:pointer;}
    .ci{transition:transform .65s cubic-bezier(.4,2,.55,1);transform-style:preserve-3d;position:relative;width:100%;height:100%;}
    .ci.flipped{transform:rotateY(180deg);}
    .cf{backface-visibility:hidden;-webkit-backface-visibility:hidden;position:absolute;inset:0;border-radius:22px;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:1.8rem;}
    .cb{transform:rotateY(180deg);}
    .btn{border:none;cursor:pointer;transition:all .18s;font-family:'Crimson Pro',serif;}
    .btn:hover{transform:translateY(-2px) scale(1.02);}
    .btn:active{transform:translateY(1px) scale(.98);}
    .ntab{padding:.42rem .95rem;border-radius:999px;font-size:.8rem;font-weight:600;letter-spacing:.04em;white-space:nowrap;}
    .ntab.on{background:linear-gradient(135deg,#a78bfa,#ec4899);color:white;box-shadow:0 4px 16px rgba(167,139,250,.35);}
    .ntab.off{background:rgba(255,255,255,.06);color:#8a7a9a;}
    .lvbtn{padding:.28rem .7rem;border-radius:999px;font-size:.7rem;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .15s;}
    .qopt{border-radius:12px;padding:.72rem 1rem;margin-bottom:.45rem;width:100%;text-align:left;font-size:.96rem;font-family:'Crimson Pro',serif;cursor:pointer;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e0f0;transition:all .18s;}
    .qopt:hover:not(:disabled){background:rgba(167,139,250,.15);border-color:#a78bfa;transform:translateX(4px);}
    .qopt.ok{background:rgba(74,222,128,.15);border-color:#4ade80!important;color:#4ade80;}
    .qopt.no{background:rgba(248,113,113,.15);border-color:#f87171!important;color:#f87171;}
    .fi{background:rgba(255,255,255,.05);border:1.5px solid rgba(255,255,255,.1);border-radius:10px;padding:.55rem .85rem;color:#e8e0f0;font-family:'Crimson Pro',serif;font-size:.95rem;width:100%;outline:none;transition:border-color .2s;}
    .fi:focus{border-color:#a78bfa;}
    .fi::placeholder{color:#4a3a5a;}
    .fi-sm{font-size:.88rem;padding:.42rem .75rem;}
    .spkbtn{background:rgba(167,139,250,.14);border:1px solid rgba(167,139,250,.28);border-radius:999px;padding:.28rem .75rem;color:#c4b5fd;font-size:.78rem;cursor:pointer;transition:all .2s;display:inline-flex;align-items:center;gap:.3rem;}
    .spkbtn:hover{background:rgba(167,139,250,.28);}
    .stpop{position:fixed;top:38%;left:50%;transform:translate(-50%,-50%) scale(0);animation:pop .85s ease forwards;pointer-events:none;font-size:2.6rem;z-index:999;text-align:center;}
    @keyframes pop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}30%{transform:translate(-50%,-50%) scale(1.5);opacity:1}65%{transform:translate(-50%,-50%) scale(1.1);opacity:1}100%{transform:translate(-50%,-50%) scale(.3);opacity:0}}
    .srsbtn{padding:.72rem 1.1rem;border-radius:14px;font-family:'Crimson Pro',serif;font-size:.95rem;font-weight:600;cursor:pointer;border:1.5px solid;transition:all .2s;}
    .srsbtn:hover{transform:translateY(-3px);}
    @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
    .shimmer{background:linear-gradient(90deg,rgba(167,139,250,.08) 25%,rgba(167,139,250,.18) 50%,rgba(167,139,250,.08) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
    @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    .fade-in{animation:fadeIn .35s ease forwards;}
    ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(167,139,250,.22);border-radius:4px;}
    select option{background:#1a0e2e;color:#e8e0f0;}
    textarea.fi{resize:vertical;min-height:60px;line-height:1.5;}
    .listen-input{width:100%;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:.75rem 1rem;color:#e8e0f0;font-family:'Crimson Pro',serif;font-size:1.1rem;outline:none;transition:all .25s;text-align:center;}
    .listen-input:focus{border-color:#a78bfa;background:rgba(167,139,250,.1);}
    .listen-input.correct{border-color:#4ade80;background:rgba(74,222,128,.1);color:#4ade80;}
    .listen-input.wrong{border-color:#f87171;background:rgba(248,113,113,.1);}
    .dict-input{width:100%;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:14px;padding:.8rem 1rem;color:#e8e0f0;font-family:'Crimson Pro',serif;font-size:1rem;outline:none;transition:all .25s;line-height:1.6;resize:none;min-height:80px;}
    .dict-input:focus{border-color:#60a5fa;background:rgba(96,165,250,.08);}
    .dict-input.correct{border-color:#4ade80;background:rgba(74,222,128,.08);}
    .dict-input.wrong{border-color:#f87171;background:rgba(248,113,113,.08);}
    .speak-pulse{animation:pulse 1.2s ease-in-out infinite;}
    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(1.08)}}
    .diff-correct{color:#4ade80;}
    .diff-wrong{color:#f87171;text-decoration:underline;}
    .diff-missing{color:#f87171;font-style:italic;}
    .phone-char{display:inline-block;padding:.1rem .25rem;border-radius:4px;margin:.05rem;font-family:monospace;font-size:.95rem;transition:all .2s;}
    .phone-ok{background:rgba(74,222,128,.18);color:#4ade80;}
    .phone-bad{background:rgba(248,113,113,.18);color:#f87171;text-decoration:underline;}
    .phone-miss{background:rgba(251,191,36,.12);color:#fbbf24;font-style:italic;}
    .mic-btn{width:80px;height:80px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:2rem;transition:all .25s;margin:0 auto;}
    .mic-btn.idle{background:linear-gradient(135deg,rgba(167,139,250,.2),rgba(236,72,153,.15));border:2px solid rgba(167,139,250,.3);}
    .mic-btn.listening{background:rgba(248,113,113,.25);border:2px solid #f87171;animation:micpulse 1s ease-in-out infinite;}
    @keyframes micpulse{0%,100%{box-shadow:0 0 0 0 rgba(248,113,113,.4)}50%{box-shadow:0 0 0 14px rgba(248,113,113,.0)}}
    .score-ring{transform:rotate(-90deg);transform-origin:50%;}
    .spk-tab{padding:.35rem .9rem;border-radius:999px;font-size:.78rem;font-weight:700;cursor:pointer;border:1.5px solid;transition:all .2s;}
    .chat-bubble-ai{background:linear-gradient(135deg,rgba(96,165,250,.12),rgba(129,140,248,.08));border:1px solid rgba(96,165,250,.2);border-radius:18px 18px 18px 4px;padding:.75rem 1rem;margin-bottom:.6rem;max-width:88%;}
    .chat-bubble-user{background:linear-gradient(135deg,rgba(167,139,250,.15),rgba(236,72,153,.1));border:1px solid rgba(167,139,250,.22);border-radius:18px 18px 4px 18px;padding:.75rem 1rem;margin-bottom:.6rem;max-width:88%;margin-left:auto;}
    .chat-bubble-user-err{background:linear-gradient(135deg,rgba(248,113,113,.12),rgba(251,191,36,.08));border:1px solid rgba(248,113,113,.2);border-radius:18px 18px 4px 18px;padding:.75rem 1rem;margin-bottom:.6rem;max-width:88%;margin-left:auto;}
    .review-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:.9rem 1rem;margin-bottom:.7rem;}
    .pulse-rec{animation:recpulse 1.2s ease-in-out infinite;}
    .daily-step{display:flex;align-items:center;gap:.5rem;padding:.5rem .8rem;border-radius:10px;font-size:.82rem;font-family:'Crimson Pro',serif;}
    .daily-step.done{background:rgba(74,222,128,.1);border:1px solid rgba(74,222,128,.2);color:#4ade80;}
    .daily-step.active{background:rgba(167,139,250,.12);border:1px solid rgba(167,139,250,.28);color:#c4b5fd;font-weight:700;}
    .daily-step.pending{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);color:#4a3a5a;}
    .streak-badge{display:inline-flex;align-items:center;gap:.3rem;background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(248,113,113,.15));border:1px solid rgba(251,191,36,.3);border-radius:999px;padding:.3rem .9rem;font-size:.85rem;font-weight:700;color:#fbbf24;}
    @keyframes recpulse{0%,100%{opacity:1}50%{opacity:.4}}
    .writing-area{width:100%;background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.1);border-radius:14px;padding:.9rem 1rem;color:#e8e0f0;font-family:'Crimson Pro',serif;font-size:1.05rem;outline:none;transition:all .25s;line-height:1.7;resize:none;min-height:110px;}
    .writing-area:focus{border-color:#f472b6;background:rgba(244,114,182,.06);}
    .tag{display:inline-flex;align-items:center;padding:.18rem .65rem;border-radius:999px;font-size:.72rem;font-weight:700;letter-spacing:.04em;}
    .tag-green{background:rgba(74,222,128,.15);border:1px solid rgba(74,222,128,.3);color:#4ade80;}
    .tag-yellow{background:rgba(251,191,36,.15);border:1px solid rgba(251,191,36,.3);color:#fbbf24;}
    .tag-red{background:rgba(248,113,113,.15);border:1px solid rgba(248,113,113,.3);color:#f87171;}
    .tag-blue{background:rgba(96,165,250,.15);border:1px solid rgba(96,165,250,.3);color:#60a5fa;}
    .lesson-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:.9rem 1rem;margin-bottom:.7rem;}
    .lesson-card h4{font-family:'Playfair Display',serif;font-size:.95rem;font-weight:700;margin-bottom:.4rem;}
    .blank-input{background:rgba(167,139,250,.1);border:1.5px solid rgba(167,139,250,.3);border-radius:8px;padding:.25rem .6rem;color:#e8e0f0;font-family:'Crimson Pro',serif;font-size:1rem;outline:none;min-width:100px;max-width:160px;text-align:center;transition:all .2s;display:inline-block;vertical-align:middle;margin:0 3px;}
    .blank-input:focus{border-color:#a78bfa;background:rgba(167,139,250,.18);}
    .blank-input.correct{border-color:#4ade80!important;background:rgba(74,222,128,.15);color:#4ade80;}
    .blank-input.wrong{border-color:#f87171!important;background:rgba(248,113,113,.15);color:#f87171;}
    .passage-text{font-family:'Crimson Pro',serif;font-size:1.08rem;line-height:2.2;color:#d4c8f0;}
  `;

  const todayStr = new Date().toDateString();
  const dailyDone = dailyProgress?.date === todayStr && dailyProgress?.completed;
  const modeLabel = {
    [MODES.DAILY]: dailyDone ? "🔥 Daily ✓" : "🔥 Daily",
    [MODES.FLASHCARD]:"📇 Thẻ",
    [MODES.QUIZ]:"🧠 Quiz",
    [MODES.SRS]: dueCount>0 ? `🔁 SRS (${dueCount})` : "🔁 SRS",
    [MODES.FILL]:"✍️ Điền từ",
    [MODES.LISTEN_DEF]:"👂 Nghe nghĩa",
    [MODES.DICTATION]:"🎧 Chép chính tả",
    [MODES.WRITING]:"✏️ Writing",
    [MODES.SPEAKING]:"🎤 Speaking",
    [MODES.CONVO]:"💬 Hội thoại",
    [MODES.GRAMMAR]: savedLessons.length > 0 ? `📒 Grammar (${savedLessons.length})` : "📒 Grammar",
    [MODES.REVIEW]:"📖 Ôn tập",
    [MODES.ADD]:"✨ Thêm từ",
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(145deg,#09071a 0%,#13082a 50%,#091422 100%)", color:"#e8e0f0", fontFamily:"'Georgia',serif" }}>
      <style>{css}</style>
      {streakAnim && <div className="stpop">🔥<br /><span style={{ fontSize:"1.1rem", color:"#fbbf24", fontFamily:"'Playfair Display',serif" }}>{streak+1} streak!</span></div>}

      {/* HEADER */}
      <div style={{ background:"rgba(0,0,0,.4)", backdropFilter:"blur(20px)", borderBottom:"1px solid rgba(255,255,255,.06)", position:"sticky", top:0, zIndex:50 }}>
        <div style={{ maxWidth:720, margin:"0 auto", padding:".7rem 1.1rem" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".42rem" }}>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.55rem", fontWeight:900, background:"linear-gradient(90deg,#a78bfa,#f472b6)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", lineHeight:1 }}>Lexicon</div>
              <div style={{ fontSize:".6rem", color:"#4a3a6a", letterSpacing:".18em", textTransform:"uppercase" }}>English Vocabulary Trainer</div>
            </div>
            <div style={{ display:"flex", gap:".7rem", fontSize:".72rem" }}>
              <span style={{ color:"#fbbf24" }}>🏆 {masteredCount}</span>
              <span style={{ color:"#4ade80" }}>✅ {knownSet.size}</span>
              <span style={{ color:"#f472b6" }}>📌 {learningSet.size}</span>
              {dueCount>0 && <span style={{ color:"#f472b6", fontWeight:700 }}>🔁 {dueCount}</span>}
              {sb.url ? (
                <button onClick={doManualSync} title={lastSync ? "Sync lần cuối: " + lastSync.toLocaleTimeString("vi-VN") : "Chưa sync"}
                  style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, color: syncStatus==="ok"?"#4ade80":syncStatus==="syncing"?"#fbbf24":"#f87171", fontSize:".65rem", padding:"2px 7px", cursor:"pointer" }}>
                  {syncStatus==="syncing"?"⏳ sync":syncStatus==="ok"?"☁✓":"☁↻"}
                </button>
              ) : (
                <button onClick={()=>{ setSbForm({ url: localStorage.getItem("lx_sb_url")||"", key: localStorage.getItem("lx_sb_key")||"", syncId: localStorage.getItem("lx_syncid")||"" }); setShowSbSetup(true); }}
                  style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, color:"#5a4a6a", fontSize:".65rem", padding:"2px 7px", cursor:"pointer" }} title="Cài đặt đồng bộ">
                  ☁ Cài sync
                </button>
              )}
              {/* Always show settings gear when sb is configured so user can reconfigure */}
              {sb.url && (
                <button onClick={()=>{ setSbForm({ url: localStorage.getItem("lx_sb_url")||"", key: localStorage.getItem("lx_sb_key")||"", syncId: localStorage.getItem("lx_syncid")||"" }); setShowSbSetup(true); }}
                  style={{ background:"none", border:"1px solid rgba(255,255,255,.1)", borderRadius:6, color:"#4a3a5a", fontSize:".65rem", padding:"2px 7px", cursor:"pointer" }} title="Cài đặt lại sync">
                  ⚙
                </button>
              )}
            </div>
          </div>
          <div style={{ display:"flex", gap:".3rem", flexWrap:"wrap", marginBottom:".42rem", alignItems:"center" }}>
            {LEVELS.map(lv => (
              <button key={lv} className="lvbtn btn" onClick={() => setLevelFilter(lv)} style={{
                borderColor: lv==="All" ? (levelFilter===lv?"#a78bfa":"rgba(255,255,255,.13)") : (LC[lv]+(levelFilter===lv?"ff":"44")),
                color: levelFilter===lv ? (lv==="All"?"#a78bfa":LC[lv]) : "#5a4a6a",
                background: levelFilter===lv ? (lv==="All"?"rgba(167,139,250,.14)":LC[lv]+"16") : "transparent",
              }}>{lv}</button>
            ))}
            <span style={{ fontSize:".68rem", color:"#3a2a4a", marginLeft:"auto" }}>{filtered.length} từ</span>
          </div>
          <div style={{ display:"flex", gap:".3rem", overflowX:"auto", paddingBottom:"2px" }}>
            {Object.values(MODES).map(m => (
              <button key={m} className={`btn ntab ${mode===m?"on":"off"}`} onClick={() => { setMode(m); setFlipped(false); setListenQueue([]); setListenDone(false); setListenInput(""); setListenChecked(false); }}>
                {modeLabel[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:".5rem 1.1rem 0" }}>
        <div style={{ display:"flex", gap:"2px" }}>
          {allWords.map(v => {
            const d = srsData[v.word];
            const col = knownSet.has(v.word) && d?.interval>=7 ? "#fbbf24" : knownSet.has(v.word) ? "#4ade80" : learningSet.has(v.word) ? "#f472b6" : "rgba(255,255,255,.07)";
            return <div key={v.word} style={{ flex:1, height:3, borderRadius:2, background:col, transition:"background .4s" }} />;
          })}
        </div>
        <div style={{ display:"flex", gap:"1rem", marginTop:".22rem", fontSize:".63rem", color:"#3a2a4a" }}>
          <span style={{ color:"#fbbf24" }}>★ {masteredCount} thành thạo</span>
          <span style={{ color:"#4ade80" }}>● {knownSet.size} đã nhớ</span>
          <span style={{ color:"#f472b6" }}>● {learningSet.size} đang học</span>
        </div>
      </div>

      <div style={{ maxWidth:720, margin:"0 auto", padding:".9rem 1.1rem 3rem" }}>

        {/* ══ FLASHCARD ══ */}
        {mode===MODES.FLASHCARD && card && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:".75rem", color:"#5a4a6a", marginBottom:".55rem" }}>
              <span>{cardIdx+1} / {filtered.length}</span>
              <span>🔥 Streak: <b style={{ color:streak>0?"#fbbf24":"#5a4a6a" }}>{streak}</b></span>
              {srsData[card.word]?.nextReview && <span>🔁 {new Date(srsData[card.word].nextReview).toLocaleDateString("vi-VN")}</span>}
            </div>
            <div className="card3d" style={{ height:295, marginBottom:".9rem" }} onClick={() => setFlipped(f => !f)}>
              <div className={`ci ${flipped?"flipped":""}`}>
                <div className="cf" style={{ background:"linear-gradient(145deg,#1c1035,#251545)", border:"1px solid rgba(167,139,250,.2)", boxShadow:"0 25px 65px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.05)" }}>
                  <div style={{ position:"absolute", top:13, left:14, fontSize:".65rem", color:"#a78bfa55", letterSpacing:".1em", textTransform:"uppercase" }}>{card.type}</div>
                  <div style={{ position:"absolute", top:13, right:14, fontSize:".65rem", padding:"2px 9px", borderRadius:999, background:LC[card.level]+"1e", color:LC[card.level], border:`1px solid ${LC[card.level]}3a` }}>{card.level}</div>
                  {card.custom && <div style={{ position:"absolute", top:13, right:60, fontSize:".58rem", color:"#fbbf24", opacity:.65 }}>✦</div>}
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.7rem", fontWeight:900, color:"#f5f0ff", letterSpacing:"-.02em", textAlign:"center", lineHeight:1.1 }}>{card.word}</div>
                  <div style={{ color:"#a78bfa", fontSize:".97rem", marginTop:".38rem", fontStyle:"italic", fontFamily:"'Crimson Pro',serif", opacity:.8 }}>{card.phonetic}</div>
                  <button className="spkbtn btn" style={{ marginTop:".75rem" }} onClick={e => { e.stopPropagation(); speak(card.word); }}>🔊 Phát âm</button>
                  <div style={{ position:"absolute", bottom:12, fontSize:".68rem", color:"#3a2a5a" }}>chạm để xem nghĩa ↓</div>
                </div>
                <div className="cf cb" style={{ background:"linear-gradient(145deg,#0d1d35,#0e2545)", border:"1px solid rgba(96,165,250,.2)", boxShadow:"0 25px 65px rgba(0,0,0,.55)", textAlign:"center" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.45rem", fontWeight:700, color:"#93c5fd", marginBottom:".3rem" }}>{card.word}</div>
                  <div style={{ fontSize:"1.15rem", color:"#e8e0f0", fontFamily:"'Crimson Pro',serif", marginBottom:".4rem", lineHeight:1.5, fontWeight:600 }}>{card.meaning}</div>
                  {card.meaningEn && <div style={{ fontSize:".88rem", color:"#93c5fd88", fontFamily:"'Crimson Pro',serif", marginBottom:".6rem", fontStyle:"italic", maxWidth:340 }}>{card.meaningEn}</div>}
                  <div style={{ width:36, height:1, background:"rgba(96,165,250,.25)", margin:"0 auto .6rem" }} />
                  <div style={{ fontStyle:"italic", color:"#93c5fd", fontFamily:"'Crimson Pro',serif", fontSize:".92rem", opacity:.8, maxWidth:340, lineHeight:1.5 }}>"{card.example}"</div>
                  <button className="spkbtn btn" style={{ marginTop:".75rem" }} onClick={e => { e.stopPropagation(); speak(card.example, 0.8); }}>🔊 Câu ví dụ</button>
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:".7rem", justifyContent:"center" }}>
              {[["😅 Chưa nhớ","learning","rgba(248,113,113,.1)","rgba(248,113,113,.28)","#fca5a5"],
                ["✅ Đã nhớ!","known","rgba(74,222,128,.1)","rgba(74,222,128,.28)","#86efac"]].map(([label,dir,bg,bc,col]) => (
                <button key={dir} className="btn" onClick={() => doFlashcard(dir)}
                  style={{ flex:1, maxWidth:165, padding:".82rem", borderRadius:14, background:bg, border:`1.5px solid ${bc}`, color:col, fontSize:".93rem" }}>{label}</button>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"center", gap:".5rem", marginTop:".6rem" }}>
              {[["← Trước",()=>{setFlipped(false);setCardIdx(i=>(i-1+filtered.length)%filtered.length);}],
                ["🔀 Random",()=>{setFlipped(false);setCardIdx(Math.floor(Math.random()*filtered.length));}],
                ["Tiếp →",()=>{setFlipped(false);setCardIdx(i=>(i+1)%filtered.length);}]].map(([l,fn]) => (
                <button key={l} className="btn" onClick={fn}
                  style={{ padding:".42rem .85rem", borderRadius:10, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"#7a6a8a", fontSize:".8rem" }}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {/* ══ QUIZ ══ */}
        {mode===MODES.QUIZ && (
          <div>
            {!quizQ ? (
              <div style={{ textAlign:"center", padding:"3rem" }}>
                <button className="btn" onClick={startQuiz} style={{ padding:".88rem 2.5rem", borderRadius:14, background:"linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", fontSize:"1.1rem", border:"none" }}>🧠 Bắt đầu Quiz</button>
              </div>
            ) : quizDone ? (
              <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
                <div style={{ fontSize:"3.8rem", marginBottom:".7rem" }}>{quizScore.c>=9?"🏆":quizScore.c>=6?"🎯":"💪"}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.8rem", fontWeight:900, background:"linear-gradient(90deg,#a78bfa,#ec4899)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{quizScore.c} / {quizScore.t}</div>
                <div style={{ color:"#8a7a9a", marginTop:".5rem", fontFamily:"'Crimson Pro',serif", fontSize:"1.05rem" }}>
                  {quizScore.c>=quizScore.t*.85?"Xuất sắc! 🌟":quizScore.c>=quizScore.t*.6?"Tốt lắm! 💪":"Luyện thêm là được! 🔥"}
                </div>
                <button className="btn" onClick={startQuiz} style={{ marginTop:"1.4rem", padding:".72rem 2rem", borderRadius:12, background:"linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", fontSize:".98rem", border:"none" }}>🔄 Làm lại</button>
              </div>
            ) : (
              <>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:".75rem", color:"#5a4a6a", marginBottom:".7rem" }}>
                  <span>Đã trả lời: {quizScore.t} / {quizQ.length}</span>
                  <span style={{ color:"#4ade80" }}>✅ {quizScore.c} đúng</span>
                </div>
                {quizQ.map((q,qi) => (
                  <div key={qi} style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(255,255,255,.055)", borderRadius:16, padding:"1.05rem", marginBottom:".82rem", opacity:q.selected?.8:1 }}>
                    <div style={{ fontSize:".72rem", color:"#5a4a6a", marginBottom:".28rem" }}>Câu {qi+1}</div>
                    <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.18rem", fontWeight:700, color:"#f0eaff", marginBottom:".22rem" }}>{q.item.meaning}</div>
                    <div style={{ fontStyle:"italic", color:"#5a4a6a", fontFamily:"'Crimson Pro',serif", fontSize:".85rem", marginBottom:".65rem" }}>"{q.item.example.replace(new RegExp(q.item.word,"gi"),"______")}"</div>
                    {q.options.map(opt => {
                      let cls = "qopt";
                      if (q.selected) { if (opt.word===q.item.word) cls+=" ok"; else if (opt.word===q.selected) cls+=" no"; }
                      return <button key={opt.word} className={cls} disabled={!!q.selected} onClick={() => doQuiz(qi,opt.word)}><b>{opt.word}</b> <span style={{ opacity:.4, fontSize:".8rem" }}>{opt.phonetic}</span></button>;
                    })}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══ SRS ══ */}
        {mode===MODES.SRS && (
          <div>
            {srsDone || (srsQueue.length===0 && !srsCurrent) ? (
              <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
                <div style={{ fontSize:"3.5rem", marginBottom:".7rem" }}>🎉</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.55rem", fontWeight:700, color:"#f0eaff", marginBottom:".35rem" }}>{srsSess.r>0?"Phiên ôn tập hoàn thành!":"Không có từ cần ôn hôm nay!"}</div>
                {srsSess.r>0 && <div style={{ color:"#7a6a8a", fontFamily:"'Crimson Pro',serif", fontSize:".98rem", marginBottom:".5rem" }}>Đã ôn {srsSess.r} từ · ✅ {srsSess.c}/{srsSess.r} đúng</div>}
                <div style={{ color:"#5a4a6a", fontSize:".83rem", fontFamily:"'Crimson Pro',serif", marginBottom:"1.4rem" }}>{dueCount>0?`Còn ${dueCount} từ.`:"Quay lại ngày mai 📅"}</div>
                <button className="btn" onClick={buildSrs} style={{ padding:".72rem 2rem", borderRadius:12, background:"linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", fontSize:".98rem", border:"none" }}>🔄 Ôn lại</button>
              </div>
            ) : srsCurrent ? (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:".75rem", color:"#5a4a6a", marginBottom:".65rem" }}>
                  <span>Còn lại: {srsQueue.length}</span><span>Đã ôn: {srsSess.r} · ✅ {srsSess.c}</span>
                </div>
                <div className="card3d" style={{ height:285, marginBottom:".9rem" }} onClick={() => setSrsFlipped(f=>!f)}>
                  <div className={`ci ${srsFlipped?"flipped":""}`}>
                    <div className="cf" style={{ background:"linear-gradient(145deg,#1a1030,#221440)", border:"1px solid rgba(167,139,250,.2)", boxShadow:"0 20px 55px rgba(0,0,0,.5)" }}>
                      <div style={{ position:"absolute", top:13, right:14, fontSize:".65rem", padding:"2px 9px", borderRadius:999, background:LC[srsCurrent.level]+"1e", color:LC[srsCurrent.level], border:`1px solid ${LC[srsCurrent.level]}3a` }}>{srsCurrent.level}</div>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"2.7rem", fontWeight:900, color:"#f5f0ff", textAlign:"center" }}>{srsCurrent.word}</div>
                      <div style={{ color:"#a78bfa", fontStyle:"italic", fontFamily:"'Crimson Pro',serif", marginTop:".38rem", opacity:.78 }}>{srsCurrent.phonetic}</div>
                      <button className="spkbtn btn" style={{ marginTop:".75rem" }} onClick={e=>{e.stopPropagation();speak(srsCurrent.word);}}>🔊 Phát âm</button>
                      <div style={{ position:"absolute", bottom:12, fontSize:".68rem", color:"#3a2a5a" }}>chạm để kiểm tra ↓</div>
                    </div>
                    <div className="cf cb" style={{ background:"linear-gradient(145deg,#0d1e35,#0a1a2e)", border:"1px solid rgba(96,165,250,.2)", textAlign:"center" }}>
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.45rem", fontWeight:700, color:"#93c5fd", marginBottom:".35rem" }}>{srsCurrent.word}</div>
                      <div style={{ fontSize:"1.18rem", fontFamily:"'Crimson Pro',serif", marginBottom:".6rem", color:"#e8e0f0", fontWeight:600 }}>{srsCurrent.meaning}</div>
                      <div style={{ fontStyle:"italic", color:"#93c5fd77", fontFamily:"'Crimson Pro',serif", fontSize:".88rem", maxWidth:320 }}>"{srsCurrent.example}"</div>
                      {srsData[srsCurrent.word]?.totalReviews && <div style={{ marginTop:".7rem", fontSize:".65rem", color:"#3a2a5a" }}>Đã ôn {srsData[srsCurrent.word].totalReviews} lần · {srsData[srsCurrent.word].interval}d</div>}
                    </div>
                  </div>
                </div>
                {!srsFlipped ? (
                  <button className="btn" onClick={()=>setSrsFlipped(true)} style={{ width:"100%", padding:".82rem", borderRadius:14, background:"rgba(167,139,250,.1)", border:"1.5px solid rgba(167,139,250,.22)", color:"#c4b5fd", fontSize:".98rem" }}>Xem đáp án</button>
                ) : (
                  <div>
                    <div style={{ textAlign:"center", fontSize:".77rem", color:"#5a4a6a", marginBottom:".55rem" }}>Bạn nhớ từ này như thế nào?</div>
                    <div style={{ display:"flex", gap:".55rem" }}>
                      {[[0,"😰 Quên","rgba(248,113,113,.1)","rgba(248,113,113,.28)","#fca5a5"],
                        [1,"🤔 Khó","rgba(251,191,36,.1)","rgba(251,191,36,.28)","#fde68a"],
                        [2,"😊 Dễ","rgba(74,222,128,.1)","rgba(74,222,128,.28)","#86efac"]].map(([q,label,bg,bc,col]) => (
                        <button key={q} className="srsbtn btn" onClick={()=>doSrs(q)} style={{ flex:1, background:bg, borderColor:bc, color:col, textAlign:"center" }}>
                          {label}<br/><span style={{ fontSize:".68rem", opacity:.55 }}>+{q===0?1:q===1?Math.max(1,Math.round((srsData[srsCurrent.word]?.interval||1)*1.2)):Math.round((srsData[srsCurrent.word]?.interval||1)*(srsData[srsCurrent.word]?.easeFactor||2.5))}d</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : <div style={{ textAlign:"center", padding:"3rem", color:"#5a4a6a" }}>⏳ Đang tải...</div>}
          </div>
        )}


        {/* ══ FILL-IN-THE-BLANK ══ */}
        {mode===MODES.FILL && (
          <div>
            {!fillPassage && (
              <div>
                {/* Info card */}
                <div style={{ background:"linear-gradient(145deg,rgba(251,191,36,.06),rgba(167,139,250,.04))", border:"1px solid rgba(251,191,36,.15)", borderRadius:18, padding:"1.2rem", marginBottom:"1rem" }}>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", fontWeight:700, color:"#fde68a", marginBottom:".3rem" }}>✍️ Điền vào chỗ trống</div>
                  <div style={{ fontSize:".85rem", color:"#9a8a6a", fontFamily:"'Crimson Pro',serif", lineHeight:1.6 }}>
                    AI sẽ chọn <b style={{color:"#fbbf24"}}>3–5 từ</b> từ danh sách đang học của bạn và tạo một đoạn văn tự nhiên. Bạn điền từ thích hợp vào chỗ trống dựa trên ngữ cảnh.
                  </div>
                  <div style={{ marginTop:".8rem", fontSize:".78rem", color:"#5a4a6a" }}>
                    Hiện có <b style={{color:"#fbbf24"}}>{allWords.length}</b> từ trong kho · Đang học: <b style={{color:"#f472b6"}}>{learningSet.size}</b>
                  </div>
                </div>

                {fillErr && <div style={{ padding:".6rem .9rem", borderRadius:10, background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.2)", color:"#fca5a5", fontSize:".83rem", marginBottom:".8rem" }}>⚠ {fillErr}</div>}

                <div style={{ display:"flex", gap:".7rem" }}>
                  <button className="btn" disabled={fillLoading} onClick={async()=>{
                    setFillErr(""); setFillLoading(true); setFillPassage(null); setFillChecked(false);
                    try {
                      // Prefer learning words, fall back to all
                      const pool = learningSet.size >= 3
                        ? allWords.filter(w=>learningSet.has(w.word))
                        : allWords;
                      const count = Math.min(5, Math.max(3, Math.floor(Math.random()*3)+3));
                      const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
                      if (picked.length < 2) { setFillErr("Cần ít nhất 2 từ trong danh sách. Hãy học thêm từ!"); setFillLoading(false); return; }
                      const result = await generatePassage(picked, apiKey);
                      setFillPassage(result);
                      setFillAnswers(Array(result.blanks.length).fill(""));
                      setFillChecked(false);
                    } catch(e) { setFillErr("Lỗi: " + e.message); }
                    finally { setFillLoading(false); }
                  }}
                  style={{ flex:1, padding:".9rem", borderRadius:14, background: fillLoading ? "rgba(251,191,36,.2)" : "linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#1a0a00", border:"none", fontWeight:700, fontSize:"1rem" }}>
                    {fillLoading ? "⏳ Đang tạo đoạn văn..." : "🎲 Tạo bài mới"}
                  </button>
                </div>

                {fillLoading && (
                  <div style={{ marginTop:"1.2rem" }}>
                    {[95,70,85,55,80,45].map((w,i)=>(
                      <div key={i} className="shimmer" style={{ height:14, borderRadius:7, marginBottom:10, width:`${w}%` }} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {fillPassage && (
              <div className="fade-in">
                {/* Topic badge */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:".8rem" }}>
                  <div style={{ fontSize:".75rem", color:"#fbbf24", background:"rgba(251,191,36,.1)", border:"1px solid rgba(251,191,36,.2)", borderRadius:999, padding:".2rem .8rem" }}>
                    📝 {fillPassage.topic}
                  </div>
                  <div style={{ fontSize:".72rem", color:"#5a4a6a" }}>{fillPassage.blanks.length} chỗ trống</div>
                </div>

                {/* Passage with inline inputs */}
                <div style={{ background:"rgba(255,255,255,.025)", border:"1px solid rgba(251,191,36,.12)", borderRadius:18, padding:"1.3rem 1.4rem", marginBottom:"1rem" }}>
                  <p className="passage-text">
                    {fillPassage.passage.split(/(\[BLANK_\d+\])/g).map((part, i) => {
                      const m = part.match(/\[BLANK_(\d+)\]/);
                      if (!m) return <span key={i}>{part}</span>;
                      const idx = parseInt(m[1]) - 1;
                      const ans = fillAnswers[idx] || "";
                      const correct = fillChecked && ans.trim().toLowerCase() === fillPassage.blanks[idx]?.toLowerCase();
                      const wrong = fillChecked && ans.trim() !== "" && !correct;
                      const showAnswer = fillChecked && !correct;
                      return (
                        <span key={i} style={{ display:"inline-block", verticalAlign:"middle" }}>
                          <input
                            className={`blank-input ${fillChecked ? (correct?"correct":"wrong") : ""}`}
                            value={ans}
                            disabled={fillChecked}
                            placeholder={`(${idx+1})`}
                            style={{ width: Math.max(80, (fillPassage.blanks[idx]?.length||4)*12+20) + "px" }}
                            onChange={e=>{
                              const a = [...fillAnswers];
                              a[idx] = e.target.value;
                              setFillAnswers(a);
                            }}
                            onKeyDown={e=>{
                              if(e.key==="Enter"){
                                const next = document.querySelectorAll(".blank-input")[idx+1];
                                if(next) next.focus();
                              }
                            }}
                          />
                          {showAnswer && (
                            <span style={{ fontSize:".75rem", color:"#4ade80", marginLeft:"3px", fontFamily:"'Crimson Pro',serif", fontStyle:"italic" }}>
                              ✓{fillPassage.blanks[idx]}
                            </span>
                          )}
                        </span>
                      );
                    })}
                  </p>
                </div>

                {/* Hints — meanings */}
                <div style={{ background:"rgba(167,139,250,.04)", border:"1px solid rgba(167,139,250,.1)", borderRadius:14, padding:".9rem 1rem", marginBottom:"1rem" }}>
                  <div style={{ fontSize:".7rem", color:"#6a5a7a", marginBottom:".5rem", letterSpacing:".06em" }}>💡 GỢI Ý — nghĩa của các từ cần điền</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:".4rem" }}>
                    {fillPassage.blanks.map((w,i) => (
                      <div key={i} style={{ background:"rgba(167,139,250,.08)", border:"1px solid rgba(167,139,250,.15)", borderRadius:8, padding:".25rem .7rem", fontSize:".82rem", fontFamily:"'Crimson Pro',serif", color:"#c4b5fd" }}>
                        <b>({i+1})</b> {fillPassage.meanings[i] || "?"}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Result after check */}
                {fillChecked && (
                  <div className="fade-in" style={{ textAlign:"center", padding:".8rem", borderRadius:14, marginBottom:"1rem",
                    background: fillAnswers.filter((a,i)=>a.trim().toLowerCase()===fillPassage.blanks[i]?.toLowerCase()).length === fillPassage.blanks.length
                      ? "rgba(74,222,128,.1)" : "rgba(167,139,250,.08)",
                    border: "1px solid rgba(167,139,250,.15)" }}>
                    {(() => {
                      const correct = fillAnswers.filter((a,i)=>a.trim().toLowerCase()===fillPassage.blanks[i]?.toLowerCase()).length;
                      const total = fillPassage.blanks.length;
                      return <>
                        <div style={{ fontSize:"1.8rem", marginBottom:".2rem" }}>{correct===total?"🎉":correct>=total*.6?"👍":"📚"}</div>
                        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:700, color:correct===total?"#4ade80":"#c4b5fd" }}>{correct} / {total} đúng</div>
                        <div style={{ fontSize:".82rem", color:"#7a6a8a", marginTop:".2rem", fontFamily:"'Crimson Pro',serif" }}>
                          {correct===total?"Hoàn hảo! Bạn nắm vững các từ này 🌟":correct>=total*.6?"Tốt! Xem lại những từ sai nhé":"Đừng nản, luyện thêm là được! 💪"}
                        </div>
                      </>;
                    })()}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display:"flex", gap:".7rem" }}>
                  {!fillChecked ? (
                    <button className="btn" onClick={()=>setFillChecked(true)}
                      style={{ flex:1, padding:".85rem", borderRadius:14, background:"linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", border:"none", fontWeight:700, fontSize:".98rem" }}>
                      ✅ Kiểm tra đáp án
                    </button>
                  ) : (
                    <button className="btn" onClick={async()=>{
                      setFillPassage(null); setFillAnswers([]); setFillChecked(false); setFillErr("");
                      setFillLoading(true);
                      try {
                        const pool = learningSet.size >= 3 ? allWords.filter(w=>learningSet.has(w.word)) : allWords;
                        const count = Math.min(5, Math.max(3, Math.floor(Math.random()*3)+3));
                        const picked = shuffle(pool).slice(0, Math.min(count, pool.length));
                        const result = await generatePassage(picked, apiKey);
                        setFillPassage(result);
                        setFillAnswers(Array(result.blanks.length).fill(""));
                      } catch(e) { setFillErr("Lỗi: " + e.message); }
                      finally { setFillLoading(false); }
                    }}
                    style={{ flex:1, padding:".85rem", borderRadius:14, background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#1a0a00", border:"none", fontWeight:700, fontSize:".98rem" }}>
                      🎲 Bài tiếp theo
                    </button>
                  )}
                  <button className="btn" onClick={()=>{ setFillPassage(null); setFillAnswers([]); setFillChecked(false); }}
                    style={{ padding:".85rem 1rem", borderRadius:14, background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", color:"#7a6a8a", fontSize:".85rem" }}>
                    ✕ Bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


        {/* ══ LISTEN: GUESS THE WORD ══ */}
        {mode===MODES.LISTEN_DEF && (() => {
          const pool = filtered.length >= 1 ? filtered : allWords;
          const current = listenQueue[listenIdx];
          const normalize = s => s.trim().toLowerCase().replace(/[^a-z\s]/gi,"");

          const buildQueue = () => {
            const q = shuffle(pool).slice(0, Math.min(15, pool.length));
            setListenQueue(q); setListenIdx(0); setListenInput("");
            setListenChecked(false); setListenScore({c:0,t:0}); setListenDone(false);
          };

          const playDef = (word) => {
            if(!word) return;
            setIsSpeaking(true);
            const text = word.meaningEn || word.meaning;
            speak(text, 0.82);
            const est = Math.max(1800, text.length * 65);
            setTimeout(() => setIsSpeaking(false), est);
          };

          const handleCheck = () => {
            if(!current || !listenInput.trim()) return;
            setListenChecked(true);
            const ok = normalize(listenInput) === normalize(current.word);
            setListenScore(p => ({ c: p.c+(ok?1:0), t: p.t+1 }));
          };

          const handleNext = () => {
            if(listenIdx+1 >= listenQueue.length) { setListenDone(true); return; }
            setListenIdx(i=>i+1); setListenInput(""); setListenChecked(false);
          };

          if(listenQueue.length===0) return (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{fontSize:"3rem",marginBottom:".8rem"}}>👂</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700,color:"#f0eaff",marginBottom:".5rem"}}>Nghe định nghĩa → Đoán từ</div>
              <div style={{fontSize:".9rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,marginBottom:"1.4rem",maxWidth:380,margin:"0 auto 1.4rem"}}>
                Bạn sẽ nghe định nghĩa tiếng Anh của từ, sau đó gõ từ đó vào ô trả lời.
              </div>
              <button className="btn" onClick={buildQueue}
                style={{padding:".88rem 2.5rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",fontSize:"1rem",border:"none",fontWeight:700}}>
                🎧 Bắt đầu
              </button>
            </div>
          );

          if(listenDone) return (
            <div style={{textAlign:"center",padding:"2.5rem 1rem"}}>
              <div style={{fontSize:"3.5rem",marginBottom:".7rem"}}>{listenScore.c>=listenScore.t*.85?"🏆":listenScore.c>=listenScore.t*.6?"🎯":"💪"}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.5rem",fontWeight:900,background:"linear-gradient(90deg,#a78bfa,#ec4899)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{listenScore.c} / {listenScore.t}</div>
              <div style={{color:"#8a7a9a",marginTop:".5rem",fontFamily:"'Crimson Pro',serif",fontSize:"1rem"}}>
                {listenScore.c>=listenScore.t*.85?"Tai nghe tuyệt vời! 🌟":listenScore.c>=listenScore.t*.6?"Khá tốt, luyện thêm nhé 💪":"Tiếp tục cải thiện! 🔥"}
              </div>
              <button className="btn" onClick={buildQueue}
                style={{marginTop:"1.4rem",padding:".75rem 2rem",borderRadius:12,background:"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",fontSize:".98rem",border:"none"}}>
                🔄 Chơi lại
              </button>
            </div>
          );

          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".75rem",color:"#5a4a6a",marginBottom:".7rem"}}>
                <span>Câu {listenIdx+1} / {listenQueue.length}</span>
                <span style={{color:"#4ade80"}}>✅ {listenScore.c} đúng</span>
              </div>

              {/* Main card */}
              <div style={{background:"linear-gradient(145deg,#1a1030,#0e1a2e)",border:"1px solid rgba(167,139,250,.2)",borderRadius:22,padding:"1.8rem",marginBottom:"1rem",textAlign:"center"}}>
                <div style={{fontSize:".72rem",color:"#5a4a6a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:"1rem"}}>Định nghĩa tiếng Anh là gì?</div>

                {/* Play button */}
                <button className={`btn ${isSpeaking?"speak-pulse":""}`}
                  onClick={()=>playDef(current)}
                  style={{width:80,height:80,borderRadius:"50%",background:isSpeaking?"rgba(167,139,250,.35)":"linear-gradient(135deg,rgba(167,139,250,.25),rgba(236,72,153,.2))",border:"2px solid rgba(167,139,250,.4)",fontSize:"2rem",cursor:"pointer",marginBottom:"1rem",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1rem"}}>
                  {isSpeaking ? "🔊" : "▶️"}
                </button>
                <div style={{fontSize:".82rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif",marginBottom:"1.2rem"}}>
                  {isSpeaking ? "Đang phát..." : "Nhấn để nghe định nghĩa"}
                </div>

                {/* Speed controls */}
                <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginBottom:"1.4rem"}}>
                  {[[0.6,"🐢 Chậm"],[0.85,"▶ Bình thường"],[1.1,"🐇 Nhanh"]].map(([r,label])=>(
                    <button key={r} className="btn" onClick={()=>{setIsSpeaking(true);const t=current?.meaningEn||current?.meaning||"";speak(t,r);setTimeout(()=>setIsSpeaking(false),Math.max(1800,t.length*65));}}
                      style={{padding:".3rem .7rem",borderRadius:999,background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.2)",color:"#c4b5fd",fontSize:".72rem"}}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Answer input */}
                <input className={`listen-input ${listenChecked?(normalize(listenInput)===normalize(current.word)?"correct":"wrong"):""}`}
                  placeholder="Gõ từ tiếng Anh..."
                  value={listenInput}
                  disabled={listenChecked}
                  onChange={e=>setListenInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"){listenChecked?handleNext():handleCheck();}}}
                  autoFocus
                />

                {/* Result */}
                {listenChecked && (
                  <div className="fade-in" style={{marginTop:"1rem"}}>
                    {normalize(listenInput)===normalize(current.word) ? (
                      <div style={{color:"#4ade80",fontSize:"1rem",fontFamily:"'Crimson Pro',serif"}}>✅ Chính xác!</div>
                    ) : (
                      <div>
                        <div style={{color:"#f87171",fontSize:".9rem",fontFamily:"'Crimson Pro',serif"}}>❌ Sai rồi</div>
                        <div style={{marginTop:".4rem",fontSize:"1.1rem",fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#f0eaff"}}>
                          Đáp án: <span style={{color:"#a78bfa"}}>{current.word}</span>
                          <button className="spkbtn btn" style={{marginLeft:".5rem"}} onClick={()=>speak(current.word)}>🔊</button>
                        </div>
                        <div style={{fontSize:".85rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>{current.phonetic} · {current.meaning}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hint: show Vietnamese meaning if stuck */}
              {!listenChecked && (
                <details style={{marginBottom:"1rem"}}>
                  <summary style={{fontSize:".78rem",color:"#5a4a6a",cursor:"pointer",padding:".4rem .8rem",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.07)"}}>
                    💡 Xem gợi ý (nghĩa tiếng Việt)
                  </summary>
                  <div style={{padding:".6rem .8rem",fontSize:".9rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif",marginTop:".3rem"}}>
                    {current?.meaning}
                    <span style={{marginLeft:".6rem",fontSize:".78rem",color:"#5a4a6a"}}>{current?.phonetic}</span>
                  </div>
                </details>
              )}

              {/* Buttons */}
              <div style={{display:"flex",gap:".7rem"}}>
                {!listenChecked ? (
                  <button className="btn" onClick={handleCheck}
                    style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",border:"none",fontWeight:700,fontSize:".98rem"}}>
                    ✅ Kiểm tra
                  </button>
                ) : (
                  <button className="btn" onClick={handleNext}
                    style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:".98rem"}}>
                    {listenIdx+1>=listenQueue.length ? "🏁 Xem kết quả" : "Tiếp theo →"}
                  </button>
                )}
                <button className="btn" onClick={()=>{setListenQueue([]);setListenDone(false);}}
                  style={{padding:".85rem 1rem",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#7a6a8a",fontSize:".85rem"}}>
                  ↩
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══ DICTATION ══ */}
        {mode===MODES.DICTATION && (() => {
          const pool = filtered.length >= 1 ? filtered : allWords;
          const current = listenQueue[listenIdx];

          const normalize = s => s.trim().toLowerCase().replace(/['']/g,"'").replace(/\s+/g," ");

          // Word-level diff for result display
          const diffWords = (answer, correct) => {
            const aw = answer.trim().split(/\s+/);
            const cw = correct.trim().split(/\s+/);
            return cw.map((cWord, i) => {
              const aWord = aw[i] || "";
              const ok = aWord.toLowerCase().replace(/[^a-z']/g,"") === cWord.toLowerCase().replace(/[^a-z']/g,"");
              return {cWord, aWord, ok};
            });
          };

          const buildQueueD = () => {
            const q = shuffle(pool).slice(0, Math.min(12, pool.length));
            setListenQueue(q); setListenIdx(0); setListenInput("");
            setListenChecked(false); setListenScore({c:0,t:0}); setListenDone(false);
            setDictSentences({}); // reset AI sentence cache for new session
          };

          // Get the sentence to use: AI-generated if available, fallback to example
          const getActiveSentence = (w) => (w && dictSentences[w.word]) ? dictSentences[w.word] : (w ? w.example : "");

          const playSentence = (rate) => {
            if(!current) return;
            const sentence = getActiveSentence(current);
            setIsSpeaking(true);
            speak(sentence, rate||0.78);
            const est = Math.max(2000, sentence.length * 72);
            setTimeout(() => setIsSpeaking(false), est);
          };

          const genAISentence = async () => {
            if(!current || dictGenLoading) return;
            setDictGenLoading(true);
            try {
              const s = await generateDictationSentence(current, apiKey);
              setDictSentences(prev => ({...prev, [current.word]: s}));
            } catch(e) {
              // silently fail, keep using example
            } finally {
              setDictGenLoading(false);
            }
          };

          const handleCheckD = () => {
            if(!current || !listenInput.trim()) return;
            setListenChecked(true);
            const activeSentence = getActiveSentence(current);
            const ok = normalize(listenInput) === normalize(activeSentence);
            setListenScore(p => ({ c: p.c+(ok?1:0), t: p.t+1 }));
          };

          const handleNextD = () => {
            if(listenIdx+1 >= listenQueue.length) { setListenDone(true); return; }
            setListenIdx(i=>i+1); setListenInput(""); setListenChecked(false);
          };

          if(listenQueue.length===0) return (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{fontSize:"3rem",marginBottom:".8rem"}}>🎧</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700,color:"#f0eaff",marginBottom:".5rem"}}>Nghe & Chép chính tả</div>
              <div style={{fontSize:".9rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,marginBottom:"1.4rem",maxWidth:380,margin:"0 auto 1.4rem"}}>
                Nghe câu ví dụ chứa từ vựng cần học, sau đó gõ lại chính xác câu bạn nghe được.
              </div>
              <button className="btn" onClick={buildQueueD}
                style={{padding:".88rem 2.5rem",borderRadius:14,background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",fontSize:"1rem",border:"none",fontWeight:700}}>
                🎧 Bắt đầu
              </button>
            </div>
          );

          if(listenDone) return (
            <div style={{textAlign:"center",padding:"2.5rem 1rem"}}>
              <div style={{fontSize:"3.5rem",marginBottom:".7rem"}}>{listenScore.c>=listenScore.t*.85?"🏆":listenScore.c>=listenScore.t*.6?"🎯":"💪"}</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.5rem",fontWeight:900,background:"linear-gradient(90deg,#60a5fa,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{listenScore.c} / {listenScore.t}</div>
              <div style={{color:"#8a7a9a",marginTop:".5rem",fontFamily:"'Crimson Pro',serif",fontSize:"1rem"}}>
                {listenScore.c>=listenScore.t*.85?"Chính tả hoàn hảo! 🌟":listenScore.c>=listenScore.t*.6?"Khá tốt, luyện thêm nhé! 💪":"Cứ nghe lại nhiều lần là được! 🔥"}
              </div>
              <button className="btn" onClick={buildQueueD}
                style={{marginTop:"1.4rem",padding:".75rem 2rem",borderRadius:12,background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",fontSize:".98rem",border:"none"}}>
                🔄 Chơi lại
              </button>
            </div>
          );

          const activeSentence = getActiveSentence(current);
          const diffResult = listenChecked ? diffWords(listenInput, activeSentence) : null;
          const isFullyCorrect = listenChecked && normalize(listenInput) === normalize(activeSentence);

          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".75rem",color:"#5a4a6a",marginBottom:".7rem"}}>
                <span>Câu {listenIdx+1} / {listenQueue.length}</span>
                <span style={{color:"#4ade80"}}>✅ {listenScore.c} đúng</span>
              </div>

              {/* Card */}
              <div style={{background:"linear-gradient(145deg,#0d1a2e,#0e1535)",border:"1px solid rgba(96,165,250,.2)",borderRadius:22,padding:"1.8rem",marginBottom:"1rem",textAlign:"center"}}>
                <div style={{fontSize:".72rem",color:"#5a4a6a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:"1rem"}}>Nghe và gõ lại câu bạn nghe được</div>

                {/* Play button */}
                <button className={`btn ${isSpeaking?"speak-pulse":""}`}
                  onClick={()=>playSentence(0.78)}
                  style={{width:80,height:80,borderRadius:"50%",background:isSpeaking?"rgba(96,165,250,.35)":"linear-gradient(135deg,rgba(96,165,250,.25),rgba(129,140,248,.2))",border:"2px solid rgba(96,165,250,.4)",fontSize:"2rem",cursor:"pointer",margin:"0 auto 1rem",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {isSpeaking ? "🔊" : "▶️"}
                </button>
                <div style={{fontSize:".82rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif",marginBottom:".8rem"}}>
                  {isSpeaking ? "Đang phát..." : "Nhấn để nghe câu"}
                </div>

                {/* Speed controls */}
                <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginBottom:".8rem"}}>
                  {[[0.55,"🐢 Chậm"],[0.78,"▶ Bình thường"],[1.0,"🐇 Nhanh"]].map(([r,label])=>(
                    <button key={r} className="btn" onClick={()=>playSentence(r)}
                      style={{padding:".3rem .7rem",borderRadius:999,background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",color:"#93c5fd",fontSize:".72rem"}}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* AI sentence toggle */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:".6rem",marginBottom:"1.1rem"}}>
                  {dictSentences[current.word] ? (
                    <div style={{display:"flex",alignItems:"center",gap:".5rem",flexWrap:"wrap",justifyContent:"center"}}>
                      <span style={{fontSize:".7rem",background:"rgba(167,139,250,.15)",border:"1px solid rgba(167,139,250,.3)",borderRadius:999,padding:".15rem .65rem",color:"#c4b5fd"}}>✨ Câu AI — dài hơn, khó hơn</span>
                      <button className="btn" onClick={()=>setDictSentences(prev=>{const n={...prev};delete n[current.word];return n;})}
                        style={{fontSize:".68rem",color:"#5a4a6a",background:"none",border:"1px solid rgba(255,255,255,.08)",borderRadius:6,padding:".15rem .5rem"}}>
                        ↩ Dùng câu gốc
                      </button>
                    </div>
                  ) : (
                    <button className="btn" onClick={genAISentence} disabled={dictGenLoading}
                      style={{padding:".32rem .9rem",borderRadius:999,background:dictGenLoading?"rgba(167,139,250,.1)":"rgba(167,139,250,.18)",border:"1px solid rgba(167,139,250,.35)",color:"#c4b5fd",fontSize:".75rem"}}>
                      {dictGenLoading ? "⏳ Đang tạo câu..." : "✨ Tạo câu mới khó hơn (AI)"}
                    </button>
                  )}
                </div>

                {/* Textarea input */}
                <textarea className={`dict-input ${listenChecked?(isFullyCorrect?"correct":"wrong"):""}`}
                  placeholder="Gõ lại câu bạn nghe được..."
                  value={listenInput}
                  disabled={listenChecked}
                  rows={3}
                  onChange={e=>setListenInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey){listenChecked?handleNextD():handleCheckD();}}}
                />
                <div style={{fontSize:".65rem",color:"#3a2a4a",marginTop:".3rem"}}>Ctrl+Enter để {listenChecked?"tiếp theo":"kiểm tra"}</div>

                {/* Diff result */}
                {listenChecked && (
                  <div className="fade-in" style={{marginTop:"1rem",textAlign:"left"}}>
                    {isFullyCorrect ? (
                      <div style={{color:"#4ade80",fontSize:"1rem",fontFamily:"'Crimson Pro',serif",textAlign:"center"}}>🎉 Hoàn hảo! Chính xác 100%</div>
                    ) : (
                      <div>
                        <div style={{fontSize:".75rem",color:"#f87171",marginBottom:".5rem"}}>❌ Chưa chính xác — đoạn đỏ là chỗ sai:</div>
                        <div style={{background:"rgba(0,0,0,.3)",borderRadius:10,padding:".8rem 1rem",fontFamily:"'Crimson Pro',serif",fontSize:"1rem",lineHeight:1.8}}>
                          {diffResult.map((d,i)=>(
                            <span key={i}>
                              {d.ok
                                ? <span className="diff-correct">{d.cWord} </span>
                                : <span>
                                    <span className="diff-wrong">{d.aWord||"___"}</span>
                                    <span className="diff-missing"> ({d.cWord}) </span>
                                  </span>
                              }
                            </span>
                          ))}
                        </div>
                        <div style={{marginTop:".6rem",fontSize:".78rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif"}}>
                          Từ trong câu: <b style={{color:"#93c5fd"}}>{current.word}</b>
                          <button className="spkbtn btn" style={{marginLeft:".5rem"}} onClick={()=>speak(getActiveSentence(current), 0.7)}>🔊 Nghe lại</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Hint */}
              {!listenChecked && (
                <details style={{marginBottom:"1rem"}}>
                  <summary style={{fontSize:".78rem",color:"#5a4a6a",cursor:"pointer",padding:".4rem .8rem",background:"rgba(255,255,255,.03)",borderRadius:8,border:"1px solid rgba(255,255,255,.07)"}}>
                    💡 Gợi ý (từ chính trong câu)
                  </summary>
                  <div style={{padding:".6rem .8rem",fontSize:".9rem",color:"#93c5fd",fontFamily:"'Crimson Pro',serif",marginTop:".3rem"}}>
                    <b>{current?.word}</b> {current?.phonetic} — {current?.meaning}
                  </div>
                </details>
              )}

              {/* Buttons */}
              <div style={{display:"flex",gap:".7rem"}}>
                {!listenChecked ? (
                  <button className="btn" onClick={handleCheckD}
                    style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:".98rem"}}>
                    ✅ Kiểm tra
                  </button>
                ) : (
                  <button className="btn" onClick={handleNextD}
                    style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:".98rem"}}>
                    {listenIdx+1>=listenQueue.length ? "🏁 Xem kết quả" : "Tiếp theo →"}
                  </button>
                )}
                <button className="btn" onClick={()=>{setListenQueue([]);setListenDone(false);}}
                  style={{padding:".85rem 1rem",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#7a6a8a",fontSize:".85rem"}}>
                  ↩
                </button>
              </div>
            </div>
          );
        })()}


        {/* ══ WRITING PRACTICE ══ */}
        {mode===MODES.WRITING && (() => {
          const pool = filtered.length >= 1 ? filtered : allWords;

          const pickWord = () => {
            // Prefer learning words for more targeted practice
            const priority = pool.filter(w => learningSet.has(w.word));
            const source = priority.length > 0 ? priority : pool;
            const w = source[Math.floor(Math.random() * source.length)];
            setWritingWord(w);
            setWritingInput("");
            setWritingResult(null);
          };

          const handleSubmit = async () => {
            if (!writingInput.trim() || writingLoading || !writingWord) return;
            setWritingLoading(true);
            try {
              const result = await checkWriting(writingWord, writingInput.trim(), apiKey);
              setWritingResult(result);
              setWritingHistory(h => [{ word: writingWord.word, sentence: writingInput.trim(), score: result.overallScore, ts: Date.now() }, ...h.slice(0, 9)]);
            } catch(e) {
              setWritingResult({ error: e.message });
            } finally {
              setWritingLoading(false);
            }
          };

          const scoreColor = (s) => s >= 8 ? "#4ade80" : s >= 5 ? "#fbbf24" : "#f87171";
          const scoreLabel = (s) => s >= 9 ? "Xuất sắc 🌟" : s >= 7 ? "Tốt 👍" : s >= 5 ? "Khá 💪" : "Cần cải thiện 📚";

          return (
            <div>
              {/* Header card */}
              <div style={{background:"linear-gradient(145deg,rgba(244,114,182,.07),rgba(167,139,250,.05))",border:"1px solid rgba(244,114,182,.18)",borderRadius:20,padding:"1.1rem 1.2rem",marginBottom:"1rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#fda4af",marginBottom:".25rem"}}>✏️ Luyện Writing</div>
                <div style={{fontSize:".83rem",color:"#9a7a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                  Đặt câu với từ cho sẵn. AI sẽ chấm điểm, sửa lỗi và đưa ra bài học cụ thể.
                </div>
              </div>



              {/* Word to use */}
              {!writingWord ? (
                <div style={{textAlign:"center",padding:"1.5rem 1rem"}}>
                  <div style={{fontSize:"2.5rem",marginBottom:".8rem"}}>✏️</div>
                  <button className="btn" onClick={pickWord}
                    style={{padding:".9rem 2.5rem",borderRadius:14,background:"linear-gradient(135deg,#f472b6,#a78bfa)",color:"white",fontSize:"1rem",border:"none",fontWeight:700}}>
                    🎯 Chọn từ để luyện
                  </button>
                </div>
              ) : (
                <div>
                  {/* Target word card */}
                  <div style={{background:"rgba(0,0,0,.25)",border:"1px solid rgba(244,114,182,.2)",borderRadius:18,padding:"1.2rem",marginBottom:"1rem"}}>
                    <div style={{fontSize:".68rem",color:"#6a5a7a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:".6rem"}}>Đặt câu với từ này</div>
                    <div style={{display:"flex",alignItems:"center",gap:".8rem",flexWrap:"wrap"}}>
                      <span style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:900,color:"#f5f0ff"}}>{writingWord.word}</span>
                      <button className="spkbtn btn" onClick={()=>speak(writingWord.word)}>🔊</button>
                      <span style={{fontSize:".72rem",padding:"2px 9px",borderRadius:999,background:(LC[writingWord.level]||"#818cf8")+"20",color:LC[writingWord.level]||"#818cf8",border:`1px solid ${LC[writingWord.level]||"#818cf8"}35`}}>{writingWord.level}</span>
                      <span style={{fontSize:".72rem",color:"#6a5a7a",fontStyle:"italic",fontFamily:"'Crimson Pro',serif"}}>{writingWord.type}</span>
                    </div>
                    <div style={{color:"#c4b5fd",fontSize:".95rem",fontFamily:"'Crimson Pro',serif",marginTop:".4rem"}}>{writingWord.phonetic}</div>
                    <div style={{color:"#d4c8f0",fontSize:"1rem",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>{writingWord.meaning}</div>
                    {writingWord.meaningEn && <div style={{color:"#7a6a8a",fontSize:".85rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginTop:".15rem"}}>{writingWord.meaningEn}</div>}
                    <div style={{marginTop:".6rem",paddingTop:".6rem",borderTop:"1px solid rgba(255,255,255,.06)",fontSize:".8rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif"}}>
                      <span style={{color:"#6a5a7a"}}>Ví dụ: </span>
                      <button className="spkbtn btn" style={{marginLeft:".3rem",fontSize:".72rem"}} onClick={()=>speak(writingWord.example,0.8)}>🔊 Nghe</button>
                    </div>
                  </div>

                  {/* Writing input */}
                  {!writingResult && (
                    <div>
                      <div style={{fontSize:".72rem",color:"#7a6a8a",marginBottom:".35rem",letterSpacing:".05em"}}>Câu của bạn</div>
                      <textarea
                        className="writing-area"
                        placeholder={`Viết một câu sử dụng từ "${writingWord.word}"...`}
                        value={writingInput}
                        rows={4}
                        onChange={e=>setWritingInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==="Enter"&&e.ctrlKey) handleSubmit(); }}
                        autoFocus
                      />
                      <div style={{fontSize:".65rem",color:"#3a2a4a",marginTop:".25rem",marginBottom:".9rem"}}>Ctrl+Enter để gửi · {writingInput.trim().split(/\s+/).filter(Boolean).length} từ</div>
                      <div style={{display:"flex",gap:".7rem"}}>
                        <button className="btn" onClick={handleSubmit}
                          disabled={writingLoading || !writingInput.trim()}
                          style={{flex:1,padding:".88rem",borderRadius:14,background:writingLoading?"rgba(244,114,182,.2)":"linear-gradient(135deg,#f472b6,#a78bfa)",color:"white",border:"none",fontWeight:700,fontSize:"1rem",opacity:!writingInput.trim()?0.5:1}}>
                          {writingLoading ? "⏳ Đang phân tích..." : "🤖 Nhờ AI chấm điểm"}
                        </button>
                        <button className="btn" onClick={pickWord}
                          style={{padding:".88rem 1rem",borderRadius:14,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#7a6a8a",fontSize:".85rem"}}>
                          🔀
                        </button>
                      </div>

                      {/* Shimmer while loading */}
                      {writingLoading && (
                        <div style={{marginTop:"1.2rem"}}>
                          {[90,65,80,55,75].map((w,i)=>(
                            <div key={i} className="shimmer" style={{height:14,borderRadius:7,marginBottom:10,width:`${w}%`}}/>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── AI Result ── */}
                  {writingResult && !writingResult.error && (
                    <div className="fade-in">
                      {/* Score banner */}
                      <div style={{background:"rgba(0,0,0,.3)",border:`2px solid ${scoreColor(writingResult.overallScore)}44`,borderRadius:18,padding:"1rem 1.2rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                        <div style={{textAlign:"center",minWidth:64}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:900,color:scoreColor(writingResult.overallScore),lineHeight:1}}>{writingResult.overallScore}</div>
                          <div style={{fontSize:".6rem",color:"#5a4a6a",letterSpacing:".05em"}}>/10</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:".95rem",fontWeight:700,color:scoreColor(writingResult.overallScore),fontFamily:"'Playfair Display',serif"}}>{scoreLabel(writingResult.overallScore)}</div>
                          <div style={{fontSize:".85rem",color:"#a09080",fontFamily:"'Crimson Pro',serif",marginTop:".2rem",fontStyle:"italic"}}>{writingResult.encouragement}</div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:".3rem",alignItems:"flex-end"}}>
                          <span className={`tag ${writingResult.wordUsedCorrectly?"tag-green":"tag-red"}`}>
                            {writingResult.wordUsedCorrectly?"✓ Dùng đúng từ":"✗ Dùng sai từ"}
                          </span>
                        </div>
                      </div>

                      {/* Original vs Corrected */}
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:"1rem"}}>
                        <div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:14,padding:".9rem"}}>
                          <div style={{fontSize:".65rem",color:"#f87171",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>✏️ Câu của bạn</div>
                          <div style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{writingInput}</div>
                        </div>
                        <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:14,padding:".9rem"}}>
                          <div style={{fontSize:".65rem",color:"#4ade80",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                            <span>✅ Câu đã sửa</span>
                            <button className="spkbtn btn" style={{fontSize:".65rem",padding:".15rem .5rem"}} onClick={()=>speak(writingResult.correctedSentence,0.82)}>🔊</button>
                          </div>
                          <div style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{writingResult.correctedSentence}</div>
                        </div>
                      </div>

                      {/* Spelling errors */}
                      {writingResult.spellingErrors?.length > 0 && (
                        <div className="lesson-card" style={{borderColor:"rgba(251,191,36,.18)"}}>
                          <h4 style={{color:"#fbbf24"}}>🔤 Lỗi chính tả ({writingResult.spellingErrors.length})</h4>
                          {writingResult.spellingErrors.map((e,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".4rem",flexWrap:"wrap"}}>
                              <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".1rem .5rem",color:"#f87171",fontFamily:"'Crimson Pro',serif",textDecoration:"line-through"}}>{e.wrong}</span>
                              <span style={{color:"#5a4a6a"}}>→</span>
                              <span style={{background:"rgba(74,222,128,.15)",borderRadius:6,padding:".1rem .5rem",color:"#4ade80",fontFamily:"'Crimson Pro',serif",fontWeight:700}}>{e.correct}</span>
                              {e.tip && <span style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>({e.tip})</span>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Grammar errors */}
                      {writingResult.grammarErrors?.length > 0 && (
                        <div className="lesson-card" style={{borderColor:"rgba(248,113,113,.18)"}}>
                          <h4 style={{color:"#f87171"}}>📐 Lỗi ngữ pháp ({writingResult.grammarErrors.length})</h4>
                          {writingResult.grammarErrors.map((e,i)=>(
                            <div key={i} style={{marginBottom:".7rem",paddingBottom:".7rem",borderBottom:i<writingResult.grammarErrors.length-1?"1px solid rgba(255,255,255,.05)":"none"}}>
                              <div style={{display:"flex",alignItems:"center",gap:".6rem",flexWrap:"wrap",marginBottom:".3rem"}}>
                                <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".15rem .6rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:".9rem"}}>{e.error}</span>
                                <span style={{color:"#5a4a6a"}}>→</span>
                                <span style={{background:"rgba(74,222,128,.15)",borderRadius:6,padding:".15rem .6rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontSize:".9rem",fontWeight:600}}>{e.correction}</span>
                              </div>
                              {e.rule && <div style={{fontSize:".8rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",paddingLeft:".2rem"}}>📌 {e.rule}</div>}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Style advice */}
                      {writingResult.styleAdvice && (
                        <div className="lesson-card" style={{borderColor:"rgba(96,165,250,.18)"}}>
                          <h4 style={{color:"#60a5fa"}}>💡 Lời khuyên về văn phong</h4>
                          <div style={{fontSize:".9rem",color:"#a0b8d0",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>{writingResult.styleAdvice}</div>
                        </div>
                      )}

                      {/* Lessons */}
                      {writingResult.lessons?.length > 0 && (
                        <div style={{marginBottom:"1rem"}}>
                          <div style={{fontSize:".7rem",color:"#6a5a7a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:".6rem"}}>📚 Bài học từ câu này</div>
                          {writingResult.lessons.map((lesson,i)=>{
                            const alreadySaved = savedLessons.some(l => l.title === lesson.title);
                            return (
                              <div key={i} className="lesson-card" style={{borderColor: alreadySaved ? "rgba(74,222,128,.25)" : "rgba(167,139,250,.18)"}}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".35rem"}}>
                                  <h4 style={{color: alreadySaved ? "#4ade80" : "#c4b5fd",flex:1}}>📖 {lesson.title}</h4>
                                  <button className="btn" onClick={()=>{
                                    if(alreadySaved) return;
                                    const entry = { ...lesson, word: writingWord?.word, savedAt: Date.now() };
                                    setSavedLessons(prev => [entry, ...prev]);
                                  }} style={{padding:".2rem .6rem",borderRadius:8,fontSize:".72rem",fontWeight:700,
                                    background: alreadySaved ? "rgba(74,222,128,.12)" : "rgba(167,139,250,.15)",
                                    border: `1px solid ${alreadySaved ? "rgba(74,222,128,.3)" : "rgba(167,139,250,.3)"}`,
                                    color: alreadySaved ? "#4ade80" : "#c4b5fd",
                                    cursor: alreadySaved ? "default" : "pointer", whiteSpace:"nowrap"}}>
                                    {alreadySaved ? "✓ Đã lưu" : "💾 Lưu lại"}
                                  </button>
                                </div>
                                <div style={{fontSize:".88rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,marginBottom:".5rem"}}>{lesson.explanation}</div>
                                {lesson.example && (
                                  <div style={{display:"flex",alignItems:"center",gap:".5rem",background:"rgba(167,139,250,.08)",borderRadius:8,padding:".4rem .7rem"}}>
                                    <span style={{fontSize:".82rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",color:"#d4c8f0",flex:1}}>"{lesson.example}"</span>
                                    <button className="spkbtn btn" style={{fontSize:".65rem",padding:".15rem .5rem"}} onClick={()=>speak(lesson.example,0.85)}>🔊</button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{display:"flex",gap:".7rem"}}>
                        <button className="btn" onClick={()=>{ setWritingInput(""); setWritingResult(null); }}
                          style={{flex:1,padding:".85rem",borderRadius:14,background:"rgba(244,114,182,.12)",border:"1.5px solid rgba(244,114,182,.25)",color:"#fda4af",fontWeight:700,fontSize:".95rem"}}>
                          ✏️ Viết lại
                        </button>
                        <button className="btn" onClick={pickWord}
                          style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#f472b6,#a78bfa)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                          🎯 Từ tiếp theo
                        </button>
                      </div>
                    </div>
                  )}

                  {/* API Error */}
                  {writingResult?.error && (
                    <div style={{padding:".8rem 1rem",borderRadius:12,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",color:"#fca5a5",fontSize:".85rem",marginTop:"1rem"}}>
                      ⚠ {writingResult.error}
                      <button className="btn" onClick={()=>setWritingResult(null)} style={{marginLeft:".8rem",padding:".2rem .6rem",borderRadius:6,background:"rgba(248,113,113,.2)",border:"none",color:"#fca5a5",fontSize:".8rem"}}>Thử lại</button>
                    </div>
                  )}
                </div>
              )}

              {/* Writing history */}
              {writingHistory.length > 0 && !writingResult && writingWord && (
                <div style={{marginTop:"1.5rem"}}>
                  <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>📋 Lịch sử ({writingHistory.length})</div>
                  {writingHistory.slice(0,4).map((h,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:".7rem",padding:".5rem .8rem",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",marginBottom:".35rem"}}>
                      <span style={{fontWeight:700,color:scoreColor(h.score),fontFamily:"'Playfair Display',serif",minWidth:22,textAlign:"center"}}>{h.score}</span>
                      <span style={{fontSize:".8rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.sentence}</span>
                      <span style={{fontSize:".65rem",color:"#4a3a5a",background:"rgba(167,139,250,.1)",borderRadius:6,padding:"1px 6px"}}>{h.word}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}


        {/* ══ SPEAKING / PRONUNCIATION ══ */}
        {mode===MODES.SPEAKING && (() => {
          const pool = filtered.length >= 1 ? filtered : allWords;

          // ── Helpers ──────────────────────────────────────────────────
          const normalize = s => s.toLowerCase().trim().replace(/[^a-z\s']/g, "").replace(/\s+/g, " ");

          // Word-level similarity score 0-100
          const wordScore = (spoken, target) => {
            const s = normalize(spoken).split(" ");
            const t = normalize(target).split(" ");
            if (t.length === 0) return 0;
            let matched = 0;
            t.forEach((tw, i) => {
              const sw = s[i] || "";
              if (sw === tw) { matched += 1; return; }
              // Partial: count matching chars
              let m = 0;
              for (let j = 0; j < Math.min(sw.length, tw.length); j++) if (sw[j] === tw[j]) m++;
              matched += (m / Math.max(sw.length, tw.length, 1)) * 0.6;
            });
            return Math.round((matched / t.length) * 100);
          };

          // Character-level diff for display
          const charDiff = (spoken, target) => {
            const st = normalize(spoken).split(" ");
            const tt = normalize(target).split(" ");
            return tt.map((tw, i) => {
              const sw = st[i] || "";
              if (sw === tw) return { word: tw, status: "ok" };
              if (!sw) return { word: tw, status: "miss" };
              return { word: tw, spoken: sw, status: "bad" };
            });
          };

          const scoreColor = s => s >= 85 ? "#4ade80" : s >= 65 ? "#fbbf24" : "#f87171";
          const scoreLabel = s => s >= 95 ? "Hoàn hảo! 🌟" : s >= 85 ? "Rất tốt! 👍" : s >= 70 ? "Khá tốt 💪" : s >= 50 ? "Cần luyện thêm" : "Thử lại nhé 🔄";

          const pickWord = () => {
            const priority = pool.filter(w => learningSet.has(w.word));
            const source = priority.length > 0 ? priority : pool;
            const w = source[Math.floor(Math.random() * source.length)];
            setSpkWord(w); setSpkResult(null); setSpkMode("word");
          };

          const playTarget = (rate) => {
            if (!spkWord) return;
            const text = spkMode === "word" ? spkWord.word : spkWord.example;
            setSpkPlaying(true);
            speak(text, rate || (spkMode === "word" ? 0.7 : 0.78));
            setTimeout(() => setSpkPlaying(false), Math.max(1000, text.length * 70));
          };

          const startListening = () => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) { setSpkResult({ error: "Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome hoặc Safari." }); return; }
            if (spkListening) { recognitionRef.current?.stop(); return; }

            const rec = new SR();
            recognitionRef.current = rec;
            rec.lang = "en-US";
            rec.continuous = false;
            rec.interimResults = false;
            rec.maxAlternatives = 3;

            rec.onstart = () => setSpkListening(true);
            rec.onend = () => setSpkListening(false);
            rec.onerror = (e) => {
              setSpkListening(false);
              if (e.error !== "no-speech") setSpkResult({ error: "Lỗi ghi âm: " + e.error });
            };
            rec.onresult = (e) => {
              // Pick best alternative
              let best = "", bestScore = -1;
              const target = spkMode === "word" ? spkWord.word : spkWord.example;
              for (let i = 0; i < e.results[0].length; i++) {
                const t = e.results[0][i].transcript;
                const s = wordScore(t, target);
                if (s > bestScore) { bestScore = s; best = t; }
              }
              const diff = charDiff(best, target);
              setSpkResult({ transcript: best, score: bestScore, diff, target });
              setSpkHistory(h => [{ word: spkWord.word, mode: spkMode, score: bestScore, ts: Date.now() }, ...h.slice(0, 14)]);
            };
            rec.start();
          };

          if (!spkWord) return (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{fontSize:"3rem",marginBottom:".7rem"}}>🎤</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700,color:"#f0eaff",marginBottom:".5rem"}}>Luyện Speaking & Phát âm</div>
              <div style={{fontSize:".88rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.75,maxWidth:380,margin:"0 auto 1.4rem"}}>
                Nghe mẫu → tự đọc theo → app ghi âm và chấm điểm từng từ.<br/>
                Luyện <b style={{color:"#a78bfa"}}>từ đơn</b> để chuẩn hoá phát âm, hoặc luyện <b style={{color:"#f472b6"}}>cả câu</b> để cải thiện ngữ điệu.
              </div>
              <button className="btn" onClick={pickWord}
                style={{padding:".9rem 2.5rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#f472b6)",color:"white",fontSize:"1rem",border:"none",fontWeight:700}}>
                🎯 Bắt đầu luyện
              </button>

              {spkHistory.length > 0 && (
                <div style={{marginTop:"1.8rem",textAlign:"left"}}>
                  <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>📋 Lịch sử gần đây</div>
                  {spkHistory.slice(0,5).map((h,i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:".7rem",padding:".45rem .8rem",background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,marginBottom:".3rem"}}>
                      <span style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:scoreColor(h.score),minWidth:32,textAlign:"center"}}>{h.score}</span>
                      <span style={{flex:1,fontSize:".83rem",color:"#8a7a9a",fontFamily:"'Crimson Pro',serif"}}>{h.word}</span>
                      <span style={{fontSize:".65rem",color:"#4a3a5a",background:"rgba(167,139,250,.1)",borderRadius:6,padding:"1px 7px"}}>{h.mode==="word"?"từ":"câu"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <div>
              {/* Mode toggle */}
              <div style={{display:"flex",gap:".5rem",marginBottom:"1rem",justifyContent:"center"}}>
                {[["word","🔤 Từ đơn","rgba(167,139,250,.2)","rgba(167,139,250,.4)","#c4b5fd"],
                  ["sentence","📝 Cả câu","rgba(244,114,182,.2)","rgba(244,114,182,.4)","#f9a8d4"]].map(([m,label,bg,bc,col])=>(
                  <button key={m} className="btn spk-tab" onClick={()=>{setSpkMode(m);setSpkResult(null);}}
                    style={{background:spkMode===m?bg:"transparent",borderColor:spkMode===m?bc:"rgba(255,255,255,.1)",color:spkMode===m?col:"#5a4a6a"}}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Word card */}
              <div style={{background:"linear-gradient(145deg,#1a1030,#251540)",border:"1px solid rgba(167,139,250,.2)",borderRadius:22,padding:"1.5rem",marginBottom:"1rem",textAlign:"center"}}>
                {/* Word info */}
                <div style={{marginBottom:"1rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize: spkMode==="word"?"2.5rem":"1.3rem",fontWeight:900,color:"#f5f0ff",lineHeight:1.2}}>
                    {spkMode==="word" ? spkWord.word : `"${spkWord.example}"`}
                  </div>
                  <div style={{color:"#a78bfa",fontSize:".9rem",fontStyle:"italic",fontFamily:"'Crimson Pro',serif",marginTop:".3rem",opacity:.8}}>
                    {spkMode==="word" ? spkWord.phonetic : spkWord.word + " — " + spkWord.meaning}
                  </div>
                  {spkMode==="word" && <div style={{color:"#7a6a8a",fontSize:".82rem",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>{spkWord.meaning}</div>}
                </div>

                {/* Listen buttons */}
                <div style={{marginBottom:"1rem"}}>
                  <div style={{fontSize:".68rem",color:"#5a4a6a",marginBottom:".5rem",letterSpacing:".08em"}}>NGHE MẪU</div>
                  <div style={{display:"flex",gap:".5rem",justifyContent:"center"}}>
                    {(spkMode==="word"
                      ? [[0.55,"🐢 Chậm"],[0.82,"▶ Chuẩn"],[1.1,"🐇 Nhanh"]]
                      : [[0.6,"🐢 Chậm"],[0.82,"▶ Chuẩn"]]
                    ).map(([r,label])=>(
                      <button key={r} className={`btn ${spkPlaying?"speak-pulse":""}`} onClick={()=>playTarget(r)}
                        style={{padding:".38rem .85rem",borderRadius:999,background:"rgba(167,139,250,.14)",border:"1px solid rgba(167,139,250,.28)",color:"#c4b5fd",fontSize:".78rem"}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mic button */}
                <div style={{fontSize:".68rem",color:"#5a4a6a",marginBottom:".5rem",letterSpacing:".08em"}}>
                  {spkListening ? "🔴 ĐANG GHI ÂM — NÓI ĐI!" : "NHẤN ĐỂ NÓI"}
                </div>
                <button className={`mic-btn btn ${spkListening?"listening":"idle"}`} onClick={startListening}>
                  {spkListening ? "⏹" : "🎤"}
                </button>
                {spkListening && (
                  <div style={{marginTop:".6rem",fontSize:".78rem",color:"#f87171",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>
                    Nhấn lại để dừng...
                  </div>
                )}
              </div>

              {/* Result */}
              {spkResult && (
                <div className="fade-in">
                  {spkResult.error ? (
                    <div style={{padding:".8rem 1rem",borderRadius:12,background:"rgba(248,113,113,.1)",border:"1px solid rgba(248,113,113,.2)",color:"#fca5a5",fontSize:".85rem",marginBottom:"1rem"}}>
                      ⚠ {spkResult.error}
                    </div>
                  ) : (
                    <div>
                      {/* Score display */}
                      <div style={{background:"rgba(0,0,0,.3)",border:`2px solid ${scoreColor(spkResult.score)}44`,borderRadius:18,padding:"1rem 1.2rem",marginBottom:"1rem"}}>
                        <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
                          {/* Circle score */}
                          <div style={{position:"relative",width:72,height:72,flexShrink:0}}>
                            <svg width="72" height="72" viewBox="0 0 72 72">
                              <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="6"/>
                              <circle cx="36" cy="36" r="30" fill="none" stroke={scoreColor(spkResult.score)} strokeWidth="6"
                                strokeDasharray={`${(spkResult.score/100)*188.5} 188.5`}
                                strokeLinecap="round" className="score-ring"/>
                            </svg>
                            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                              <span style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.25rem",color:scoreColor(spkResult.score),lineHeight:1}}>{spkResult.score}</span>
                              <span style={{fontSize:".55rem",color:"#5a4a6a"}}>/ 100</span>
                            </div>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.05rem",color:scoreColor(spkResult.score)}}>{scoreLabel(spkResult.score)}</div>
                            <div style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>
                              Bạn nói: <i style={{color:"#c4b5fd"}}>"{spkResult.transcript}"</i>
                            </div>
                          </div>
                        </div>

                        {/* Word-by-word breakdown */}
                        <div style={{marginTop:".9rem",paddingTop:".8rem",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                          <div style={{fontSize:".65rem",color:"#5a4a6a",marginBottom:".5rem",letterSpacing:".08em"}}>PHÂN TÍCH TỪNG TỪ</div>
                          <div style={{lineHeight:2.2,wordSpacing:"4px"}}>
                            {spkResult.diff.map((d,i) => (
                              <span key={i} className={`phone-char ${d.status==="ok"?"phone-ok":d.status==="miss"?"phone-miss":"phone-bad"}`}
                                title={d.status==="bad" ? `Bạn nói: "${d.spoken}"` : d.status==="miss" ? "Bỏ sót" : "Đúng"}>
                                {d.word}
                              </span>
                            ))}
                          </div>
                          <div style={{display:"flex",gap:"1rem",marginTop:".5rem",fontSize:".7rem"}}>
                            <span className="phone-char phone-ok" style={{fontSize:".7rem"}}>✓ Đúng</span>
                            <span className="phone-char phone-bad" style={{fontSize:".7rem"}}>✗ Sai</span>
                            <span className="phone-char phone-miss" style={{fontSize:".7rem"}}>? Bỏ sót</span>
                          </div>
                        </div>

                        {/* Tips for bad words */}
                        {spkResult.diff.some(d=>d.status==="bad") && (
                          <div style={{marginTop:".8rem",paddingTop:".7rem",borderTop:"1px solid rgba(255,255,255,.06)"}}>
                            <div style={{fontSize:".65rem",color:"#5a4a6a",marginBottom:".4rem",letterSpacing:".08em"}}>💡 GỢI Ý</div>
                            {spkResult.diff.filter(d=>d.status==="bad").slice(0,3).map((d,i)=>(
                              <div key={i} style={{fontSize:".82rem",fontFamily:"'Crimson Pro',serif",color:"#a09ab0",marginBottom:".2rem"}}>
                                • <b style={{color:"#f87171"}}>{d.spoken}</b> → <b style={{color:"#4ade80"}}>{d.word}</b>
                                <button className="btn spkbtn" style={{marginLeft:".5rem",fontSize:".68rem",padding:".12rem .45rem"}} onClick={()=>speak(d.word,0.6)}>🔊</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div style={{display:"flex",gap:".7rem"}}>
                        <button className="btn" onClick={()=>setSpkResult(null)}
                          style={{flex:1,padding:".82rem",borderRadius:14,background:"rgba(167,139,250,.12)",border:"1.5px solid rgba(167,139,250,.25)",color:"#c4b5fd",fontWeight:700,fontSize:".95rem"}}>
                          🎤 Nói lại
                        </button>
                        <button className="btn" onClick={pickWord}
                          style={{flex:1,padding:".82rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#f472b6)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                          🎯 Từ tiếp theo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom nav */}
              {!spkResult && (
                <div style={{display:"flex",justifyContent:"center",gap:".6rem",marginTop:".8rem"}}>
                  <button className="btn" onClick={pickWord}
                    style={{padding:".45rem 1rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#7a6a8a",fontSize:".8rem"}}>
                    🔀 Đổi từ
                  </button>
                  <button className="btn" onClick={()=>setSpkWord(null)}
                    style={{padding:".45rem 1rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#7a6a8a",fontSize:".8rem"}}>
                    ↩ Trang chủ
                  </button>
                </div>
              )}
            </div>
          );
        })()}


        {/* ══ CONVERSATION MODE ══ */}
        {mode===MODES.CONVO && (() => {

          // Word-level similarity (reuse from speaking)
          const normalize = s => s.toLowerCase().trim().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");
          const wordScore = (spoken, target) => {
            const s = normalize(spoken).split(" ");
            const t = normalize(target).split(" ");
            if (!t.length) return 0;
            let matched = 0;
            t.forEach((tw,i) => {
              const sw = s[i]||"";
              if (sw===tw) { matched+=1; return; }
              let m=0;
              for (let j=0;j<Math.min(sw.length,tw.length);j++) if(sw[j]===tw[j]) m++;
              matched += (m/Math.max(sw.length,tw.length,1))*0.6;
            });
            return Math.round((matched/t.length)*100);
          };
          const charDiff = (spoken, target) => normalize(target).split(" ").map((tw,i)=>{
            const sw = normalize(spoken).split(" ")[i]||"";
            if(sw===tw) return {word:tw,status:"ok"};
            if(!sw) return {word:tw,status:"miss"};
            return {word:tw,spoken:sw,status:"bad"};
          });
          const scoreColor = s => s>=85?"#4ade80":s>=65?"#fbbf24":"#f87171";

          const currentTurn = convoScript?.turns?.[convoTurn];
          const isUserTurn = currentTurn?.role === "user";
          const isLastTurn = convoScript && convoTurn >= convoScript.turns.length;

          // ── Keep refs in sync ──────────────────────────────────────────
          convoTurnRef.current   = convoTurn;
          convoScriptRef.current = convoScript;
          convoLogRef.current    = convoLog;

          // Play AI line with TTS — uses refs so always fresh
          const playAI = (text, onDone) => {
            window.speechSynthesis?.cancel();
            setConvoPlaying(true);
            speak(text, 0.82);
            const est = Math.max(2000, text.length * 80);
            setTimeout(() => { setConvoPlaying(false); if (onDone) onDone(); }, est);
          };

          // Advance an AI turn — pure ref-based, no stale closure
          const advanceAI = (turnIdx) => {
            const script = convoScriptRef.current;
            if (!script || turnIdx >= script.turns.length) return;
            const t = script.turns[turnIdx];
            if (!t || t.role !== "ai") return;
            // Guard: don't add if already logged
            if (convoLogRef.current.some((l,i) => i === convoLogRef.current.length-1 && l.role==="ai" && l.text===t.text && convoLogRef.current.length > 0)) return;
            const entry = {role:"ai", text:t.text};
            convoLogRef.current = [...convoLogRef.current, entry];
            setConvoLog([...convoLogRef.current]);
            convoTurnRef.current = turnIdx + 1;
            setConvoTurn(turnIdx + 1);
            playAI(t.text, () => {
              // After AI speaks, nothing auto-fires — user must press mic
            });
          };

          // Stop current recording
          const stopListening = () => {
            try { convoRecRef.current?.stop(); } catch(_) {}
            setConvoListening(false);
            convoResultPending.current = false;
          };

          // Start listening — continuous mode, user presses stop when done
          const listenUser = () => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) { alert("Trình duyệt không hỗ trợ. Dùng Chrome hoặc Safari."); return; }
            if (convoListening) { stopListening(); return; }

            convoResultPending.current = false;
            const rec = new SR();
            convoRecRef.current = rec;

            // continuous: true so it keeps listening until user stops
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = true;   // show interim so user sees feedback
            rec.maxAlternatives = 1;

            // Accumulate ALL recognized speech — never reset between onresult calls
            let accumulatedFinal = "";
            let currentInterim   = "";

            rec.onstart = () => {
              setConvoListening(true);
              accumulatedFinal = "";
              currentInterim   = "";
              setConvoLiveText("");
            };

            rec.onend = () => {
              setConvoListening(false);
              const fullText = (accumulatedFinal + " " + currentInterim).trim();
              if (!fullText || convoResultPending.current) return;
              convoResultPending.current = true;

              const turnIdx = convoTurnRef.current;
              const script  = convoScriptRef.current;
              if (!script || turnIdx >= script.turns.length) return;
              const turn = script.turns[turnIdx];
              if (!turn || turn.role !== "user") return;

              const ideal    = turn.ideal || "";
              const score    = wordScore(fullText, ideal);
              const diff     = charDiff(fullText, ideal);
              const logEntry = {role:"user", text:turn.prompt, userSaid:fullText, ideal, score, diff};

              convoLogRef.current = [...convoLogRef.current, logEntry];
              setConvoLog([...convoLogRef.current]);
              setConvoLiveText("");

              const nextIdx = turnIdx + 1;
              convoTurnRef.current = nextIdx;
              setConvoTurn(nextIdx);

              if (nextIdx < script.turns.length && script.turns[nextIdx]?.role === "ai") {
                setTimeout(() => advanceAI(nextIdx), 700);
              }
            };

            rec.onerror = (e) => {
              if (e.error === "no-speech" || e.error === "aborted") return;
              setConvoListening(false);
            };

            rec.onresult = (e) => {
              // Key fix: iterate from 0 to accumulate ALL results, not just new ones
              accumulatedFinal = "";
              currentInterim   = "";
              for (let i = 0; i < e.results.length; i++) {
                if (e.results[i].isFinal) {
                  accumulatedFinal += e.results[i][0].transcript + " ";
                } else {
                  currentInterim += e.results[i][0].transcript;
                }
              }
              setConvoLiveText((accumulatedFinal + currentInterim).trim());
            };

            rec.start();
          };

          // Generate new script
          const startConvo = async () => {
            setConvoLoading(true);
            // Reset all refs and state
            convoLogRef.current = [];
            convoTurnRef.current = 0;
            convoScriptRef.current = null;
            convoResultPending.current = false;
            setConvoLog([]); setConvoTurn(0); setConvoReview(null);
            setConvoPhase("convo"); setConvoLiveText("");
            try {
              const script = await generateConvoScript(convoTopic, convoLevel, allWords, apiKey);
              convoScriptRef.current = script;
              setConvoScript(script);
              setTimeout(() => advanceAI(0), 500);
            } catch(e) {
              setConvoPhase("setup");
              alert("Lỗi tạo hội thoại: " + e.message);
            } finally {
              setConvoLoading(false);
            }
          };

          // Get full review
          const getReview = async () => {
            const userTurns = convoLog.filter(t=>t.role==="user");
            if (!userTurns.length) return;
            setConvoReviewLoading(true);
            try {
              const review = await reviewConversation(convoLog, apiKey);
              setConvoReview(review);
              setConvoPhase("review");
            } catch(e) {
              alert("Lỗi review: " + e.message);
            } finally {
              setConvoReviewLoading(false);
            }
          };

          // ── SETUP SCREEN ───────────────────────────────────────────────
          if (convoPhase==="setup") return (
            <div>
              <div style={{background:"linear-gradient(145deg,rgba(96,165,250,.07),rgba(129,140,248,.05))",border:"1px solid rgba(96,165,250,.18)",borderRadius:20,padding:"1.3rem",marginBottom:"1.1rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#93c5fd",marginBottom:".3rem"}}>💬 Luyện hội thoại</div>
                <div style={{fontSize:".83rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>
                  AI tạo kịch bản hội thoại, bạn đóng vai người dùng. Nói tự nhiên, không ngắt quãng. Cuối bài xem review toàn bộ.
                </div>
              </div>

              <div style={{marginBottom:".7rem"}}>
                <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".28rem",letterSpacing:".05em"}}>Chủ đề (để trống = AI tự chọn)</div>
                <input className="fi" placeholder="vd: đặt phòng khách sạn, phỏng vấn xin việc, mua sắm..."
                  value={convoTopic} onChange={e=>setConvoTopic(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!convoLoading&&startConvo()} />
              </div>

              <div style={{marginBottom:"1rem"}}>
                <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".28rem",letterSpacing:".05em"}}>Cấp độ của bạn</div>
                <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                  {["A2","B1","B2","C1"].map(lv=>(
                    <button key={lv} className="btn" onClick={()=>setConvoLevel(lv)}
                      style={{padding:".32rem .85rem",borderRadius:999,border:`1.5px solid ${convoLevel===lv?LC[lv]+"cc":LC[lv]+"44"}`,background:convoLevel===lv?LC[lv]+"22":"transparent",color:convoLevel===lv?LC[lv]:"#5a4a6a",fontSize:".8rem",fontWeight:700}}>
                      {lv}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn" onClick={startConvo} disabled={convoLoading}
                style={{width:"100%",padding:".9rem",borderRadius:14,background:convoLoading?"rgba(96,165,250,.2)":"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:"1rem"}}>
                {convoLoading ? "⏳ Đang tạo hội thoại..." : "🚀 Bắt đầu hội thoại"}
              </button>
              {convoLoading && (
                <div style={{marginTop:"1rem"}}>
                  {[85,60,75,50].map((w,i)=><div key={i} className="shimmer" style={{height:13,borderRadius:7,marginBottom:9,width:`${w}%`}}/>)}
                </div>
              )}
            </div>
          );

          // ── REVIEW SCREEN ──────────────────────────────────────────────
          if (convoPhase==="review" && convoReview) return (
            <div>
              {/* Overall score */}
              <div style={{background:"rgba(0,0,0,.3)",border:`2px solid ${scoreColor(convoReview.overallScore)}44`,borderRadius:18,padding:"1rem 1.2rem",marginBottom:"1rem",display:"flex",gap:"1rem",alignItems:"center"}}>
                <div style={{textAlign:"center",minWidth:64}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:900,color:scoreColor(convoReview.overallScore),lineHeight:1}}>{convoReview.overallScore}</div>
                  <div style={{fontSize:".6rem",color:"#5a4a6a"}}>/100</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1rem",color:"#f0eaff",marginBottom:".25rem"}}>Tổng kết hội thoại</div>
                  <div style={{fontSize:".85rem",color:"#9a8aaa",fontFamily:"'Crimson Pro',serif",lineHeight:1.5}}>{convoReview.summary}</div>
                </div>
              </div>

              {/* Per-turn review */}
              <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".6rem"}}>📋 Chi tiết từng lượt nói</div>
              {(convoReview.turns||[]).map((t,i)=>(
                <div key={i} className="review-card">
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".5rem"}}>
                    <div style={{fontSize:".72rem",color:"#6a5a7a"}}>Lượt {t.turnIndex}</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontWeight:900,fontSize:"1.1rem",color:scoreColor(t.score||70)}}>{t.score||"—"}<span style={{fontSize:".6rem",color:"#5a4a6a"}}>/100</span></div>
                  </div>

                  {/* What they said */}
                  <div style={{marginBottom:".5rem"}}>
                    <div style={{fontSize:".65rem",color:"#f87171",letterSpacing:".06em",marginBottom:".2rem"}}>BẠN ĐÃ NÓI</div>
                    <div className="chat-bubble-user-err" style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",margin:0}}>{t.said}</div>
                  </div>

                  {/* Refined version */}
                  <div style={{marginBottom:".5rem"}}>
                    <div style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:".2rem"}}>
                      <div style={{fontSize:".65rem",color:"#4ade80",letterSpacing:".06em"}}>CÂU TỰ NHIÊN HƠN</div>
                      <button className="spkbtn btn" style={{fontSize:".65rem",padding:".12rem .45rem"}} onClick={()=>speak(t.refined,0.82)}>🔊</button>
                    </div>
                    <div className="chat-bubble-ai" style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#93c5fd",margin:0,fontStyle:"italic"}}>{t.refined}</div>
                  </div>

                  {/* Grammar note */}
                  {t.grammarNote && (
                    <div style={{fontSize:".8rem",color:"#fbbf24",fontFamily:"'Crimson Pro',serif",padding:".4rem .7rem",background:"rgba(251,191,36,.07)",borderRadius:8,marginBottom:".4rem"}}>
                      📐 {t.grammarNote}
                    </div>
                  )}

                  {/* Pronunciation tip */}
                  {t.pronunciationTip && (
                    <div style={{fontSize:".8rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif",padding:".4rem .7rem",background:"rgba(167,139,250,.07)",borderRadius:8}}>
                      🎤 {t.pronunciationTip}
                    </div>
                  )}
                </div>
              ))}

              {/* Full transcript */}
              <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",margin:"1rem 0 .6rem"}}>📜 Toàn bộ hội thoại</div>
              {convoLog.map((t,i)=>(
                <div key={i} style={{marginBottom:".5rem"}}>
                  {t.role==="ai" ? (
                    <div>
                      <div style={{fontSize:".65rem",color:"#60a5fa",marginBottom:".2rem",display:"flex",alignItems:"center",gap:".4rem"}}>
                        🤖 AI
                        <button className="spkbtn btn" style={{fontSize:".62rem",padding:".1rem .4rem"}} onClick={()=>speak(t.text,0.82)}>🔊</button>
                      </div>
                      <div className="chat-bubble-ai" style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0"}}>{t.text}</div>
                    </div>
                  ) : (
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:".65rem",color:"#a78bfa",marginBottom:".2rem"}}>👤 Bạn</div>
                      <div className="chat-bubble-user" style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0"}}>
                        {t.userSaid || <i style={{color:"#5a4a6a"}}>Không nghe được</i>}
                        {t.score !== undefined && (
                          <span style={{display:"block",fontSize:".65rem",color:scoreColor(t.score),marginTop:".2rem"}}>Độ chính xác: {t.score}/100</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div style={{display:"flex",gap:".7rem",marginTop:"1rem"}}>
                <button className="btn" onClick={()=>{setConvoPhase("setup");setConvoScript(null);setConvoLog([]);setConvoTurn(0);setConvoReview(null);}}
                  style={{flex:1,padding:".85rem",borderRadius:14,background:"rgba(96,165,250,.12)",border:"1.5px solid rgba(96,165,250,.25)",color:"#93c5fd",fontWeight:700,fontSize:".95rem"}}>
                  💬 Hội thoại mới
                </button>
                <button className="btn" onClick={startConvo} disabled={convoLoading}
                  style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                  🔄 Chủ đề này lại
                </button>
              </div>
            </div>
          );

          // ── CONVERSATION SCREEN ─────────────────────────────────────────
          return (
            <div>
              {/* Topic badge */}
              {convoScript && (
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".8rem"}}>
                  <div style={{fontSize:".75rem",color:"#60a5fa",background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",borderRadius:999,padding:".2rem .8rem"}}>
                    💬 {convoScript.topic}
                  </div>
                  <div style={{fontSize:".72rem",color:"#5a4a6a"}}>
                    {convoTurn}/{convoScript.turns.length} lượt
                  </div>
                </div>
              )}

              {/* Chat log */}
              <div style={{minHeight:200,marginBottom:"1rem"}}>
                {convoLog.map((t,i)=>(
                  <div key={i} style={{marginBottom:".6rem"}}>
                    {t.role==="ai" ? (
                      <div>
                        <div style={{fontSize:".62rem",color:"#60a5fa",marginBottom:".18rem",display:"flex",alignItems:"center",gap:".35rem"}}>
                          🤖 AI
                          <button className="spkbtn btn" style={{fontSize:".6rem",padding:".1rem .4rem"}} onClick={()=>speak(t.text,0.82)}>🔊</button>
                        </div>
                        <div className="chat-bubble-ai" style={{fontSize:".95rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0"}}>{t.text}</div>
                      </div>
                    ) : (
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:".62rem",color:"#a78bfa",marginBottom:".18rem"}}>👤 Bạn</div>
                        <div className="chat-bubble-user" style={{fontSize:".95rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0"}}>
                          {t.userSaid || <i style={{color:"#5a4a6a"}}>...</i>}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* AI is speaking indicator */}
                {convoPlaying && (
                  <div style={{display:"flex",gap:".3rem",alignItems:"center",padding:".5rem .9rem",width:"fit-content"}}>
                    {[0,1,2].map(i=><div key={i} className="pulse-rec" style={{width:8,height:8,borderRadius:"50%",background:"#60a5fa",animationDelay:`${i*0.2}s`}}/>)}
                  </div>
                )}
              </div>

              {/* User turn area */}
              {!isLastTurn && isUserTurn && !convoPlaying && (
                <div style={{background:"rgba(167,139,250,.05)",border:"1px solid rgba(167,139,250,.15)",borderRadius:16,padding:"1rem",marginBottom:"1rem"}}>
                  <div style={{fontSize:".72rem",color:"#8a7a9a",fontFamily:"'Crimson Pro',serif",marginBottom:".6rem",lineHeight:1.5}}>
                    💡 <b style={{color:"#c4b5fd"}}>Gợi ý:</b> {currentTurn?.prompt}
                  </div>
                  <div style={{textAlign:"center"}}>
                    <button className={`mic-btn btn ${convoListening?"listening":"idle"}`} onClick={listenUser}>
                      {convoListening ? "⏹" : "🎤"}
                    </button>
                    {convoListening && convoLiveText && (
                      <div style={{marginTop:".6rem",padding:".5rem .8rem",background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.2)",borderRadius:10,fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#c4b5fd",fontStyle:"italic",minHeight:36}}>
                        "{convoLiveText}"
                      </div>
                    )}
                    <div style={{fontSize:".75rem",color:convoListening?"#f87171":"#5a4a6a",marginTop:".5rem",fontFamily:"'Crimson Pro',serif"}}>
                      {convoListening ? "🔴 Đang ghi âm — nói xong nhấn ⏹ để dừng" : "Nhấn 🎤 và nói câu trả lời của bạn"}
                    </div>
                  </div>
                </div>
              )}

              {/* Conversation ended */}
              {isLastTurn && (
                <div style={{textAlign:"center",padding:"1rem",background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.18)",borderRadius:16,marginBottom:"1rem"}}>
                  <div style={{fontSize:"1.8rem",marginBottom:".4rem"}}>🎉</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#4ade80",marginBottom:".6rem"}}>Hội thoại hoàn thành!</div>
                  <button className="btn" onClick={getReview} disabled={convoReviewLoading}
                    style={{padding:".82rem 2rem",borderRadius:14,background:convoReviewLoading?"rgba(167,139,250,.2)":"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",border:"none",fontWeight:700,fontSize:"1rem"}}>
                    {convoReviewLoading ? "⏳ AI đang phân tích..." : "📊 Xem review chi tiết"}
                  </button>
                  {convoReviewLoading && (
                    <div style={{marginTop:".8rem"}}>
                      {[80,60,70,50].map((w,i)=><div key={i} className="shimmer" style={{height:11,borderRadius:6,marginBottom:8,width:`${w}%`,margin:"0 auto 8px"}}/>)}
                    </div>
                  )}
                </div>
              )}

              {/* Skip / quit */}
              <div style={{display:"flex",gap:".5rem",justifyContent:"center"}}>
                {isUserTurn && !convoListening && !isLastTurn && (
                  <button className="btn" onClick={()=>{
                    const logEntry={role:"user",text:currentTurn?.prompt,userSaid:"(bỏ qua)",ideal:currentTurn?.ideal,score:0,diff:[]};
                    setConvoLog(prev=>[...prev,logEntry]);
                    const nextIdx=convoTurn+1;
                    setConvoTurn(nextIdx);
                    if(nextIdx<convoScript.turns.length) setTimeout(()=>advanceAI(nextIdx),300);
                  }} style={{padding:".42rem .9rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".78rem"}}>
                    ⏭ Bỏ qua lượt này
                  </button>
                )}
                <button className="btn" onClick={()=>{
                  convoRecRef.current?.stop();
                  window.speechSynthesis?.cancel();
                  setConvoPhase("setup"); setConvoScript(null); setConvoLog([]); setConvoTurn(0); setConvoLiveText(""); convoLogRef.current=[]; convoTurnRef.current=0; convoScriptRef.current=null;
                }} style={{padding:".42rem .9rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".78rem"}}>
                  ✕ Thoát
                </button>
              </div>
            </div>
          );
        })()}


        {/* ══ GRAMMAR NOTEBOOK ══ */}
        {mode===MODES.GRAMMAR && (
          <div>
            {savedLessons.length === 0 ? (
              <div style={{textAlign:"center",padding:"3rem 1rem"}}>
                <div style={{fontSize:"3rem",marginBottom:".8rem"}}>📒</div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#8a7a9a",marginBottom:".4rem"}}>Chưa có bài học nào được lưu</div>
                <div style={{fontSize:".87rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif"}}>
                  Trong tab ✏️ Writing, nhấn <b style={{color:"#c4b5fd"}}>💾 Lưu lại</b> ở những bài học hay để lưu vào đây.
                </div>
              </div>
            ) : (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".9rem"}}>
                  <div style={{fontSize:".75rem",color:"#8a7a9a"}}>📒 {savedLessons.length} bài học đã lưu</div>
                  <button className="btn" onClick={()=>{if(window.confirm("Xoá tất cả bài học đã lưu?")) setSavedLessons([]);}}
                    style={{padding:".28rem .7rem",borderRadius:8,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.18)",color:"#f87171",fontSize:".72rem"}}>
                    🗑 Xoá tất cả
                  </button>
                </div>

                {savedLessons.map((lesson, i) => (
                  <div key={i} className="lesson-card" style={{borderColor:"rgba(167,139,250,.2)",marginBottom:".8rem",position:"relative"}}>
                    {/* Header */}
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".4rem"}}>
                      <div style={{flex:1}}>
                        <h4 style={{color:"#c4b5fd",marginBottom:".1rem"}}>📖 {lesson.title}</h4>
                        {lesson.word && (
                          <span style={{fontSize:".65rem",color:"#5a4a6a",background:"rgba(167,139,250,.08)",borderRadius:6,padding:"1px 7px"}}>
                            từ: {lesson.word}
                          </span>
                        )}
                      </div>
                      <div style={{display:"flex",gap:".4rem",alignItems:"center",flexShrink:0}}>
                        <span style={{fontSize:".65rem",color:"#4a3a5a"}}>
                          {new Date(lesson.savedAt).toLocaleDateString("vi-VN")}
                        </span>
                        <button className="btn" onClick={()=>setSavedLessons(prev=>prev.filter((_,j)=>j!==i))}
                          style={{padding:".18rem .5rem",borderRadius:6,background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.15)",color:"#f87171",fontSize:".68rem"}}>
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div style={{fontSize:".9rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.75,marginBottom:".5rem"}}>
                      {lesson.explanation}
                    </div>

                    {/* Example */}
                    {lesson.example && (
                      <div style={{display:"flex",alignItems:"center",gap:".5rem",background:"rgba(167,139,250,.08)",borderRadius:8,padding:".4rem .75rem"}}>
                        <span style={{fontSize:".85rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",color:"#d4c8f0",flex:1}}>"{lesson.example}"</span>
                        <button className="spkbtn btn" style={{fontSize:".65rem",padding:".15rem .5rem"}} onClick={()=>speak(lesson.example,0.85)}>🔊</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* ══ DAILY CHALLENGE ══ */}
        {mode===MODES.DAILY && (() => {
          const todayStr = new Date().toDateString();
          const streakCount = dailyProgress?.streak || 0;
          const isDone = dailyProgress?.date === todayStr && dailyProgress?.completed;

          // Word-level score helper
          const normalize = s => s.toLowerCase().trim().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");
          const wordScore = (spoken, target) => {
            const s = normalize(spoken).split(" "), t = normalize(target).split(" ");
            if (!t.length) return 0;
            let m = 0;
            t.forEach((tw,i)=>{ const sw=s[i]||""; if(sw===tw){m+=1;}else{let c=0;for(let j=0;j<Math.min(sw.length,tw.length);j++)if(sw[j]===tw[j])c++;m+=(c/Math.max(sw.length,tw.length,1))*.6;} });
            return Math.round((m/t.length)*100);
          };

          const steps = [
            {id:1, icon:"🎧", label:"Nghe & nhận biết"},
            {id:2, icon:"✍️", label:"Viết câu"},
            {id:3, icon:"🎤", label:"Luyện nói"},
          ];

          const startChallenge = async () => {
            setDailyLoading(true); setDailyChallenge(null);
            setDailyStep(1); setDailyListened(false);
            setDailyWriteInput(""); setDailyWriteResult(null); setDailySpeakResult(null);
            try {
              const pool = allWords.length > 0 ? allWords : [];
              const challenge = await generateDailyChallenge(pool, levelFilter==="All"?"B1":levelFilter, apiKey);
              setDailyChallenge(challenge);
            } catch(e) { alert("Lỗi tạo challenge: "+e.message); setDailyStep(0); }
            finally { setDailyLoading(false); }
          };

          const completeDaily = () => {
            const yesterday = dailyProgress?.date;
            const yStr = new Date(Date.now()-86400000).toDateString();
            const newStreak = (yesterday === yStr || yesterday === todayStr) ? (dailyProgress?.streak||0)+1 : 1;
            setDailyProgress({ date: todayStr, completed: true, streak: newStreak, word: dailyChallenge?.focusWord });
          };

          const checkWrite = async () => {
            if (!dailyWriteInput.trim()) return;
            setDailyWriteLoading(true);
            try {
              const res = await checkWriting({word:dailyChallenge.focusWord,meaning:dailyChallenge.focusMeaning,type:"",level:"B1",phonetic:"",meaningEn:"",example:""}, dailyWriteInput.trim(), apiKey);
              setDailyWriteResult(res);
            } catch(e) { setDailyWriteResult({error:e.message}); }
            finally { setDailyWriteLoading(false); }
          };

          const startSpeak = () => {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SR) return;
            if (dailySpeakListening) { dailySpeakRecRef.current?.stop(); return; }
            const rec = new SR();
            dailySpeakRecRef.current = rec;
            rec.lang="en-US"; rec.continuous=false; rec.interimResults=false; rec.maxAlternatives=3;
            rec.onstart = () => setDailySpeakListening(true);
            rec.onend   = () => setDailySpeakListening(false);
            rec.onresult = (e) => {
              let best="", bestScore=-1;
              const target = dailyChallenge?.speakSentence||"";
              for(let i=0;i<e.results[0].length;i++){const t=e.results[0][i].transcript;const s=wordScore(t,target);if(s>bestScore){bestScore=s;best=t;}}
              setDailySpeakResult({transcript:best,score:bestScore});
            };
            rec.start();
          };

          // ── INTRO / DONE SCREEN ────────────────────────────────────────
          if (dailyStep===0 || !dailyChallenge) return (
            <div>
              {/* Streak */}
              <div style={{display:"flex",justifyContent:"center",marginBottom:"1.2rem"}}>
                <div className="streak-badge">🔥 {streakCount} ngày liên tiếp</div>
              </div>

              {/* Done banner */}
              {isDone && (
                <div style={{background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",borderRadius:16,padding:"1rem 1.2rem",marginBottom:"1rem",textAlign:"center"}}>
                  <div style={{fontSize:"1.8rem",marginBottom:".3rem"}}>✅</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#4ade80",fontSize:"1.05rem"}}>Hôm nay đã hoàn thành!</div>
                  <div style={{fontSize:".82rem",color:"#5a7a5a",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>Từ hôm nay: <b style={{color:"#86efac"}}>{dailyProgress?.word}</b></div>
                </div>
              )}

              {/* Info card */}
              <div style={{background:"linear-gradient(145deg,rgba(251,191,36,.07),rgba(167,139,250,.05))",border:"1px solid rgba(251,191,36,.18)",borderRadius:20,padding:"1.2rem",marginBottom:"1.2rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#fde68a",marginBottom:".3rem"}}>🔥 Daily Challenge</div>
                <div style={{fontSize:".85rem",color:"#9a8a6a",fontFamily:"'Crimson Pro',serif",lineHeight:1.7}}>
                  Mỗi ngày 1 challenge gồm <b style={{color:"#fbbf24"}}>3 nhiệm vụ</b> kết hợp nghe, viết và nói với 1 từ vựng. Chỉ mất <b style={{color:"#fbbf24"}}>3-5 phút</b>.
                </div>
                <div style={{display:"flex",gap:".6rem",marginTop:".9rem",flexWrap:"wrap"}}>
                  {steps.map(s=>(
                    <div key={s.id} style={{flex:1,minWidth:90,textAlign:"center",background:"rgba(0,0,0,.2)",borderRadius:10,padding:".5rem",fontSize:".75rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif"}}>
                      <div style={{fontSize:"1.3rem"}}>{s.icon}</div>{s.label}
                    </div>
                  ))}
                </div>
              </div>

              {dailyLoading ? (
                <div style={{marginTop:".8rem"}}>
                  {[80,60,70,50].map((w,i)=><div key={i} className="shimmer" style={{height:13,borderRadius:7,marginBottom:10,width:`${w}%`}}/>)}
                </div>
              ) : (
                <button className="btn" onClick={startChallenge}
                  style={{width:"100%",padding:".9rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                  {isDone ? "🔄 Làm lại" : "🚀 Bắt đầu ngay"}
                </button>
              )}
            </div>
          );

          const c = dailyChallenge;

          // Progress bar
          const ProgressBar = () => (
            <div style={{marginBottom:"1rem"}}>
              <div style={{display:"flex",gap:".4rem",marginBottom:".5rem"}}>
                {steps.map(s=>(
                  <div key={s.id} className={`daily-step ${dailyStep>s.id?"done":dailyStep===s.id?"active":"pending"}`} style={{flex:1,justifyContent:"center"}}>
                    {dailyStep>s.id?"✓ ":""}{s.icon} {s.label}
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:"2px"}}>
                {steps.map(s=>(
                  <div key={s.id} style={{flex:1,height:3,borderRadius:2,background:dailyStep>s.id?"#4ade80":dailyStep===s.id?"#fbbf24":"rgba(255,255,255,.08)",transition:"background .4s"}}/>
                ))}
              </div>
            </div>
          );

          // Focus word display
          const WordCard = () => (
            <div style={{background:"rgba(0,0,0,.25)",border:"1px solid rgba(251,191,36,.18)",borderRadius:14,padding:".9rem 1rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:".8rem"}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.4rem",fontWeight:900,color:"#f5f0ff"}}>{c.focusWord}</div>
                <div style={{color:"#a78bfa",fontSize:".82rem",fontStyle:"italic",fontFamily:"'Crimson Pro',serif"}}>{c.focusPhonetic}</div>
              </div>
              <div style={{flex:1,fontSize:".88rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif"}}>{c.focusMeaning}</div>
              <button className="spkbtn btn" onClick={()=>speak(c.focusWord,0.7)}>🔊</button>
            </div>
          );

          // ── STEP 1: LISTEN ─────────────────────────────────────────────
          if (dailyStep===1) return (
            <div>
              <ProgressBar/>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,color:"#fde68a",marginBottom:".6rem"}}>🎧 Nhiệm vụ 1: Nghe câu</div>
              <WordCard/>
              <div style={{background:"linear-gradient(145deg,#1a1030,#0e1a2e)",border:"1px solid rgba(96,165,250,.2)",borderRadius:18,padding:"1.4rem",textAlign:"center",marginBottom:"1rem"}}>
                <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".1em",marginBottom:".8rem"}}>NGHE CÂU VÀ GHI NHỚ</div>
                <button className={`mic-btn btn ${dailyListened?"idle":""}`} onClick={()=>{setDailyListened(true);speak(c.listenSentence,0.78);}}>
                  {dailyListened?"🔊":"▶️"}
                </button>
                <div style={{fontSize:".78rem",color:"#5a4a6a",marginTop:".6rem",fontFamily:"'Crimson Pro',serif"}}>{dailyListened?"Nhấn để nghe lại":"Nhấn để nghe câu"}</div>
                {dailyListened && (
                  <div className="fade-in" style={{marginTop:"1rem"}}>
                    <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginBottom:"1rem"}}>
                      {[[0.55,"🐢"],[0.78,"▶"],[1.0,"🐇"]].map(([r,l])=>(
                        <button key={r} className="btn" onClick={()=>speak(c.listenSentence,r)}
                          style={{padding:".28rem .7rem",borderRadius:999,background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",color:"#93c5fd",fontSize:".75rem"}}>{l}</button>
                      ))}
                    </div>
                    <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:10,padding:".6rem .9rem",fontSize:".88rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",color:"#86efac"}}>
                      "{c.listenSentence}"
                    </div>
                  </div>
                )}
              </div>
              {dailyListened && (
                <button className="btn" onClick={()=>setDailyStep(2)}
                  style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                  Tiếp theo: Viết câu ✍️
                </button>
              )}
            </div>
          );

          // ── STEP 2: WRITE ──────────────────────────────────────────────
          if (dailyStep===2) return (
            <div>
              <ProgressBar/>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,color:"#fda4af",marginBottom:".6rem"}}>✍️ Nhiệm vụ 2: Viết câu</div>
              <WordCard/>
              <div style={{background:"rgba(244,114,182,.05)",border:"1px solid rgba(244,114,182,.15)",borderRadius:14,padding:".9rem 1rem",marginBottom:".8rem",fontSize:".9rem",color:"#d4c8f0",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                💬 {c.writePrompt}
              </div>
              {!dailyWriteResult ? (
                <div>
                  <textarea className="writing-area" rows={3} placeholder={`Viết 1-2 câu sử dụng "${c.focusWord}"...`}
                    value={dailyWriteInput} onChange={e=>setDailyWriteInput(e.target.value)}
                    onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)checkWrite();}} />
                  <div style={{fontSize:".65rem",color:"#3a2a4a",marginTop:".25rem",marginBottom:".8rem"}}>Ctrl+Enter để gửi</div>
                  <button className="btn" onClick={checkWrite} disabled={dailyWriteLoading||!dailyWriteInput.trim()}
                    style={{width:"100%",padding:".88rem",borderRadius:14,background:dailyWriteLoading?"rgba(244,114,182,.2)":"linear-gradient(135deg,#f472b6,#a78bfa)",color:"white",border:"none",fontWeight:700,fontSize:"1rem",opacity:!dailyWriteInput.trim()?0.5:1}}>
                    {dailyWriteLoading?"⏳ Đang chấm...":"🤖 Chấm điểm"}
                  </button>
                </div>
              ) : dailyWriteResult.error ? (
                <div style={{color:"#fca5a5",fontSize:".85rem",padding:".7rem .9rem",background:"rgba(248,113,113,.1)",borderRadius:10}}>
                  ⚠ {dailyWriteResult.error}
                  <button className="btn" onClick={()=>setDailyWriteResult(null)} style={{marginLeft:".7rem",padding:".2rem .6rem",borderRadius:6,background:"rgba(248,113,113,.2)",border:"none",color:"#fca5a5",fontSize:".78rem"}}>Thử lại</button>
                </div>
              ) : (
                <div className="fade-in">
                  {/* Score */}
                  <div style={{display:"flex",alignItems:"center",gap:".9rem",background:"rgba(0,0,0,.25)",border:`1.5px solid ${dailyWriteResult.overallScore>=7?"rgba(74,222,128,.3)":"rgba(251,191,36,.3)"}`,borderRadius:14,padding:".9rem 1rem",marginBottom:".8rem"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:900,color:dailyWriteResult.overallScore>=7?"#4ade80":"#fbbf24",lineHeight:1}}>{dailyWriteResult.overallScore}<span style={{fontSize:".7rem",color:"#5a4a6a"}}>/10</span></div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0",marginBottom:".2rem",fontStyle:"italic"}}>"{dailyWriteInput}"</div>
                      <div style={{fontSize:".82rem",fontFamily:"'Crimson Pro',serif",color:"#86efac",display:"flex",alignItems:"center",gap:".4rem"}}>
                        ✅ {dailyWriteResult.correctedSentence}
                        <button className="spkbtn btn" style={{fontSize:".62rem",padding:".1rem .4rem"}} onClick={()=>speak(dailyWriteResult.correctedSentence,0.82)}>🔊</button>
                      </div>
                    </div>
                  </div>
                  {/* Grammar errors */}
                  {dailyWriteResult.grammarErrors?.length>0 && (
                    <div style={{fontSize:".82rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",padding:".6rem .9rem",background:"rgba(248,113,113,.07)",borderRadius:10,marginBottom:".7rem"}}>
                      {dailyWriteResult.grammarErrors.map((e,i)=><div key={i}>📐 {e.rule}</div>)}
                    </div>
                  )}
                  <button className="btn" onClick={()=>setDailyStep(3)}
                    style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                    Tiếp theo: Luyện nói 🎤
                  </button>
                </div>
              )}
            </div>
          );

          // ── STEP 3: SPEAK ──────────────────────────────────────────────
          if (dailyStep===3) return (
            <div>
              <ProgressBar/>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,color:"#c4b5fd",marginBottom:".6rem"}}>🎤 Nhiệm vụ 3: Luyện nói</div>
              <WordCard/>
              <div style={{background:"linear-gradient(145deg,#1a1030,#251545)",border:"1px solid rgba(167,139,250,.2)",borderRadius:18,padding:"1.4rem",textAlign:"center",marginBottom:"1rem"}}>
                <div style={{fontSize:".85rem",fontFamily:"'Crimson Pro',serif",color:"#c4b5fd",marginBottom:".8rem",fontStyle:"italic"}}>
                  Đọc to câu này:<br/><b style={{color:"#f0eaff",fontStyle:"normal"}}>"{c.speakSentence}"</b>
                </div>
                <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginBottom:"1rem"}}>
                  {[[0.65,"🐢"],[0.85,"▶"],[1.05,"🐇"]].map(([r,l])=>(
                    <button key={r} className="btn" onClick={()=>speak(c.speakSentence,r)}
                      style={{padding:".28rem .7rem",borderRadius:999,background:"rgba(167,139,250,.12)",border:"1px solid rgba(167,139,250,.22)",color:"#c4b5fd",fontSize:".75rem"}}>{l} Nghe mẫu</button>
                  ))}
                </div>
                <button className={`mic-btn btn ${dailySpeakListening?"listening":"idle"}`} onClick={startSpeak}>
                  {dailySpeakListening?"⏹":"🎤"}
                </button>
                <div style={{fontSize:".75rem",color:dailySpeakListening?"#f87171":"#5a4a6a",marginTop:".5rem",fontFamily:"'Crimson Pro',serif"}}>
                  {dailySpeakListening?"🔴 Đang ghi âm...":"Nhấn 🎤 và đọc câu trên"}
                </div>
              </div>

              {dailySpeakResult && (
                <div className="fade-in" style={{background:"rgba(0,0,0,.25)",border:`1.5px solid ${dailySpeakResult.score>=75?"rgba(74,222,128,.3)":"rgba(251,191,36,.3)"}`,borderRadius:14,padding:".9rem 1rem",marginBottom:".8rem",display:"flex",alignItems:"center",gap:".9rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2rem",fontWeight:900,color:dailySpeakResult.score>=75?"#4ade80":"#fbbf24",lineHeight:1,minWidth:52,textAlign:"center"}}>
                    {dailySpeakResult.score}<span style={{fontSize:".65rem",color:"#5a4a6a"}}>/100</span>
                  </div>
                  <div style={{flex:1,fontSize:".85rem",fontFamily:"'Crimson Pro',serif",color:"#a09ab0",fontStyle:"italic"}}>
                    "{dailySpeakResult.transcript}"
                  </div>
                </div>
              )}

              {dailySpeakResult && (
                <button className="btn" onClick={()=>{ setDailyStep(4); completeDaily(); }}
                  style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:"1rem"}}>
                  🎉 Hoàn thành Challenge!
                </button>
              )}
            </div>
          );

          // ── STEP 4: DONE ───────────────────────────────────────────────
          return (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{fontSize:"4rem",marginBottom:".7rem"}}>🏆</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:900,background:"linear-gradient(90deg,#fbbf24,#f472b6)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:".4rem"}}>
                Challenge hoàn thành!
              </div>
              <div className="streak-badge" style={{margin:".6rem auto",display:"inline-flex"}}>🔥 {dailyProgress?.streak||1} ngày liên tiếp!</div>
              <div style={{fontSize:".88rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",marginTop:".8rem",marginBottom:"1.5rem"}}>
                Từ hôm nay: <b style={{color:"#f0eaff",fontSize:"1.1rem"}}>{c.focusWord}</b> — {c.focusMeaning}
              </div>
              <div style={{display:"flex",gap:".7rem",justifyContent:"center"}}>
                <button className="btn" onClick={()=>setDailyStep(0)}
                  style={{padding:".75rem 1.5rem",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#8a7a9a",fontSize:".9rem"}}>
                  ← Về trang
                </button>
                <button className="btn" onClick={()=>{ setMode(MODES.FLASHCARD); }}
                  style={{padding:".75rem 1.5rem",borderRadius:12,background:"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",border:"none",fontSize:".9rem",fontWeight:600}}>
                  📇 Ôn thêm từ vựng
                </button>
              </div>
            </div>
          );
        })()}

        {/* ══ REVIEW ══ */}
        {mode===MODES.REVIEW && (
          <div>
            {learningSet.size===0 ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem", color:"#5a4a6a" }}>
                <div style={{ fontSize:"3rem", marginBottom:".8rem" }}>📭</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.2rem", color:"#8a7a9a" }}>Chưa có từ nào cần ôn</div>
                <div style={{ fontSize:".87rem", marginTop:".4rem", fontFamily:"'Crimson Pro',serif" }}>Nhấn "Chưa nhớ" trong chế độ Thẻ để thêm vào đây</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize:".75rem", color:"#8a7a9a", marginBottom:".7rem" }}>📌 {learningSet.size} từ cần ôn thêm</div>
                {allWords.filter(v=>learningSet.has(v.word)).map(v => (
                  <div key={v.word} style={{ background:"rgba(244,114,182,.04)", border:"1px solid rgba(244,114,182,.12)", borderRadius:14, padding:".95rem 1.05rem", marginBottom:".55rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:".5rem", flexWrap:"wrap", marginBottom:".18rem" }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.18rem", fontWeight:700, color:"#f0eaff" }}>{v.word}</span>
                      <button className="spkbtn btn" onClick={()=>speak(v.word)}>🔊</button>
                      <span style={{ fontSize:".65rem", padding:"1px 7px", borderRadius:999, background:LC[v.level]+"18", color:LC[v.level], border:`1px solid ${LC[v.level]}33` }}>{v.level}</span>
                    </div>
                    <div style={{ color:"#a78bfa", fontSize:".8rem", fontStyle:"italic", fontFamily:"'Crimson Pro',serif" }}>{v.phonetic}</div>
                    <div style={{ color:"#d4c8f0", fontSize:".93rem", marginTop:".22rem", fontFamily:"'Crimson Pro',serif" }}>{v.meaning}</div>
                    <div style={{ color:"#5a4a6a", fontSize:".8rem", fontStyle:"italic", marginTop:".18rem", fontFamily:"'Crimson Pro',serif" }}>"{v.example}"</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════
            ✨ ADD WORD — AI-Powered
        ══════════════════════════════════════════ */}
        {mode===MODES.ADD && (
          <div>
            {/* Search box */}
            <div style={{ background:"linear-gradient(145deg,rgba(167,139,250,.06),rgba(236,72,153,.04))", border:"1px solid rgba(167,139,250,.15)", borderRadius:20, padding:"1.3rem", marginBottom:"1.2rem" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.25rem", fontWeight:700, marginBottom:".3rem", color:"#d4c8f0" }}>✨ Thêm từ bằng AI</div>
              <div style={{ fontSize:".78rem", color:"#6a5a7a", fontFamily:"'Crimson Pro',serif", marginBottom:"1rem", lineHeight:1.5 }}>
                Nhập <b style={{ color:"#a78bfa" }}>từ tiếng Anh</b> hoặc <b style={{ color:"#f472b6" }}>từ tiếng Việt</b> — AI sẽ tự động điền IPA, định nghĩa và câu ví dụ.
              </div>

              <div style={{ display:"flex", gap:".6rem" }}>
                <input
                  ref={inputRef}
                  className="fi"
                  placeholder='e.g. "Serendipity" hoặc "kiên nhẫn"'
                  value={addInput}
                  onChange={e => { setAddInput(e.target.value); setAddPreview(null); setAddErr(""); }}
                  onKeyDown={e => e.key==="Enter" && !addLoading && handleLookup()}
                  style={{ flex:1 }}
                />
                <button className="btn" onClick={handleLookup} disabled={addLoading || !addInput.trim()}
                  style={{ padding:".55rem 1.2rem", borderRadius:12, background: addLoading ? "rgba(167,139,250,.2)" : "linear-gradient(135deg,#a78bfa,#ec4899)", color:"white", border:"none", fontSize:".88rem", fontWeight:600, minWidth:80, opacity: !addInput.trim()?0.5:1 }}>
                  {addLoading ? "⏳" : "🔍 Tra"}
                </button>
              </div>

              {/* Skeleton loader */}
              {addLoading && (
                <div style={{ marginTop:"1rem", borderRadius:14, overflow:"hidden" }}>
                  {[100,70,85,60].map((w,i) => (
                    <div key={i} className="shimmer" style={{ height:16, borderRadius:8, marginBottom:10, width:`${w}%` }} />
                  ))}
                </div>
              )}

              {/* Error */}
              {addErr && !addLoading && (
                <div style={{ marginTop:".8rem", padding:".6rem .9rem", borderRadius:10, background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.2)", color:"#fca5a5", fontSize:".83rem" }}>
                  ⚠ {addErr}
                </div>
              )}

              {/* AI Preview Card */}
              {addPreview && !addLoading && (
                <div className="fade-in" style={{ marginTop:"1rem", background:"rgba(0,0,0,.25)", border:"1px solid rgba(167,139,250,.2)", borderRadius:16, padding:"1.1rem", position:"relative" }}>
                  <div style={{ position:"absolute", top:10, right:12, fontSize:".65rem", color:"#a78bfa88", letterSpacing:".08em" }}>✦ AI RESULT — có thể chỉnh sửa</div>

                  {/* Word + phonetic row */}
                  <div style={{ display:"flex", alignItems:"flex-start", gap:".7rem", marginBottom:".7rem", flexWrap:"wrap" }}>
                    <div style={{ flex:1, minWidth:160 }}>
                      <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Từ tiếng Anh</div>
                      <input className="fi fi-sm" value={addPreview.word} onChange={e=>handleEditPreview("word",e.target.value)} />
                    </div>
                    <div style={{ flex:1, minWidth:130 }}>
                      <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Phiên âm IPA</div>
                      <input className="fi fi-sm" value={addPreview.phonetic} onChange={e=>handleEditPreview("phonetic",e.target.value)} style={{ fontStyle:"italic", color:"#a78bfa" }} />
                    </div>
                  </div>

                  {/* Type + Level row */}
                  <div style={{ display:"flex", gap:".7rem", marginBottom:".7rem" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Loại từ</div>
                      <select className="fi fi-sm" value={addPreview.type} onChange={e=>handleEditPreview("type",e.target.value)}>
                        {["adj","verb","noun","adv","phrase"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Cấp độ CEFR</div>
                      <select className="fi fi-sm" value={addPreview.level} onChange={e=>handleEditPreview("level",e.target.value)}>
                        {["A1","A2","B1","B2","C1","C2"].map(o=><option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Vietnamese meaning */}
                  <div style={{ marginBottom:".7rem" }}>
                    <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Nghĩa tiếng Việt</div>
                    <input className="fi fi-sm" value={addPreview.meaning} onChange={e=>handleEditPreview("meaning",e.target.value)} />
                  </div>

                  {/* English definition */}
                  <div style={{ marginBottom:".7rem" }}>
                    <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Định nghĩa tiếng Anh</div>
                    <textarea className="fi fi-sm" value={addPreview.meaningEn || ""} onChange={e=>handleEditPreview("meaningEn",e.target.value)} rows={2} />
                  </div>

                  {/* Example */}
                  <div style={{ marginBottom:"1rem" }}>
                    <div style={{ fontSize:".68rem", color:"#5a4a6a", marginBottom:".2rem" }}>Câu ví dụ</div>
                    <textarea className="fi fi-sm" value={addPreview.example} onChange={e=>handleEditPreview("example",e.target.value)} rows={2} />
                  </div>

                  {/* Preview badge */}
                  <div style={{ display:"flex", gap:".5rem", alignItems:"center", marginBottom:"1rem", flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.3rem", fontWeight:900, color:"#f5f0ff" }}>{addPreview.word}</span>
                    <span style={{ color:"#a78bfa88", fontStyle:"italic", fontSize:".85rem", fontFamily:"'Crimson Pro',serif" }}>{addPreview.phonetic}</span>
                    <button className="spkbtn btn" onClick={()=>speak(addPreview.word)}>🔊</button>
                    <span style={{ fontSize:".65rem", padding:"1px 8px", borderRadius:999, background:(LC[addPreview.level]||"#818cf8")+"20", color:LC[addPreview.level]||"#818cf8", border:`1px solid ${LC[addPreview.level]||"#818cf8"}35`, marginLeft:"auto" }}>{addPreview.level}</span>
                  </div>

                  {/* Confirm button */}
                  <button className="btn" onClick={handleConfirmAdd}
                    style={{ width:"100%", padding:".82rem", borderRadius:12, background:"linear-gradient(135deg,#4ade80,#22c55e)", color:"#0a1a0e", fontWeight:700, fontSize:".98rem", border:"none" }}>
                    ✅ Thêm vào danh sách
                  </button>
                </div>
              )}

              {addOk && (
                <div className="fade-in" style={{ marginTop:".8rem", padding:".6rem .9rem", borderRadius:10, background:"rgba(74,222,128,.1)", border:"1px solid rgba(74,222,128,.2)", color:"#86efac", fontSize:".83rem" }}>
                  {addOk}
                </div>
              )}
            </div>

            {/* Custom words list */}
            {allWords.filter(w=>w.custom).length>0 && (
              <div style={{ marginBottom:"1.2rem" }}>
                <div style={{ fontSize:".75rem", color:"#7a6a8a", marginBottom:".55rem" }}>✦ Từ bạn đã thêm ({allWords.filter(w=>w.custom).length})</div>
                {allWords.filter(w=>w.custom).map(v => (
                  <div key={v.word} style={{ background:"rgba(251,191,36,.04)", border:"1px solid rgba(251,191,36,.11)", borderRadius:12, padding:".8rem .95rem", marginBottom:".45rem", display:"flex", alignItems:"center", gap:".7rem" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:".45rem", flexWrap:"wrap" }}>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:"#f0eaff" }}>{v.word}</span>
                        <span style={{ color:"#a78bfa55", fontStyle:"italic", fontSize:".78rem", fontFamily:"'Crimson Pro',serif" }}>{v.phonetic}</span>
                        <span style={{ fontSize:".65rem", padding:"1px 7px", borderRadius:999, background:LC[v.level]+"18", color:LC[v.level] }}>{v.level}</span>
                      </div>
                      <div style={{ fontSize:".83rem", color:"#c4b5fd", fontFamily:"'Crimson Pro',serif" }}>{v.meaning}</div>
                    </div>
                    <button className="btn" onClick={()=>setAllWords(p=>p.filter(w=>w.word!==v.word))}
                      style={{ padding:".28rem .65rem", borderRadius:8, background:"rgba(248,113,113,.1)", border:"1px solid rgba(248,113,113,.2)", color:"#f87171", fontSize:".75rem" }}>🗑</button>
                  </div>
                ))}
              </div>
            )}

            {/* Level stats */}
            <div style={{ background:"rgba(255,255,255,.02)", border:"1px solid rgba(255,255,255,.05)", borderRadius:14, padding:"1rem" }}>
              <div style={{ fontSize:".72rem", color:"#5a4a6a", marginBottom:".55rem" }}>Tiến độ theo cấp độ</div>
              {["A1","A2","B1","B2","C1","C2"].map(lv => {
                const total = allWords.filter(w=>w.level===lv).length;
                const know = allWords.filter(w=>w.level===lv && knownSet.has(w.word)).length;
                return (
                  <div key={lv} style={{ display:"flex", alignItems:"center", gap:".55rem", marginBottom:".38rem" }}>
                    <span style={{ fontSize:".68rem", fontWeight:700, color:LC[lv], width:22 }}>{lv}</span>
                    <div style={{ flex:1, height:6, borderRadius:3, background:"rgba(255,255,255,.06)", overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${total>0?(know/total)*100:0}%`, background:LC[lv], borderRadius:3, transition:"width .5s" }} />
                    </div>
                    <span style={{ fontSize:".68rem", color:"#5a4a6a", width:46, textAlign:"right" }}>{know}/{total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>


      {/* ══ SUPABASE SETUP MODAL ══ */}
      {showSbSetup && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",backdropFilter:"blur(8px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:"1.2rem"}}
          onClick={e=>{if(e.target===e.currentTarget)setShowSbSetup(false);}}>
          <div style={{background:"linear-gradient(145deg,#1a1030,#0e1a2e)",border:"1px solid rgba(167,139,250,.25)",borderRadius:24,padding:"1.8rem",width:"100%",maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem"}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#d4c8f0"}}>☁ Cài đặt đồng bộ</div>
              <button onClick={()=>setShowSbSetup(false)} style={{background:"none",border:"none",color:"#5a4a6a",fontSize:"1.3rem",cursor:"pointer"}}>✕</button>
            </div>

            <div style={{fontSize:".83rem",color:"#7a6a8a",lineHeight:1.65,marginBottom:"1.1rem",fontFamily:"'Crimson Pro',serif"}}>
              Nhập thông tin Supabase để đồng bộ dữ liệu giữa MacBook và iPhone.
              Xem file <b style={{color:"#a78bfa"}}>DONG_BO.html</b> trong zip để biết cách lấy thông tin này.
            </div>

            <div style={{marginBottom:".65rem"}}>
              <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".25rem",letterSpacing:".05em"}}>Project URL</div>
              <input className="fi" placeholder="https://abcdefghijk.supabase.co"
                value={sbForm.url} onChange={e=>setSbForm(f=>({...f,url:e.target.value}))}
                style={{fontFamily:"monospace",fontSize:".85rem"}} />
            </div>

            <div style={{marginBottom:".65rem"}}>
              <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".25rem",letterSpacing:".05em"}}>Mã đồng bộ <span style={{color:"#f472b6",fontWeight:700}}>— dùng chung trên mọi thiết bị</span></div>
              <input className="fi" placeholder="vd: hoctuvung2024 (tự đặt, nhớ dùng y chang trên iPhone)"
                value={sbForm.syncId} onChange={e=>setSbForm(f=>({...f,syncId:e.target.value}))}
                style={{fontSize:".85rem"}} />
              <div style={{fontSize:".68rem",color:"#4a3a5a",marginTop:".2rem"}}>
                💡 Đặt bất kỳ, ví dụ tên bạn. Nhập đúng mã này trên mọi thiết bị để đồng bộ cùng dữ liệu.
              </div>
            </div>

            <div style={{marginBottom:".8rem"}}>
              <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".25rem",letterSpacing:".05em"}}>anon public key</div>
              <input className="fi" type="password" placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={sbForm.key} onChange={e=>setSbForm(f=>({...f,key:e.target.value}))}
                style={{fontFamily:"monospace",fontSize:".85rem"}} />
            </div>

            {sbMsg && (
              <div style={{padding:".5rem .8rem",borderRadius:9,marginBottom:".8rem",fontSize:".82rem",
                background:sbMsg.startsWith("ok:")?"rgba(74,222,128,.1)":"rgba(248,113,113,.1)",
                border:`1px solid ${sbMsg.startsWith("ok:")?"rgba(74,222,128,.25)":"rgba(248,113,113,.25)"}`,
                color:sbMsg.startsWith("ok:")?"#86efac":"#fca5a5"}}>
                {sbMsg.startsWith("ok:")?"✅ ":"⚠ "}{sbMsg.replace(/^(ok|error):/, "")}
              </div>
            )}

            <button className="btn" onClick={testAndSaveSb} disabled={sbTesting}
              style={{width:"100%",padding:".85rem",borderRadius:12,background:sbTesting?"rgba(167,139,250,.25)":"linear-gradient(135deg,#a78bfa,#ec4899)",color:"white",border:"none",fontWeight:700,fontSize:"1rem"}}>
              {sbTesting ? "⏳ Đang kiểm tra kết nối..." : "🔗 Kết nối & Lưu"}
            </button>

            {true && (
              <button className="btn" onClick={()=>{
                localStorage.removeItem("lx_sb_url");
                localStorage.removeItem("lx_sb_key");
                localStorage.removeItem("lx_syncid");
                localStorage.removeItem("lx_userid");
                setSbMsg(""); setShowSbSetup(false); window.location.reload();
              }} style={{width:"100%",padding:".6rem",borderRadius:10,background:"transparent",border:"1px solid rgba(248,113,113,.2)",color:"#f87171",fontSize:".82rem",marginTop:".5rem"}}>
                🗑 Xoá & cài đặt lại từ đầu
              </button>
            )}

            <div style={{marginTop:".9rem",fontSize:".72rem",color:"#3a2a4a",textAlign:"center",lineHeight:1.6}}>
              URL và Key lưu trên máy bạn · Chỉ kết nối với Supabase của bạn
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign:"center", padding:".9rem", color:"#2a1a3a", fontSize:".65rem", fontFamily:"'Crimson Pro',serif", letterSpacing:".06em", borderTop:"1px solid rgba(255,255,255,.04)" }}>
        Lexicon · {allWords.length} từ · SRS · AI Lookup · {knownSet.size} đã thành thạo
      </div>
    </div>
  );
}


// ─── Root with API Key injection ──────────────────────────────────────────
export default function App() {
  return (
    <ApiKeyGate>
      {(apiKey, onLogout) => <VocabApp apiKey={apiKey} onLogout={onLogout} />}
    </ApiKeyGate>
  );
}
