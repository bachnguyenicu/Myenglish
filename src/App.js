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
      await anthropicFetch(key, {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "hi" }]
      });
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
const MODES = { DAILY:"daily", ERRORS:"errors", IELTS_W:"ielts_w", IELTS_S:"ielts_s", FLASHCARD:"flashcard", QUIZ:"quiz", SRS:"srs", FILL:"fill", LISTEN_DEF:"listen_def", DICTATION:"dictation", WRITING:"writing", SPEAKING:"speaking", CONVO:"convo", SHADOW:"shadow", READING:"reading", PODCAST:"podcast", JOURNAL:"journal", GRAMMAR:"grammar", REVIEW:"review", ADD:"add" };
const LC = { A1:"#4ade80", A2:"#86efac", B1:"#60a5fa", B2:"#818cf8", C1:"#f472b6", C2:"#fb923c" };
function shuffle(a) { return [...a].sort(() => Math.random() - 0.5); }

// ─── Google STT: Record audio and transcribe via proxy ────────────────────
let _mediaRecorder = null;
let _audioChunks   = [];

function startGoogleSTT({ onResult, onError, onStart, onEnd, continuous = false }) {
  if (!navigator.mediaDevices?.getUserMedia) {
    onError?.("Trình duyệt không hỗ trợ ghi âm"); return;
  }
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    _audioChunks = [];
    // Prefer opus for better compression; fallback to webm
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus" : "audio/webm";
    const mr = new MediaRecorder(stream, { mimeType });
    _mediaRecorder = mr;

    mr.ondataavailable = e => { if (e.data.size > 0) _audioChunks.push(e.data); };

    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      onEnd?.();
      if (_audioChunks.length === 0) { onError?.("Không nghe được gì"); return; }
      const blob = new Blob(_audioChunks, { type: mimeType });
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(",")[1];
        try {
          const res = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64, mimeType }),
          });
          if (!res.ok) throw new Error("STT proxy error " + res.status);
          const data = await res.json();
          onResult?.(data); // {transcript, confidence, words}
        } catch(e) {
          onError?.(e.message);
        }
      };
      reader.onerror = () => onError?.("Lỗi đọc audio");
      reader.readAsDataURL(blob);
    };

    mr.start(); // single continuous chunk — required for Google STT
    onStart?.();

    if (!continuous) {
      let silenceTimer = null;
      let hasSpoken = false;
      // Max 3 minutes — enough for IELTS Part 2 long turn
      const maxTimer = setTimeout(() => {
        if (mr.state === "recording") mr.stop();
      }, 180000);

      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkSilence = () => {
          if (mr.state !== "recording") { clearTimeout(maxTimer); audioCtx.close(); return; }
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a,b)=>a+b,0) / dataArray.length;
          if (avg > 8) {
            hasSpoken = true;
            clearTimeout(silenceTimer);
            silenceTimer = null;
          } else if (hasSpoken && !silenceTimer) {
            // 3s silence after speaking → auto stop
            silenceTimer = setTimeout(() => {
              if (mr.state === "recording") { clearTimeout(maxTimer); mr.stop(); }
            }, 3000);
          }
          requestAnimationFrame(checkSilence);
        };
        checkSilence();
      } catch(e) {
        clearTimeout(maxTimer);
        // Fallback: 3 min cap if AudioContext unavailable
        setTimeout(() => { if (mr.state === "recording") mr.stop(); }, 180000);
      }
    }
  }).catch(err => onError?.("Không truy cập được microphone: " + err.message));
}

function stopGoogleSTT() {
  if (_mediaRecorder && _mediaRecorder.state === "recording") {
    _mediaRecorder.stop();
  }
}

// Word-level pronunciation score using Google confidence
function pronunciationScore(words, targetText) {
  if (!words || words.length === 0) return { score: 0, wordScores: [] };
  const targetWords = targetText.toLowerCase().trim().split(/\s+/);
  const spokenWords  = words.map(w => w.word.toLowerCase().replace(/[^a-z']/g, ""));

  const wordScores = targetWords.map((tw, i) => {
    const sw = spokenWords[i];
    const gConf = words[i]?.confidence || 0; // 0-1 from Google
    if (!sw) return { word: tw, score: 0, status: "miss" };
    if (sw === tw) return { word: tw, score: Math.round(gConf * 100), status: "ok" };
    // partial match
    let m = 0;
    for (let j = 0; j < Math.min(sw.length, tw.length); j++) if (sw[j] === tw[j]) m++;
    const similarity = m / Math.max(sw.length, tw.length);
    const score = Math.round(gConf * similarity * 100);
    return { word: tw, spoken: words[i]?.word, score, status: score >= 60 ? "ok" : "bad" };
  });

  const avg = wordScores.length ? Math.round(wordScores.reduce((a,b)=>a+b.score,0)/wordScores.length) : 0;
  return { score: avg, wordScores };
}

// ─── TTS: Google Neural Voice with Web Speech fallback ───────────────────
// Shared AudioContext — created once, reused for all TTS (iOS compatible)
let _ttsAudio = null;
let _sharedAudioCtx = null;

function getAudioCtx() {
  if (!_sharedAudioCtx || _sharedAudioCtx.state === "closed") {
    _sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _sharedAudioCtx;
}

// Stop any currently playing TTS
function stopSpeak() {
  if (_ttsAudio) {
    try { _ttsAudio.stop(); } catch(_) {}
    _ttsAudio = null;
  }
  window.speechSynthesis?.cancel();
}

function speakFallback(text, rate=0.92) {
  // Original Web Speech API fallback
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  u.rate = isIOS ? Math.min(rate, 0.82) : rate;
  u.pitch = isIOS ? 0.95 : 1.0;
  u.volume = isIOS ? 0.9 : 1.0;
  const vs = window.speechSynthesis.getVoices();
  const best = vs.find(v=>v.name==="Samantha")||vs.find(v=>v.name.toLowerCase().includes("google")&&v.lang.startsWith("en-US"))||vs.find(v=>v.lang.startsWith("en-US"))||vs.find(v=>v.lang.startsWith("en"));
  if (best) u.voice = best;
  window.speechSynthesis.speak(u);
}

async function speak(text, rate=0.92, voice=null) {
  if (!text?.trim()) return;
  stopSpeak();

  try {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), rate, ...(voice ? {voice} : {}) }),
    });
    if (!res.ok) throw new Error("TTS proxy error");
    const { audio } = await res.json();
    if (!audio) throw new Error("No audio");

    // Decode base64 → ArrayBuffer → AudioContext (works on iOS)
    const binary = atob(audio);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const ctx = getAudioCtx();
    if (ctx.state === "suspended") await ctx.resume();

    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    _ttsAudio = source;
    source.onended = () => { _ttsAudio = null; };
    source.start(0);

  } catch(e) {
    // Fallback to Web Speech if Google TTS unavailable
    speakFallback(text, rate);
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

// ─── Fetch with retry on overload ────────────────────────────────────────
async function anthropicFetch(apiKey, body, maxRetries = 3) {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return data;
    const msg = data?.error?.message || `HTTP ${res.status}`;
    const isOverload = res.status === 529 || msg.toLowerCase().includes("overload");
    if (isOverload && attempt < maxRetries) {
      // Exponential backoff: 2s, 4s, 8s
      await new Promise(r => setTimeout(r, 2000 * attempt));
      continue;
    }
    lastErr = new Error(msg);
    break;
  }
  throw lastErr || new Error("Không thể kết nối API");
}

// ─── AI Word Lookup ───────────────────────────────────────────────────────
async function aiLookupWord(input, apiKey) {
  const systemPrompt = "You are a bilingual English-Vietnamese dictionary. Always respond with only a raw JSON object, no markdown, no explanation.";

  const userPrompt = `Look up this input: "${input}"

If it is an English word, provide its entry.
If it is a Vietnamese word or phrase, find the best English equivalent and provide that word's entry.

Return ONLY this JSON (no backticks, no extra text):
{"word":"<English word>","phonetic":"<IPA>","type":"<adj|verb|noun|adv|phrase>","level":"<A1|A2|B1|B2|C1|C2>","meaning":"<Vietnamese meaning>","meaningEn":"<English definition>","example":"<example sentence>"}`;

  const data = await anthropicFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  });

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

  const data = await anthropicFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: "You are a helpful assistant. Always respond with only raw JSON, no markdown fences, no explanation.",
    messages: [{ role: "user", content: prompt }]
  });
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
{"overallScore":7,"wordUsed":true,"wordUsedCorrectly":true,"correctedSentence":"the corrected sentence","spellingErrors":[{"wrong":"wrng","correct":"wrong","tip":"spelling tip"}],"grammarErrors":[{"error":"bad form","correction":"good form","rule":"quy tắc ngữ pháp tiếng Việt"}],"styleAdvice":"lời khuyên văn phong tiếng Việt","lessons":[{"title":"Ten bai hoc","explanation":"Giải thích ngắn bằng tiếng Việt","example":"An example sentence."}],"encouragement":"Lời động viên bằng tiếng Việt."}`;

  const data = await anthropicFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    system: "You are an English writing coach. Output ONLY a single-line compact JSON object. Never put double-quote characters inside JSON string values — use single quotes or reword instead. Never add markdown. Write all Vietnamese text with full diacritics (e.g. tiếng Việt, không phải tieng Viet).",
    messages: [{ role: "user", content: prompt }]
  });
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

  const data = await anthropicFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 120,
    system: "Reply with ONLY one English sentence. No quotes. No explanation.",
    messages: [{ role: "user", content: prompt }]
  });
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

  const data = await anthropicFetch(apiKey, {model:"claude-haiku-4-5-20251001",max_tokens:900,
    system:"Output ONLY raw JSON. No markdown. No explanation. Never use unescaped double-quote characters inside string values.",
    messages:[{role:"user",content:prompt}]});
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  let cv;
  try { cv = repairAndParseJSON(raw); } catch(e) { throw new Error("Lỗi đọc kịch bản: "+e.message); }
  if (!Array.isArray(cv.turns) || cv.turns.length < 2) throw new Error("Kịch bản không hợp lệ, thử lại nhé!");
  cv.topic = cv.topic || topic || "Hội thoại tiếng Anh";
  return cv;
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
{"overallScore":75,"summary":"tổng kết bằng tiếng Việt","turns":[{"turnIndex":1,"said":"what they said","refined":"more natural version","grammarNote":"ghi chú ngữ pháp","pronunciationTip":"mẹo phát âm","score":80}]}`;

  const data = await anthropicFetch(apiKey, {model:"claude-haiku-4-5-20251001",max_tokens:1200,
    system:"You are an English conversation coach. Output ONLY compact single-line JSON. Never use unescaped double quotes inside string values.",
    messages:[{role:"user",content:prompt}]});
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

  const data = await anthropicFetch(apiKey, {model:"claude-haiku-4-5-20251001",max_tokens:500,
    system:"Output ONLY raw JSON. No markdown. Never use unescaped double-quote characters inside string values.",
    messages:[{role:"user",content:prompt}]});
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  let ch;
  try { ch = repairAndParseJSON(raw); } catch(e) { throw new Error("Lỗi đọc challenge: "+e.message); }
  if (!ch.focusWord) throw new Error("Không tạo được challenge, thử lại nhé!");
  ch.listenSentence = ch.listenSentence || ch.speakSentence || focus.example || "";
  ch.speakSentence  = ch.speakSentence  || ch.listenSentence;
  ch.writePrompt    = ch.writePrompt    || `Viết 1-2 câu sử dụng từ "${ch.focusWord}".`;
  return ch;
}


// ─── Claude API — Reading Comprehension ──────────────────────────────────
async function generateReading(words, level, apiKey) {
  const picks = words.slice(0, 5).map(w => `"${w.word}" (${w.meaning})`).join(", ");
  const prompt = `Write a short English reading passage for a Vietnamese learner at ${level} level.
Include these vocabulary words naturally: ${picks}

Reply ONLY with raw JSON:
{
  "title": "<title in Vietnamese>",
  "passage": "<120-160 word passage in English using the vocabulary>",
  "questions": [
    {"q": "<comprehension question>", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A"},
    {"q": "<question>", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "B"},
    {"q": "<question>", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "C"}
  ],
  "vocabulary": ["word1","word2","word3"]
}`;
  const data = await anthropicFetch(apiKey, {model:"claude-haiku-4-5-20251001",max_tokens:900,
    system:"Output ONLY raw JSON. No markdown. Never use unescaped double-quote characters inside string values — use single quotes instead.",
    messages:[{role:"user",content:prompt}]});
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  try {
    const p = repairAndParseJSON(raw);
    if (!p.passage) throw new Error("Thiếu đoạn văn");
    if (!Array.isArray(p.questions) || p.questions.length === 0) throw new Error("Thiếu câu hỏi");
    if (!Array.isArray(p.vocabulary)) p.vocabulary = [];
    p.title = p.title || "Bài đọc";
    return p;
  } catch(e) { throw new Error("Lỗi đọc bài đọc: "+e.message); }
}

// ─── Claude API — Mini Podcast ────────────────────────────────────────────
async function generatePodcast(topic, level, apiKey) {
  const topicLine = topic ? `Topic: "${topic}"` : `Topic: choose an interesting everyday topic (travel, technology, health, environment, education, etc.)`;

  // Random IELTS question types for variety
  const qTypes = [
    "multiple choice (choose ONE answer from A/B/C/D)",
    "multiple choice (choose TWO answers — format: answer: 'AC')",
    "sentence completion — listener fills in a word/phrase from the recording",
    "short answer — answer in NO MORE THAN THREE WORDS",
    "matching — match speaker to statement",
    "summary completion — choose from a box of words",
  ];
  // Pick 4 varied question types
  const shuffledQ = [...qTypes].sort(()=>Math.random()-.5).slice(0,4);

  const prompt = `Create an authentic IELTS Listening test (Section 3 or 4 style) in English.
${topicLine}
Level: ${level}

SCRIPT requirements:
- 12-16 exchanges between Speaker A and Speaker B
- Natural academic English, realistic disagreement and discussion
- Include specific facts, numbers, or names that can be tested

QUESTION requirements — use these exact 4 question types:
1. Type: ${shuffledQ[0]}
2. Type: ${shuffledQ[1]}
3. Type: ${shuffledQ[2]}
4. Type: ${shuffledQ[3]}

ALL text must be in English (title, topic, questions, options, answers).
Spread answers across A B C D — do not use same answer twice in a row.

Reply ONLY with this JSON structure:
{"title":"Episode title in English","topic":"One-line topic in English","script":[{"speaker":"A","line":"..."},{"speaker":"B","line":"..."}],"questions":[{"type":"multiple choice","q":"What does Speaker A think about...?","options":["A. first option","B. second option","C. third option","D. fourth option"],"answer":"B"},{"type":"sentence completion","q":"The project deadline was moved to ___.","options":[],"answer":"the end of March"},{"type":"short answer","q":"What is the main problem Speaker B identifies?","options":[],"answer":"lack of funding"},{"type":"matching","q":"Which speaker mentions each point? A=Speaker A, B=Speaker B","options":["A. prefers online research","B. suggests interviewing experts","C. wants to extend the deadline","D. proposes a new structure"],"answer":"AC"}],"keyWords":["word1","word2","word3"]}`;

  const data = await anthropicFetch(apiKey, {
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: "You are an official IELTS exam creator. All content must be in English. Output ONLY a single valid JSON object. No markdown. No text before or after JSON. Use single quotes inside strings, never unescaped double quotes.",
    messages: [{role:"user", content:prompt}]
  });

  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  let parsed;
  try { parsed = repairAndParseJSON(raw); }
  catch(e) {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Không tạo được podcast, thử lại nhé!");
    try { parsed = JSON.parse(m[0]); } catch { throw new Error("Lỗi đọc dữ liệu podcast"); }
  }

  const script    = parsed.script || parsed.dialogue || parsed.conversation || [];
  const questions = parsed.questions || parsed.comprehension || [];
  const keyWords  = parsed.keyWords || parsed.keywords || [];

  if (!Array.isArray(script) || script.length === 0) throw new Error("Script podcast trống, thử lại nhé!");

  return {
    title:     parsed.title || topic || "IELTS Listening",
    topic:     parsed.topic || topic || "",
    script:    script.map(s => ({ speaker: s.speaker||"A", line: s.line||s.text||"" })),
    questions: Array.isArray(questions) ? questions : [],
    keyWords:  Array.isArray(keyWords) ? keyWords : [],
  };
}

// ─── Claude API — Journal Feedback ───────────────────────────────────────
async function checkJournal(entry, prompt, apiKey) {
  const p = `You are an English writing coach for Vietnamese learners. Review this journal entry.

Prompt: "${prompt}"
Entry: "${entry}"

Reply ONLY with raw JSON. No markdown. No unescaped double-quote characters inside strings — use single quotes instead.
{
  "score": 7,
  "correctedSentence": "fully corrected version of their entry",
  "grammarErrors": [{"error": "bad phrase", "correction": "good phrase", "rule": "quy tac ngu phap bằng tiếng Việt có dấu"}],
  "styleAdvice": "loi khuyen van phong bằng tiếng Việt có dấu, 1-2 cau",
  "lessons": [
    {"title": "Tên bài học tiếng Việt", "explanation": "Giải thích ngắn bằng tiếng Việt có dấu", "example": "An example sentence."}
  ],
  "encouragement": "1 cau dong vien bằng tiếng Việt có dấu"
}
Rules: grammarErrors can be empty []. lessons: 1-2 items focused on most important issues.`;

  const data = await anthropicFetch(apiKey, {model:"claude-haiku-4-5-20251001",max_tokens:900,
    system:"You are an English writing coach. Output ONLY compact single-line JSON. Never use unescaped double-quote characters inside string values. Write all Vietnamese text with full diacritics.",
    messages:[{role:"user",content:p}]});
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  let r;
  try { r = repairAndParseJSON(raw); } catch(e) { throw new Error("Lỗi đọc kết quả: "+e.message); }
  // Normalise field names (handle both corrected and correctedSentence)
  if (!r.correctedSentence && r.corrected) r.correctedSentence = r.corrected;
  if (!Array.isArray(r.grammarErrors)) r.grammarErrors = [];
  if (!Array.isArray(r.lessons)) r.lessons = [];
  r.score = r.score || 5;
  r.encouragement = r.encouragement || "";
  return r;
}

// ─── Journal prompt pool ──────────────────────────────────────────────────
const JOURNAL_PROMPTS = [
  "Hôm nay bạn học được điều gì thú vị?",
  "Mô tả 1 thói quen tốt bạn đang duy trì.",
  "Điều gì khiến bạn cảm thấy tự hào tuần này?",
  "Bạn muốn cải thiện điều gì trong tháng tới?",
  "Mô tả người bạn ngưỡng mộ nhất và lý do.",
  "Nếu có 1 ngày tự do hoàn toàn, bạn sẽ làm gì?",
  "Kể về 1 thử thách bạn đã vượt qua gần đây.",
  "Điều gì giúp bạn giữ động lực học tiếng Anh?",
  "Mô tả nơi bạn muốn đến nhất trên thế giới.",
  "Bạn nghĩ AI sẽ thay đổi cuộc sống như thế nào?",
];


// ─── Claude API — Check Rewrite (grammar-aware) ───────────────────────────
async function checkRewriteWithAI(userSentence, errorPhrase, correctionPhrase, rule, apiKey) {
  const prompt = `You are a strict English grammar coach reviewing a Vietnamese student's rewritten sentence.

The student previously made this mistake: "${errorPhrase}" (should be: "${correctionPhrase}")
Grammar rule being practiced: "${rule || "correct grammar"}"

Student's new sentence: "${userSentence}"

Evaluate TWO things:
1. Did the student fix the target error (avoid "${errorPhrase}" pattern, apply the rule)?
2. Does the sentence have any OTHER grammar or spelling mistakes?

Reply ONLY with raw JSON, no markdown, no unescaped double quotes in strings:
{"targetFixed": true, "otherErrors": [{"wrong": "Nowaday", "correct": "Nowadays", "note": "ghi chú ngắn"}], "corrected": "fully corrected version of the sentence", "feedback": "nhận xét ngắn bằng tiếng Việt có dấu"}

Rules:
- targetFixed: true only if the main grammar rule is correctly applied
- otherErrors: array of other mistakes found (empty [] if none)
- corrected: the fully corrected sentence (same as input if perfect)
- feedback: 1 sentence in Vietnamese summarizing the result`;

  try {
    const data = await anthropicFetch(apiKey, {
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: "Output ONLY raw JSON. No markdown. No unescaped double-quote characters inside string values.",
      messages: [{ role: "user", content: prompt }]
    });
    const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
    let parsed;
    try { parsed = repairAndParseJSON(raw); } catch(e) { throw new Error("parse failed"); }
    if (!Array.isArray(parsed.otherErrors)) parsed.otherErrors = [];
    parsed.correct = parsed.targetFixed === true;
    return parsed;
  } catch(e) {
    const ans = userSentence.trim().toLowerCase();
    const correct = ans.includes(correctionPhrase.toLowerCase()) && !ans.includes(errorPhrase.toLowerCase());
    return { correct, targetFixed: correct, otherErrors: [], corrected: userSentence, feedback: correct ? "Đã sửa đúng lỗi mục tiêu!" : "Chưa sửa đúng lỗi, thử lại nhé!" };
  }
}


// ─── Claude API — Generate IELTS Task 2 Prompt ───────────────────────────
async function generateIeltsPrompt(taskType, apiKey) {
  const types = {
    "opinion":    "Opinion/Agree or Disagree — 'To what extent do you agree or disagree?'",
    "discussion": "Discussion — 'Discuss both views and give your own opinion.'",
    "problem":    "Problem & Solution — 'What are the causes? What solutions can you suggest?'",
    "advantage":  "Advantages & Disadvantages — 'Do the advantages outweigh the disadvantages?'",
    "direct":     "Direct Question — two or three direct questions to answer",
  };
  const chosen = taskType === "random"
    ? Object.values(types)[Math.floor(Math.random()*Object.keys(types).length)]
    : (types[taskType] || types["opinion"]);

  const prompt = `Create ONE authentic IELTS Academic Writing Task 2 question.
Type: ${chosen}
Topic: choose from education, technology, environment, society, health, globalisation, or work.

Reply ONLY with JSON:
{"type":"${taskType==="random"?"(type name)":taskType}","topic":"topic in 2-3 words","question":"Full IELTS task 2 question (2-4 sentences, exactly as it appears on the exam). End with the task instruction.","timeLimit":40,"wordLimit":250}`;

  const data = await anthropicFetch(apiKey, {
    model:"claude-haiku-4-5-20251001", max_tokens:400,
    system:"Output ONLY raw JSON. No markdown.",
    messages:[{role:"user",content:prompt}]
  });
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  try { return repairAndParseJSON(raw); }
  catch { const m=raw.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); throw new Error("Không tạo được đề"); }
}

// ─── Claude API — Grade IELTS Task 2 Essay ───────────────────────────────
async function gradeIeltsEssay(question, essay, apiKey) {
  const wordCount = essay.trim().split(/\s+/).filter(Boolean).length;
  const prompt = `You are an official IELTS examiner. Grade this Task 2 essay strictly according to IELTS band descriptors.

QUESTION: ${question}

ESSAY (${wordCount} words):
${essay}

Grade each criterion from 0-9 (can use .5 increments). Be strict and realistic.

Reply ONLY with raw JSON (no unescaped double quotes in strings):
{
  "overallBand": 6.5,
  "wordCount": ${wordCount},
  "criteria": {
    "taskAchievement": {"band": 6.5, "comment": "specific feedback on how well the question is answered"},
    "coherenceCohesion": {"band": 6.0, "comment": "feedback on structure, paragraphing, linking"},
    "lexicalResource": {"band": 6.5, "comment": "feedback on vocabulary range and accuracy"},
    "grammaticalRange": {"band": 6.0, "comment": "feedback on grammar range and accuracy"}
  },
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"],
  "improvedIntro": "A rewritten introduction paragraph showing better style",
  "keyVocab": ["academic word 1", "academic word 2", "academic word 3", "academic word 4", "academic word 5"]
}`;

  const data = await anthropicFetch(apiKey, {
    model:"claude-haiku-4-5-20251001", max_tokens:1200,
    system:"You are a strict IELTS examiner. Output ONLY compact single-line JSON. No unescaped double quotes inside strings.",
    messages:[{role:"user",content:prompt}]
  });
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  try { return repairAndParseJSON(raw); }
  catch(e) { throw new Error("Lỗi đọc kết quả: "+e.message); }
}


// ─── Claude API — Generate IELTS Speaking Script ─────────────────────────
async function generateSpkScript(topic, apiKey) {
  const chosenTopic = topic || ["hometown & family","work & study","technology","travel & transport","environment","health & lifestyle","arts & culture","education"][Math.floor(Math.random()*8)];

  const prompt = `Create a full IELTS Speaking test script on the topic: "${chosenTopic}".

Reply ONLY with JSON:
{
  "topic": "${chosenTopic}",
  "part1": {
    "title": "Part 1 — Introduction & Interview",
    "questions": [
      "Do you work or are you a student?",
      "Tell me about your hometown.",
      "What do you enjoy doing in your free time?",
      "Do you prefer spending time indoors or outdoors? Why?"
    ]
  },
  "part2": {
    "title": "Part 2 — Individual Long Turn",
    "cueCard": "Describe a [person/place/event/thing] related to ${chosenTopic}.\n\nYou should say:\n• what/who it is\n• how you know about it\n• why it is important to you\n\nAnd explain how it has influenced your life.",
    "prepTime": 60,
    "speakTime": 120,
    "followUp": "Have you always felt this way about it?"
  },
  "part3": {
    "title": "Part 3 — Two-way Discussion",
    "questions": [
      "How important is ${chosenTopic} in modern society?",
      "Do you think attitudes towards ${chosenTopic} have changed in recent years?",
      "What role do you think governments should play regarding ${chosenTopic}?",
      "How might ${chosenTopic} change in the future?"
    ]
  }
}`;

  const data = await anthropicFetch(apiKey, {
    model:"claude-haiku-4-5-20251001", max_tokens:800,
    system:"Output ONLY raw JSON. No markdown. No unescaped double quotes in strings.",
    messages:[{role:"user",content:prompt}]
  });
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  let parsed;
  try { parsed = repairAndParseJSON(raw); }
  catch { const m=raw.match(/\{[\s\S]*\}/); if(m) { try { parsed=JSON.parse(m[0]); } catch{} } }
  if (!parsed) throw new Error("Lỗi tạo script");

  // Normalise — handle varied field names from AI
  const p1qs = parsed.part1?.questions || parsed.part1?.q || [];
  const p2cc = parsed.part2?.cueCard || parsed.part2?.cue_card || parsed.part2?.card || parsed.part2?.task || "";
  const p3qs = parsed.part3?.questions || parsed.part3?.q || [];

  // Validate minimums — use fallbacks if AI skipped fields
  return {
    topic: parsed.topic || chosenTopic,
    part1: {
      questions: Array.isArray(p1qs) && p1qs.length > 0 ? p1qs : [
        "Do you work or are you a student?",
        `Do you enjoy learning about ${chosenTopic}? Why?`,
        "What do you usually do in your free time?",
        "How has your daily routine changed recently?"
      ]
    },
    part2: {
      cueCard: p2cc || `Describe something related to ${chosenTopic} that has influenced you.

You should say:
• what it is
• when you first experienced it
• why it is important to you

And explain how it has affected your life.`,
    },
    part3: {
      questions: Array.isArray(p3qs) && p3qs.length > 0 ? p3qs : [
        `How important is ${chosenTopic} in modern society?`,
        `How have attitudes towards ${chosenTopic} changed over time?`,
        `What role should governments play regarding ${chosenTopic}?`,
        `How do you think ${chosenTopic} will develop in the future?`
      ]
    }
  };
}

// ─── Claude API — Grade IELTS Speaking ───────────────────────────────────
async function gradeSpkSim(partNum, answers, cueCard, apiKey) {
  const partDesc = partNum===1
    ? "Part 1 (Introduction & Interview)"
    : partNum===2 ? "Part 2 (Individual Long Turn — cue card)"
    : "Part 3 (Two-way Discussion)";
  const transcript = answers.map((a,i)=>`Q${i+1}: ${a.q}\nAnswer: "${a.answer}" (${a.duration}s)`).join("\n\n");
  const isP2 = partNum===2;

  const prompt = `You are a certified IELTS examiner. Grade this ${partDesc} response.
${isP2 && cueCard ? `CUE CARD: ${cueCard}\n` : ""}TRANSCRIPT:\n${transcript}

Grade strictly. Use 0.5 increments. Most Vietnamese learners score 5-6.5.
Reply ONLY with JSON (use single quotes inside strings):
{"overallBand":6.0,"criteria":{"fluencyCoherence":{"band":6.0,"comment":"feedback"},"lexicalResource":{"band":6.0,"comment":"feedback"},"grammaticalRange":{"band":5.5,"comment":"feedback"},"pronunciation":{"band":6.0,"comment":"feedback"}},"improvements":["tip 1","tip 2","tip 3"]${isP2?',"modelAnswer":"4-5 sentence model answer band 7-8"':''}}`;

  const data = await anthropicFetch(apiKey, {
    model:"claude-haiku-4-5-20251001", max_tokens:1000,
    system:"IELTS examiner. Output ONLY compact single-line JSON. No unescaped double quotes in strings. Write all Vietnamese text with full diacritics.",
    messages:[{role:"user",content:prompt}]
  });
  const raw = (data.content||[]).map(b=>b.text||"").join("").trim();
  try { return repairAndParseJSON(raw); }
  catch(e) { throw new Error("Lỗi đọc kết quả: "+e.message); }
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
  // Error Bank
  const [errorBank, setErrorBank] = useState(() => loadState("lx_errors", []));
  // Daily rewrite challenge
  const [rewriteIdx, setRewriteIdx] = useState(0);
  const [rewriteInput, setRewriteInput] = useState("");
  const [rewriteChecked, setRewriteChecked] = useState(false);
  const [rewriteScore, setRewriteScore] = useState({ correct:0, total:0 });
  const [rewriteAIResult, setRewriteAIResult] = useState(null);
  const [rewriteChecking, setRewriteChecking] = useState(false);
  const [ebPractice, setEbPractice] = useState({});
  // IELTS Writing Task 2
  const [ieltsPrompt, setIeltsPrompt] = useState(null);
  const [ieltsEssay, setIeltsEssay]   = useState("");
  const [ieltsResult, setIeltsResult] = useState(null);
  const [ieltsLoading, setIeltsLoading] = useState(false);
  const [ieltsGenLoading, setIeltsGenLoading] = useState(false);
  const [ieltsHistory, setIeltsHistory] = useState(() => loadState("lx_ielts_w", []));
  const [ieltsView, setIeltsView] = useState("write"); // write | history
  const [ieltsTaskType, setIeltsTaskType] = useState("random");
  // IELTS Speaking — per-part independent flow
  const [spkSimTopic,   setSpkSimTopic]   = useState("");
  const [spkSimPhase,   setSpkSimPhase]   = useState("menu"); // menu|p1|p2|p3|review
  const [spkSimPartNum, setSpkSimPartNum] = useState(0);
  const [spkSimQs,      setSpkSimQs]      = useState([]);   // questions for current part
  const [spkSimQIdx,    setSpkSimQIdx]    = useState(0);
  const [spkSimAnswers, setSpkSimAnswers] = useState([]);
  const [spkSimListening, setSpkSimListening] = useState(false);
  const [spkSimTimer,   setSpkSimTimer]   = useState(0);
  const [spkSimResult,  setSpkSimResult]  = useState(null);
  const [spkSimLoading, setSpkSimLoading] = useState(false);
  const [spkSimGenLoading, setSpkSimGenLoading] = useState(false);
  const [spkSimLiveText, setSpkSimLiveText] = useState("");
  const [spkSimCueCard, setSpkSimCueCard] = useState("");
  const spkSimQIdxRef  = useRef(0);
  const spkSimTimerRef = useRef(0);
  const spkSimTimerIv  = useRef(null); // Error Bank practice: {id: {input, checked}}
  // Daily Challenge
  const [dailyProgress, setDailyProgress] = useState(() => loadState("lx_daily", null));
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [dailyStep, setDailyStep]   = useState(0);   // 0=intro,1=listen,2=write,3=speak,4=done
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyListened, setDailyListened] = useState(false);
  const [dailyDictInput, setDailyDictInput] = useState("");
  const [dailyDictChecked, setDailyDictChecked] = useState(false);
  const [dailyWriteInput, setDailyWriteInput] = useState("");
  const [dailyWriteResult, setDailyWriteResult] = useState(null);
  const [dailyWriteLoading, setDailyWriteLoading] = useState(false);
  const [dailySpeakResult, setDailySpeakResult] = useState(null);
  const [dailySpeakListening, setDailySpeakListening] = useState(false);
  const dailySpeakRecRef = useRef(null);
  // Shadow Reading
  const [shadowSentences, setShadowSentences] = useState([]);
  const [shadowIdx, setShadowIdx]     = useState(0);
  const [shadowListening, setShadowListening] = useState(false);
  const [shadowResult, setShadowResult]   = useState(null);
  const [shadowScore, setShadowScore]   = useState({ total:0, count:0 });
  const [shadowDone, setShadowDone]     = useState(false);
  const shadowRecRef = useRef(null);
  // Reading comprehension
  const [readingPassage, setReadingPassage] = useState(null);
  const [readingAnswers, setReadingAnswers] = useState([]);
  const [readingChecked, setReadingChecked] = useState(false);
  const [readingLoading, setReadingLoading] = useState(false);
  const [readingErr, setReadingErr]     = useState("");
  // Podcast
  const [podcastEp, setPodcastEp]       = useState(null);
  const [podcastTopic, setPodcastTopic]   = useState("");
  const [podcastIeltsLevel, setPodcastIeltsLevel] = useState("B2");
  const [podcastPlaying, setPodcastPlaying] = useState(false);
  const [podcastQAnswers, setPodcastQAnswers] = useState([]);
  const [podcastChecked, setPodcastChecked] = useState(false);
  const [podcastLoading, setPodcastLoading] = useState(false);
  const [podcastShowScript, setPodcastShowScript] = useState(false);
  // Journal
  const [journalEntries, setJournalEntries] = useState(() => loadState("lx_journal", []));
  const [journalInput, setJournalInput]   = useState("");
  const [journalPrompt, setJournalPrompt] = useState("");
  const [journalResult, setJournalResult] = useState(null);
  const [journalLoading, setJournalLoading] = useState(false);
  const [journalView, setJournalView]     = useState("write"); // write | history
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
  useEffect(() => { try { localStorage.setItem("lx_errors", JSON.stringify(errorBank)); } catch {} }, [errorBank]);
  useEffect(() => { try { localStorage.setItem("lx_daily", JSON.stringify(dailyProgress)); } catch {} }, [dailyProgress]);
  useEffect(() => { try { localStorage.setItem("lx_journal", JSON.stringify(journalEntries)); } catch {} }, [journalEntries]);
  useEffect(() => { try { localStorage.setItem("lx_ielts_w", JSON.stringify(ieltsHistory)); } catch {} }, [ieltsHistory]);

  // Trigger cloud sync whenever any data changes
  useEffect(() => {
    scheduleSave(allWords, srsData, knownArr, learningArr, savedLessons);
  }, [allWords, srsData, knownArr, learningArr, savedLessons]);

  useEffect(() => { setCardIdx(0); setFlipped(false); }, [levelFilter]);
  useEffect(() => { window.speechSynthesis?.getVoices(); }, []);


  // Save errors from AI writing result to errorBank
  const saveErrors = (result, sourceSentence, sourceWord, sourceType) => {
    const newErrors = [];
    (result.grammarErrors||[]).forEach(e => {
      if (!e.error || !e.correction) return;
      newErrors.push({
        id: Date.now() + Math.random(),
        type: "grammar",
        source: sourceType,       // "writing" | "daily" | "journal"
        word: sourceWord || "",
        original: sourceSentence,
        error: e.error,
        correction: e.correction,
        rule: e.rule || "",
        reviewed: false,
        savedAt: Date.now(),
      });
    });
    (result.spellingErrors||[]).forEach(e => {
      if (!e.wrong || !e.correct) return;
      newErrors.push({
        id: Date.now() + Math.random(),
        type: "spelling",
        source: sourceType,
        word: sourceWord || "",
        original: sourceSentence,
        error: e.wrong,
        correction: e.correct,
        rule: e.tip || "",
        reviewed: false,
        savedAt: Date.now(),
      });
    });
    if (newErrors.length > 0) {
      setErrorBank(prev => [...newErrors, ...prev].slice(0, 200));
    }
  };

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
    .reading-opt{border-radius:10px;padding:.6rem .9rem;margin-bottom:.45rem;width:100%;text-align:left;font-size:.95rem;font-family:'Crimson Pro',serif;cursor:pointer;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:#e8e0f0;transition:all .18s;}
    .reading-opt:hover:not(:disabled){background:rgba(167,139,250,.15);border-color:#a78bfa;}
    .reading-opt.ok{background:rgba(74,222,128,.15);border-color:#4ade80!important;color:#4ade80;}
    .reading-opt.no{background:rgba(248,113,113,.15);border-color:#f87171!important;color:#f87171;}
    .journal-card{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:.9rem 1rem;margin-bottom:.7rem;}
    .sim-part-badge{display:inline-flex;align-items:center;gap:.4rem;padding:.25rem .8rem;border-radius:999px;font-size:.75rem;font-weight:700;}
    .rec-timer{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;color:#f87171;}
    .cue-card{background:linear-gradient(145deg,#fffbeb,#fef3c7);border-radius:16px;padding:1.2rem 1.4rem;color:#1a0a00;}
    .ielts-criterion{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:.75rem .9rem;margin-bottom:.5rem;}
    .ielts-band{font-family:'Playfair Display',serif;font-weight:900;font-size:1.4rem;}
    .word-count{font-size:.72rem;font-family:'Crimson Pro',serif;color:#5a4a6a;text-align:right;margin-top:.25rem;}
    .error-card{background:rgba(248,113,113,.05);border:1px solid rgba(248,113,113,.15);border-radius:14px;padding:.9rem 1rem;margin-bottom:.7rem;}
    .error-card.reviewed{opacity:.5;border-color:rgba(255,255,255,.07);background:rgba(255,255,255,.02);}
    .shadow-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:.3rem;}
    .shadow-bar-fill{height:100%;border-radius:3px;transition:width .5s;}
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
    [MODES.ERRORS]: errorBank.filter(e=>!e.reviewed).length > 0 ? `❌ Lỗi (${errorBank.filter(e=>!e.reviewed).length})` : "❌ Lỗi",
    [MODES.FLASHCARD]:"📇 Thẻ",
    [MODES.QUIZ]:"🧠 Quiz",
    [MODES.SRS]: dueCount>0 ? `🔁 SRS (${dueCount})` : "🔁 SRS",
    [MODES.FILL]:"✍️ Điền từ",
    [MODES.LISTEN_DEF]:"👂 Nghe nghĩa",
    [MODES.DICTATION]:"🎧 Chép chính tả",
    [MODES.WRITING]:"✏️ Writing",
    [MODES.SPEAKING]:"🎤 Speaking",
    [MODES.CONVO]:"💬 Hội thoại",
    [MODES.SHADOW]:"🪞 Shadow",
    [MODES.READING]:"📖 Đọc hiểu",
    [MODES.PODCAST]:"🎙 Podcast",
    [MODES.JOURNAL]:"📔 Nhật ký",
    [MODES.GRAMMAR]: savedLessons.length > 0 ? `📒 Grammar (${savedLessons.length})` : "📒 Grammar",
    [MODES.IELTS_W]:"🖊 IELTS Writing",
    [MODES.IELTS_S]:"🎙 IELTS Speaking",
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
              saveErrors(result, writingInput.trim(), writingWord?.word, "writing");
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
            if (spkListening) { stopGoogleSTT(); return; }
            const target = spkMode === "word" ? spkWord.word : spkWord.example;
            startGoogleSTT({
              onStart: () => setSpkListening(true),
              onEnd:   () => setSpkListening(false),
              onError: (msg) => { setSpkListening(false); setSpkResult({ error: msg }); },
              onResult: (data) => {
                const { transcript, words } = data;
                if (!transcript) { setSpkResult({ error: "Không nghe được, thử lại nhé!" }); return; }
                const { score, wordScores } = pronunciationScore(words||[], target);
                const diff = wordScores.map(w => ({ word:w.word, spoken:w.spoken, status:w.status }));
                setSpkResult({ transcript, score, diff, target, wordScores });
                setSpkHistory(h => [{ word:spkWord.word, mode:spkMode, score, ts:Date.now() }, ...h.slice(0,14)]);
              },
            });
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

          // Start listening — Google STT, user presses stop when done
          const listenUser = () => {
            if (convoListening) { stopGoogleSTT(); return; }
            convoResultPending.current = false;
            setConvoLiveText("");
            startGoogleSTT({
              onStart: () => setConvoListening(true),
              onEnd:   () => setConvoListening(false),
              onError: () => setConvoListening(false),
              onResult: (data) => {
                if (convoResultPending.current) return;
                convoResultPending.current = true;
                const fullText = data.transcript?.trim() || "";
                setConvoLiveText("");
                const turnIdx = convoTurnRef.current;
                const script  = convoScriptRef.current;
                if (!script || turnIdx >= script.turns.length) return;
                const turn = script.turns[turnIdx];
                if (!turn || turn.role !== "user") return;
                const ideal = turn.ideal || "";
                const { score, wordScores } = pronunciationScore(data.words||[], ideal);
                const diff = wordScores.map(w=>({word:w.word,spoken:w.spoken,status:w.status}));
                const logEntry = {role:"user",text:turn.prompt,userSaid:fullText,ideal,score,diff};
                convoLogRef.current = [...convoLogRef.current, logEntry];
                setConvoLog([...convoLogRef.current]);
                const nextIdx = turnIdx+1;
                convoTurnRef.current = nextIdx;
                setConvoTurn(nextIdx);
                if (nextIdx < script.turns.length && script.turns[nextIdx]?.role==="ai") {
                  setTimeout(()=>advanceAI(nextIdx), 700);
                }
              },
            });
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

          const unreviewedErrors = errorBank.filter(e=>!e.reviewed);
          const todayRewritePool = unreviewedErrors.slice(0, 3); // max 3 errors per day

          const startChallenge = async () => {
            setDailyLoading(true); setDailyChallenge(null);
            setDailyListened(false);
            setDailyWriteInput(""); setDailyWriteResult(null); setDailySpeakResult(null);
            setDailyDictInput(""); setDailyDictChecked(false);
            setRewriteIdx(0); setRewriteInput(""); setRewriteChecked(false);
            setRewriteScore({correct:0,total:0});
            try {
              const pool = allWords.length > 0 ? allWords : [];
              const challenge = await generateDailyChallenge(pool, levelFilter==="All"?"B1":levelFilter, apiKey);
              setDailyChallenge(challenge);
              // Go to rewrite step if there are unreviewed errors, else step 1
              setDailyStep(todayRewritePool.length > 0 ? -1 : 1);
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
              saveErrors(res, dailyWriteInput.trim(), dailyChallenge?.focusWord, "daily");
            } catch(e) { setDailyWriteResult({error:e.message}); }
            finally { setDailyWriteLoading(false); }
          };

          const startSpeak = () => {
            if (dailySpeakListening) { stopGoogleSTT(); return; }
            const target = dailyChallenge?.speakSentence || "";
            startGoogleSTT({
              onStart: () => setDailySpeakListening(true),
              onEnd:   () => setDailySpeakListening(false),
              onError: () => setDailySpeakListening(false),
              onResult: (data) => {
                const { transcript, words } = data;
                const { score, wordScores } = pronunciationScore(words||[], target);
                setDailySpeakResult({ transcript: transcript||"", score, wordScores });
              },
            });
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


          // ── STEP -1: REWRITE CHALLENGE (from Error Bank) ──────────────
          if (dailyStep===-1) {
            const pool = errorBank.filter(e=>!e.reviewed).slice(0, 3);
            if (pool.length === 0) { setDailyStep(1); return null; }
            const cur = pool[rewriteIdx];
            const normalize = s => s.trim().toLowerCase().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");

            const checkRewrite = async () => {
              if (!rewriteInput.trim() || rewriteChecking) return;
              setRewriteChecking(true);
              try {
                const result = await checkRewriteWithAI(rewriteInput.trim(), cur.error, cur.correction, cur.rule, apiKey);
                setRewriteAIResult(result);
                setRewriteChecked(true);
                setRewriteScore(p=>({correct:p.correct+(result.correct?1:0),total:p.total+1}));
                if (result.correct) setErrorBank(prev=>prev.map(e=>e.id===cur.id?{...e,reviewed:true}:e));
              } catch(e) { setRewriteChecked(true); setRewriteAIResult({correct:false,feedback:""}); }
              finally { setRewriteChecking(false); }
            };

            const nextRewrite = () => {
              if (rewriteIdx+1 >= pool.length) { setDailyStep(1); return; }
              setRewriteIdx(i=>i+1);
              setRewriteInput(""); setRewriteChecked(false);
            };

            return (
              <div>
                {/* Header */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".8rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,color:"#fca5a5"}}>🔁 Ôn lỗi hôm qua</div>
                  <div style={{fontSize:".72rem",color:"#5a4a6a"}}>{rewriteIdx+1} / {pool.length}</div>
                </div>
                <div style={{display:"flex",gap:"2px",marginBottom:"1rem"}}>
                  {pool.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<rewriteIdx?"#4ade80":i===rewriteIdx?"#fbbf24":"rgba(255,255,255,.08)",transition:"background .3s"}}/>)}
                </div>

                {/* Error card — chỉ hiện lỗi, ẩn đáp án */}
                <div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.18)",borderRadius:18,padding:"1.2rem",marginBottom:"1rem"}}>
                  <div style={{fontSize:".68rem",color:"#f87171",letterSpacing:".1em",textTransform:"uppercase",marginBottom:".6rem"}}>LỖI CẦN SỬA</div>

                  {/* Chỉ hiện từ sai — không hiện đáp án */}
                  <div style={{display:"flex",alignItems:"center",gap:".7rem",flexWrap:"wrap",marginBottom:".6rem"}}>
                    <span style={{background:"rgba(248,113,113,.18)",borderRadius:8,padding:".2rem .75rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:"1rem",textDecoration:"line-through"}}>{cur.error}</span>
                    <span style={{color:"#5a4a6a",fontSize:"1.1rem"}}>→</span>
                    <span style={{background:"rgba(255,255,255,.06)",borderRadius:8,padding:".2rem .75rem",color:"#4a3a5a",fontFamily:"'Crimson Pro',serif",fontSize:"1rem",letterSpacing:".15em"}}>{"?".repeat(Math.min(cur.correction.length, 8))}</span>
                  </div>

                  {/* Quy tắc ngữ pháp — gợi ý không lộ đáp án */}
                  {cur.rule&&<div style={{fontSize:".8rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginBottom:".5rem"}}>📌 {cur.rule}</div>}

                  {/* Câu gốc để có ngữ cảnh */}
                  {cur.original&&(
                    <div style={{fontSize:".8rem",color:"#4a3a5a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",borderLeft:"2px solid rgba(248,113,113,.25)",paddingLeft:".7rem"}}>
                      Câu gốc: "{cur.original.slice(0,120)}{cur.original.length>120?"...":""}"
                    </div>
                  )}
                </div>

                {/* Task — không gợi ý đáp án */}
                <div style={{background:"rgba(167,139,250,.07)",border:"1px solid rgba(167,139,250,.18)",borderRadius:14,padding:".8rem 1rem",marginBottom:".8rem",fontSize:".9rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                  ✍️ Viết lại câu trên và sửa lỗi <b style={{color:"#f87171"}}>"{cur.error}"</b> cho đúng
                </div>

                {!rewriteChecked ? (
                  <div>
                    <textarea className="writing-area" rows={3}
                      placeholder="Viết lại câu đã sửa lỗi..."
                      value={rewriteInput}
                      onChange={e=>setRewriteInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey&&rewriteInput.trim()) checkRewrite();}}
                      autoFocus
                    />
                    <div style={{fontSize:".65rem",color:"#3a2a4a",marginTop:".25rem",marginBottom:".8rem"}}>Ctrl+Enter để kiểm tra</div>
                    <button className="btn" onClick={checkRewrite} disabled={!rewriteInput.trim()||rewriteChecking}
                      style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#f87171,#f472b6)",color:"white",border:"none",fontWeight:700,fontSize:"1rem",opacity:(!rewriteInput.trim()||rewriteChecking)?0.5:1}}>
                      {rewriteChecking?"⏳ Đang kiểm tra...":"✅ Kiểm tra"}
                    </button>
                  </div>
                ) : (
                  <div className="fade-in">
                    {/* Result */}
                    {(()=>{
                      const isOk = rewriteAIResult?.correct === true;
                      return (
                        <div style={{textAlign:"center",padding:"1rem",borderRadius:14,marginBottom:"1rem",
                          background:isOk?"rgba(74,222,128,.1)":"rgba(248,113,113,.08)",
                          border:`1px solid ${isOk?"rgba(74,222,128,.25)":"rgba(248,113,113,.2)"}`}}>
                          <div style={{fontSize:"1.8rem",marginBottom:".3rem"}}>{isOk?"✅":"❌"}</div>
                          <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:isOk?"#4ade80":"#f87171",fontSize:"1rem",marginBottom:".3rem"}}>
                            {isOk?"Đúng rồi! Lỗi đã được sửa 🎉":"Chưa đúng — xem lại câu đã sửa"}
                          </div>
                          {!isOk&&(
                            <div style={{fontSize:".85rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginTop:".4rem"}}>
                              {rewriteAIResult?.feedback || `Gợi ý: dùng "${cur.correction}" thay cho "${cur.error}"`}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Score */}
                    <div style={{fontSize:".75rem",color:"#6a5a7a",textAlign:"center",marginBottom:".8rem"}}>
                      Tiến độ: {rewriteScore.correct + (normalize(rewriteInput).includes(normalize(cur.correction))&&!normalize(rewriteInput).includes(normalize(cur.error))?1:0)} / {pool.length} lỗi đã sửa đúng
                    </div>

                    <button className="btn" onClick={nextRewrite}
                      style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                      {rewriteIdx+1>=pool.length?"🚀 Bắt đầu Daily Challenge":"Lỗi tiếp theo →"}
                    </button>
                  </div>
                )}
              </div>
            );
          }

          // ── STEP 1: DICTATION ─────────────────────────────────────────
          if (dailyStep===1) {
            const normalize = s => s.trim().toLowerCase().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");
            const dictWords = (spoken, target) => {
              const sw = normalize(spoken).split(" ");
              const tw = normalize(target).split(" ");
              return tw.map((tw, i) => {
                const aw = sw[i] || "";
                if (aw === tw) return { word: tw, status: "ok" };
                if (!aw) return { word: tw, status: "miss" };
                return { word: tw, answer: aw, status: "bad" };
              });
            };
            const isCorrect = dailyDictChecked &&
              normalize(dailyDictInput) === normalize(c.listenSentence);

            return (
              <div>
                <ProgressBar/>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",fontWeight:700,color:"#fde68a",marginBottom:".6rem"}}>🎧 Nhiệm vụ 1: Nghe & Chép</div>
                <WordCard/>

                {/* Player */}
                <div style={{background:"linear-gradient(145deg,#1a1030,#0e1a2e)",border:"1px solid rgba(96,165,250,.2)",borderRadius:18,padding:"1.4rem",textAlign:"center",marginBottom:"1rem"}}>
                  <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".1em",marginBottom:".8rem"}}>NGHE RỒI GÕ LẠI CÂU BẠN NGHE ĐƯỢC</div>
                  <button className="mic-btn btn idle" onClick={()=>{setDailyListened(true);speak(c.listenSentence,0.78);}}>
                    {dailyListened?"🔊":"▶️"}
                  </button>
                  <div style={{fontSize:".78rem",color:"#5a4a6a",marginTop:".6rem",fontFamily:"'Crimson Pro',serif"}}>
                    {dailyListened?"Nhấn để nghe lại":"Nhấn ▶️ để nghe câu"}
                  </div>
                  {dailyListened && (
                    <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginTop:".7rem"}}>
                      {[[0.55,"🐢 Chậm"],[0.78,"▶ Chuẩn"],[1.0,"🐇 Nhanh"]].map(([r,l])=>(
                        <button key={r} className="btn" onClick={()=>speak(c.listenSentence,r)}
                          style={{padding:".28rem .7rem",borderRadius:999,background:"rgba(96,165,250,.1)",border:"1px solid rgba(96,165,250,.2)",color:"#93c5fd",fontSize:".72rem"}}>{l}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input — only show after first listen */}
                {dailyListened && !dailyDictChecked && (
                  <div className="fade-in">
                    <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".3rem",letterSpacing:".05em"}}>Gõ lại câu bạn vừa nghe</div>
                    <textarea className="dict-input" rows={3}
                      placeholder="Gõ lại câu vừa nghe..."
                      value={dailyDictInput}
                      onChange={e=>setDailyDictInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey&&dailyDictInput.trim()) setDailyDictChecked(true);}}
                      autoFocus
                    />
                    <div style={{fontSize:".65rem",color:"#3a2a4a",marginTop:".25rem",marginBottom:".8rem"}}>Ctrl+Enter để kiểm tra</div>
                    <button className="btn" onClick={()=>setDailyDictChecked(true)}
                      disabled={!dailyDictInput.trim()}
                      style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#60a5fa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:"1rem",opacity:!dailyDictInput.trim()?0.5:1}}>
                      ✅ Kiểm tra
                    </button>
                  </div>
                )}

                {/* Result */}
                {dailyDictChecked && (
                  <div className="fade-in">
                    {isCorrect ? (
                      <div style={{textAlign:"center",padding:".9rem",borderRadius:14,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",marginBottom:"1rem"}}>
                        <div style={{fontSize:"1.8rem",marginBottom:".2rem"}}>🎉</div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:"#4ade80"}}>Hoàn hảo! Chính xác 100%</div>
                      </div>
                    ) : (
                      <div style={{marginBottom:"1rem"}}>
                        <div style={{fontSize:".72rem",color:"#f87171",marginBottom:".5rem"}}>❌ Chưa chính xác — đỏ = sai, vàng = thiếu:</div>
                        <div style={{background:"rgba(0,0,0,.3)",borderRadius:12,padding:".8rem 1rem",fontFamily:"'Crimson Pro',serif",fontSize:"1rem",lineHeight:2}}>
                          {dictWords(dailyDictInput, c.listenSentence).map((d,i)=>(
                            <span key={i} className={`phone-char ${d.status==="ok"?"phone-ok":d.status==="miss"?"phone-miss":"phone-bad"}`}
                              title={d.status==="bad"?`Bạn gõ: "${d.answer}"`:d.status==="miss"?"Bỏ sót":""}>
                              {d.word}{" "}
                            </span>
                          ))}
                        </div>
                        <div style={{marginTop:".6rem",fontSize:".78rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif",display:"flex",alignItems:"center",gap:".5rem"}}>
                          ✅ Đáp án:
                          <button className="spkbtn btn" onClick={()=>speak(c.listenSentence,0.75)}>🔊 Nghe lại</button>
                        </div>
                        <div style={{background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.15)",borderRadius:10,padding:".5rem .9rem",marginTop:".4rem",fontSize:".9rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",color:"#86efac"}}>
                          "{c.listenSentence}"
                        </div>
                      </div>
                    )}
                    <button className="btn" onClick={()=>setDailyStep(2)}
                      style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                      Tiếp theo: Viết câu ✍️
                    </button>
                  </div>
                )}
              </div>
            );
          }

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
                  {/* Score banner */}
                  <div style={{background:"rgba(0,0,0,.3)",border:`2px solid ${(dailyWriteResult.overallScore||5)>=7?"rgba(74,222,128,.3)":"rgba(251,191,36,.3)"}`,borderRadius:18,padding:"1rem 1.2rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                    <div style={{textAlign:"center",minWidth:64}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:900,color:(dailyWriteResult.overallScore||5)>=7?"#4ade80":(dailyWriteResult.overallScore||5)>=5?"#fbbf24":"#f87171",lineHeight:1}}>{dailyWriteResult.overallScore||5}</div>
                      <div style={{fontSize:".6rem",color:"#5a4a6a"}}>/10</div>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:".95rem",color:(dailyWriteResult.overallScore||5)>=7?"#4ade80":"#fbbf24"}}>
                        {(dailyWriteResult.overallScore||5)>=9?"Xuất sắc 🌟":(dailyWriteResult.overallScore||5)>=7?"Tốt 👍":(dailyWriteResult.overallScore||5)>=5?"Khá 💪":"Cần cải thiện 📚"}
                      </div>
                      <div style={{fontSize:".82rem",color:"#a09080",fontFamily:"'Crimson Pro',serif",marginTop:".15rem",fontStyle:"italic"}}>{dailyWriteResult.encouragement}</div>
                    </div>
                  </div>

                  {/* 2-column original vs corrected */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:"1rem"}}>
                    <div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:14,padding:".9rem"}}>
                      <div style={{fontSize:".65rem",color:"#f87171",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>✏️ Câu của bạn</div>
                      <div style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{dailyWriteInput}</div>
                    </div>
                    <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:14,padding:".9rem"}}>
                      <div style={{fontSize:".65rem",color:"#4ade80",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <span>✅ Đã sửa</span>
                        <button className="spkbtn btn" style={{fontSize:".62rem",padding:".12rem .45rem"}} onClick={()=>speak(dailyWriteResult.correctedSentence||"",0.82)}>🔊</button>
                      </div>
                      <div style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{dailyWriteResult.correctedSentence}</div>
                    </div>
                  </div>

                  {/* Spelling errors */}
                  {dailyWriteResult.spellingErrors?.length>0 && (
                    <div className="lesson-card" style={{borderColor:"rgba(251,191,36,.18)",marginBottom:".8rem"}}>
                      <h4 style={{color:"#fbbf24"}}>🔤 Lỗi chính tả ({dailyWriteResult.spellingErrors.length})</h4>
                      {dailyWriteResult.spellingErrors.map((e,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".4rem",flexWrap:"wrap"}}>
                          <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".1rem .5rem",color:"#f87171",fontFamily:"'Crimson Pro',serif",textDecoration:"line-through"}}>{e.wrong}</span>
                          <span style={{color:"#5a4a6a"}}>→</span>
                          <span style={{background:"rgba(74,222,128,.15)",borderRadius:6,padding:".1rem .5rem",color:"#4ade80",fontFamily:"'Crimson Pro',serif",fontWeight:700}}>{e.correct}</span>
                          {e.tip&&<span style={{fontSize:".75rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>({e.tip})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Grammar errors */}
                  {dailyWriteResult.grammarErrors?.length>0 && (
                    <div className="lesson-card" style={{borderColor:"rgba(248,113,113,.18)",marginBottom:".8rem"}}>
                      <h4 style={{color:"#f87171"}}>📐 Lỗi ngữ pháp ({dailyWriteResult.grammarErrors.length})</h4>
                      {dailyWriteResult.grammarErrors.map((e,i)=>(
                        <div key={i} style={{marginBottom:".6rem",paddingBottom:i<dailyWriteResult.grammarErrors.length-1?".6rem":0,borderBottom:i<dailyWriteResult.grammarErrors.length-1?"1px solid rgba(255,255,255,.05)":"none"}}>
                          <div style={{display:"flex",alignItems:"center",gap:".6rem",flexWrap:"wrap",marginBottom:".25rem"}}>
                            <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".15rem .6rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:".9rem"}}>{e.error}</span>
                            <span style={{color:"#5a4a6a"}}>→</span>
                            <span style={{background:"rgba(74,222,128,.15)",borderRadius:6,padding:".15rem .6rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontWeight:600,fontSize:".9rem"}}>{e.correction}</span>
                          </div>
                          {e.rule&&<div style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>📌 {e.rule}</div>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Style advice */}
                  {dailyWriteResult.styleAdvice && (
                    <div className="lesson-card" style={{borderColor:"rgba(96,165,250,.18)",marginBottom:".8rem"}}>
                      <h4 style={{color:"#60a5fa"}}>💡 Lời khuyên văn phong</h4>
                      <div style={{fontSize:".9rem",color:"#a0b8d0",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>{dailyWriteResult.styleAdvice}</div>
                    </div>
                  )}

                  {/* Lessons with save button */}
                  {dailyWriteResult.lessons?.length>0 && (
                    <div style={{marginBottom:"1rem"}}>
                      <div style={{fontSize:".7rem",color:"#6a5a7a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:".6rem"}}>📚 Bài học từ câu này</div>
                      {dailyWriteResult.lessons.map((lesson,i)=>{
                        const alreadySaved = savedLessons.some(l=>l.title===lesson.title);
                        return (
                          <div key={i} className="lesson-card" style={{borderColor:alreadySaved?"rgba(74,222,128,.25)":"rgba(167,139,250,.18)"}}>
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".35rem"}}>
                              <h4 style={{color:alreadySaved?"#4ade80":"#c4b5fd",flex:1}}>📖 {lesson.title}</h4>
                              <button className="btn" onClick={()=>{
                                if(alreadySaved) return;
                                setSavedLessons(prev=>[{...lesson,word:c.focusWord,savedAt:Date.now()},...prev]);
                              }} style={{padding:".2rem .6rem",borderRadius:8,fontSize:".72rem",fontWeight:700,
                                background:alreadySaved?"rgba(74,222,128,.12)":"rgba(167,139,250,.15)",
                                border:`1px solid ${alreadySaved?"rgba(74,222,128,.3)":"rgba(167,139,250,.3)"}`,
                                color:alreadySaved?"#4ade80":"#c4b5fd",cursor:alreadySaved?"default":"pointer",whiteSpace:"nowrap"}}>
                                {alreadySaved?"✓ Đã lưu":"💾 Lưu lại"}
                              </button>
                            </div>
                            <div style={{fontSize:".88rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,marginBottom:".5rem"}}>{lesson.explanation}</div>
                            {lesson.example&&(
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


        {/* ══ SHADOW READING ══ */}
        {mode===MODES.SHADOW && (() => {
          const pool = filtered.length>=1 ? filtered : allWords;
          const cur  = shadowSentences[shadowIdx];
          const normalize = s => s.toLowerCase().trim().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");
          const wordScore = (spoken,target) => {
            const s=normalize(spoken).split(" "),t=normalize(target).split(" ");
            if(!t.length) return 0;
            let m=0; t.forEach((tw,i)=>{const sw=s[i]||"";if(sw===tw){m+=1;}else{let c=0;for(let j=0;j<Math.min(sw.length,tw.length);j++)if(sw[j]===tw[j])c++;m+=(c/Math.max(sw.length,tw.length,1))*.6;}});
            return Math.round((m/t.length)*100);
          };
          const scoreColor = s=>s>=85?"#4ade80":s>=65?"#fbbf24":"#f87171";

          const buildShadow = () => {
            const picked = shuffle(pool).slice(0, Math.min(8, pool.length));
            const sentences = picked.map(w=>({word:w.word,meaning:w.meaning,sentence:w.example,phonetic:w.phonetic}));
            setShadowSentences(sentences); setShadowIdx(0); setShadowResult(null);
            setShadowScore({total:0,count:0}); setShadowDone(false);
          };

          const playAndListen = (rate) => {
            if (!cur) return;
            speak(cur.sentence, rate||0.75);
            const est = Math.max(2000, cur.sentence.length*78);
            setTimeout(() => {
              startGoogleSTT({
                onStart: () => setShadowListening(true),
                onEnd:   () => setShadowListening(false),
                onError: () => setShadowListening(false),
                onResult: (data) => {
                  const { transcript, words } = data;
                  const { score, wordScores } = pronunciationScore(words||[], cur.sentence);
                  setShadowResult({ transcript: transcript||"", score, wordScores });
                  setShadowScore(prev=>({total:prev.total+score,count:prev.count+1}));
                },
              });
            }, est);
          };

          const nextShadow = () => {
            if(shadowIdx+1>=shadowSentences.length){setShadowDone(true);return;}
            setShadowIdx(i=>i+1); setShadowResult(null); setShadowListening(false);
          };

          if(shadowSentences.length===0) return (
            <div style={{textAlign:"center",padding:"2rem 1rem"}}>
              <div style={{fontSize:"3rem",marginBottom:".7rem"}}>🪞</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700,color:"#f0eaff",marginBottom:".5rem"}}>Shadow Reading</div>
              <div style={{fontSize:".88rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",lineHeight:1.75,maxWidth:380,margin:"0 auto 1.2rem"}}>
                Kỹ thuật <b style={{color:"#a78bfa"}}>shadowing</b> — nghe câu mẫu, đọc theo ngay lập tức. Cải thiện phát âm, nhịp điệu và tốc độ nói rất hiệu quả.
              </div>
              <div style={{display:"flex",gap:".6rem",justifyContent:"center",marginBottom:"1.2rem",flexWrap:"wrap"}}>
                {["🎯 Bắt sát giọng mẫu","⚡ Tăng tốc độ nói","🎵 Cải thiện ngữ điệu"].map(t=>(
                  <span key={t} style={{fontSize:".75rem",color:"#c4b5fd",background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.2)",borderRadius:999,padding:".25rem .75rem"}}>{t}</span>
                ))}
              </div>
              <button className="btn" onClick={buildShadow}
                style={{padding:".9rem 2.5rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#818cf8)",color:"white",fontSize:"1rem",border:"none",fontWeight:700}}>
                🎙 Bắt đầu
              </button>
            </div>
          );

          if(shadowDone) return (
            <div style={{textAlign:"center",padding:"2.5rem 1rem"}}>
              <div style={{fontSize:"3.5rem",marginBottom:".7rem"}}>🎉</div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:900,background:"linear-gradient(90deg,#a78bfa,#818cf8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                {shadowScore.count>0?Math.round(shadowScore.total/shadowScore.count):0} / 100
              </div>
              <div style={{color:"#8a7a9a",marginTop:".4rem",fontFamily:"'Crimson Pro',serif",fontSize:"1rem"}}>Điểm trung bình {shadowScore.count} câu</div>
              <button className="btn" onClick={buildShadow} style={{marginTop:"1.4rem",padding:".75rem 2rem",borderRadius:12,background:"linear-gradient(135deg,#a78bfa,#818cf8)",color:"white",fontSize:".98rem",border:"none"}}>🔄 Luyện lại</button>
            </div>
          );

          return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:".75rem",color:"#5a4a6a",marginBottom:".7rem"}}>
                <span>Câu {shadowIdx+1} / {shadowSentences.length}</span>
                {shadowScore.count>0 && <span style={{color:"#a78bfa"}}>TB: {Math.round(shadowScore.total/shadowScore.count)}/100</span>}
              </div>
              <div style={{background:"linear-gradient(145deg,#1c1035,#251545)",border:"1px solid rgba(167,139,250,.2)",borderRadius:22,padding:"1.5rem",marginBottom:"1rem",textAlign:"center"}}>
                <div style={{marginBottom:".8rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",fontWeight:900,color:"#f5f0ff"}}>{cur.word}</div>
                  <div style={{color:"#a78bfa",fontSize:".85rem",fontStyle:"italic",fontFamily:"'Crimson Pro',serif",opacity:.8}}>{cur.phonetic} — {cur.meaning}</div>
                </div>
                <div style={{background:"rgba(167,139,250,.08)",borderRadius:12,padding:".8rem 1rem",fontSize:"1rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0",lineHeight:1.6,marginBottom:"1.2rem",fontStyle:"italic"}}>
                  "{cur.sentence}"
                </div>
                <div style={{fontSize:".68rem",color:"#5a4a6a",marginBottom:".6rem",letterSpacing:".1em"}}>1. NGHE MẪU → 2. ĐỌC NGAY THEO</div>
                <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginBottom:".8rem"}}>
                  {[[0.6,"🐢 Chậm"],[0.78,"▶ Chuẩn"],[1.0,"🐇 Nhanh"]].map(([r,l])=>(
                    <button key={r} className="btn" onClick={()=>playAndListen(r)}
                      style={{padding:".38rem .85rem",borderRadius:999,background:"rgba(167,139,250,.14)",border:"1px solid rgba(167,139,250,.28)",color:"#c4b5fd",fontSize:".78rem"}}>
                      {l}
                    </button>
                  ))}
                </div>
                {shadowListening && (
                  <div style={{color:"#f87171",fontSize:".8rem",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}} className="pulse-rec">
                    🎤 Đang ghi âm giọng bạn...
                  </div>
                )}
              </div>

              {shadowResult && (
                <div className="fade-in" style={{background:"rgba(0,0,0,.25)",border:`1.5px solid ${scoreColor(shadowResult.score)}44`,borderRadius:14,padding:".9rem 1rem",marginBottom:".9rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:".8rem"}}>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.8rem",fontWeight:900,color:scoreColor(shadowResult.score),lineHeight:1,minWidth:50,textAlign:"center"}}>
                      {shadowResult.score}<span style={{fontSize:".6rem",color:"#5a4a6a"}}>/100</span>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:".8rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginBottom:".3rem"}}>
                        Bạn: "{shadowResult.transcript}"
                      </div>
                      <div className="shadow-bar">
                        <div className="shadow-bar-fill" style={{width:`${shadowResult.score}%`,background:scoreColor(shadowResult.score)}}/>
                      </div>
                    </div>
                    <button className="spkbtn btn" onClick={()=>speak(cur.sentence,0.75)}>🔊</button>
                  </div>
                </div>
              )}

              <div style={{display:"flex",gap:".7rem"}}>
                <button className="btn" onClick={()=>{setShadowResult(null);playAndListen(0.78);}}
                  style={{flex:1,padding:".82rem",borderRadius:14,background:"rgba(167,139,250,.1)",border:"1.5px solid rgba(167,139,250,.22)",color:"#c4b5fd",fontWeight:700,fontSize:".95rem"}}>
                  🔄 Thử lại
                </button>
                {shadowResult && (
                  <button className="btn" onClick={nextShadow}
                    style={{flex:1,padding:".82rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                    {shadowIdx+1>=shadowSentences.length?"🏁 Kết quả":"Tiếp →"}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* ══ READING COMPREHENSION ══ */}
        {mode===MODES.READING && (
          <div>
            {!readingPassage ? (
              <div>
                <div style={{background:"linear-gradient(145deg,rgba(74,222,128,.07),rgba(96,165,250,.05))",border:"1px solid rgba(74,222,128,.18)",borderRadius:20,padding:"1.2rem",marginBottom:"1.2rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#86efac",marginBottom:".3rem"}}>📖 Đọc hiểu</div>
                  <div style={{fontSize:".83rem",color:"#7a8a7a",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>
                    AI tạo đoạn văn chứa từ vựng bạn đang học → đọc hiểu → trả lời 3 câu hỏi trắc nghiệm.
                  </div>
                </div>
                {readingErr && <div style={{color:"#fca5a5",fontSize:".82rem",padding:".6rem .9rem",background:"rgba(248,113,113,.1)",borderRadius:10,marginBottom:".8rem"}}>⚠ {readingErr}</div>}
                {readingLoading ? (
                  <div>{[85,60,75,90,55].map((w,i)=><div key={i} className="shimmer" style={{height:13,borderRadius:7,marginBottom:9,width:`${w}%`}}/>)}</div>
                ) : (
                  <button className="btn" onClick={async()=>{
                    setReadingLoading(true); setReadingErr(""); setReadingPassage(null);
                    setReadingAnswers([]); setReadingChecked(false);
                    try {
                      const pool = allWords.length>=5?allWords:allWords;
                      const picked = shuffle(pool).slice(0,5);
                      const p = await generateReading(picked, levelFilter==="All"?"B1":levelFilter, apiKey);
                      setReadingPassage(p); setReadingAnswers(Array(p.questions.length).fill(""));
                    } catch(e){setReadingErr("Lỗi: "+e.message);}
                    finally{setReadingLoading(false);}
                  }} style={{width:"100%",padding:".9rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:"1rem"}}>
                    📖 Tạo bài đọc mới
                  </button>
                )}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
                  <div style={{fontSize:".75rem",color:"#4ade80",background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",borderRadius:999,padding:".2rem .8rem"}}>
                    📖 {readingPassage.title}
                  </div>
                  <button className="btn" onClick={()=>{setReadingPassage(null);setReadingChecked(false);}}
                    style={{padding:".25rem .7rem",borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".75rem"}}>
                    ✕ Bài mới
                  </button>
                </div>

                {/* Passage */}
                <div style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(74,222,128,.12)",borderRadius:16,padding:"1.1rem 1.2rem",marginBottom:"1rem",fontSize:"1rem",fontFamily:"'Crimson Pro',serif",lineHeight:1.85,color:"#d4c8f0"}}>
                  {readingPassage.passage.split(new RegExp(`(${(readingPassage.vocabulary||[]).join("|")})`, "gi")).map((part,i)=>{
                    const isVocab = (readingPassage.vocabulary||[]).some(v=>v.toLowerCase()===part.toLowerCase());
                    return isVocab
                      ? <b key={i} style={{color:"#fbbf24",borderBottom:"1px dotted #fbbf24"}}>{part}</b>
                      : <span key={i}>{part}</span>;
                  })}
                </div>

                {/* Questions */}
                <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".6rem"}}>Câu hỏi đọc hiểu</div>
                {readingPassage.questions.map((q,qi)=>(
                  <div key={qi} style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.06)",borderRadius:14,padding:"1rem",marginBottom:".8rem",opacity:readingChecked?.85:1}}>
                    <div style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif",fontWeight:600,color:"#f0eaff",marginBottom:".6rem"}}>
                      {qi+1}. {q.q}
                    </div>
                    {q.options.map((opt,oi)=>{
                      const letter = opt[0];
                      const isSelected = readingAnswers[qi]===letter;
                      const isCorrect = readingChecked && letter===q.answer;
                      const isWrong   = readingChecked && isSelected && letter!==q.answer;
                      let cls="reading-opt";
                      if(isCorrect) cls+=" ok";
                      else if(isWrong) cls+=" no";
                      return (
                        <button key={oi} className={cls} disabled={readingChecked}
                          onClick={()=>setReadingAnswers(prev=>{const a=[...prev];a[qi]=letter;return a;})}
                          style={{background:isSelected&&!readingChecked?"rgba(167,139,250,.15)":"",borderColor:isSelected&&!readingChecked?"#a78bfa":""}}>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ))}

                {!readingChecked ? (
                  <button className="btn" onClick={()=>setReadingChecked(true)}
                    disabled={readingAnswers.some(a=>!a)}
                    style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:"1rem",opacity:readingAnswers.some(a=>!a)?0.5:1}}>
                    ✅ Kiểm tra đáp án
                  </button>
                ) : (
                  <div className="fade-in">
                    <div style={{textAlign:"center",padding:".8rem",borderRadius:14,marginBottom:".9rem",
                      background:readingAnswers.filter((a,i)=>a===readingPassage.questions[i].answer).length===readingPassage.questions.length?"rgba(74,222,128,.1)":"rgba(167,139,250,.08)",
                      border:"1px solid rgba(167,139,250,.15)"}}>
                      {(()=>{const c=readingAnswers.filter((a,i)=>a===readingPassage.questions[i].answer).length;
                        return <><div style={{fontSize:"2rem"}}>{c===3?"🎉":c===2?"👍":"📚"}</div>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.3rem",fontWeight:700,color:c===3?"#4ade80":"#c4b5fd"}}>{c} / {readingPassage.questions.length} đúng</div></>;
                      })()}
                    </div>
                    <button className="btn" onClick={()=>{setReadingPassage(null);setReadingChecked(false);}}
                      style={{width:"100%",padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#4ade80,#22c55e)",color:"#0a1a0e",border:"none",fontWeight:700,fontSize:".98rem"}}>
                      📖 Bài đọc mới
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ PODCAST ══ */}
        {mode===MODES.PODCAST && (
          <div>
            {!podcastEp ? (
              <div>
                <div style={{background:"linear-gradient(145deg,rgba(251,191,36,.07),rgba(96,165,250,.05))",border:"1px solid rgba(251,191,36,.18)",borderRadius:20,padding:"1.2rem",marginBottom:"1rem"}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#fde68a",marginBottom:".25rem"}}>🎙 IELTS Podcast</div>
                  <div style={{fontSize:".83rem",color:"#9a8a6a",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                    AI tạo bài nghe theo format IELTS Listening — hội thoại tự nhiên, 4 câu hỏi trắc nghiệm A/B/C/D.
                  </div>
                </div>

                {/* Topic input */}
                <div style={{marginBottom:".7rem"}}>
                  <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".28rem",letterSpacing:".05em"}}>Chủ đề (để trống = AI tự chọn)</div>
                  <input className="fi" placeholder="vd: climate change, remote work, social media, AI in education..."
                    value={podcastTopic} onChange={e=>setPodcastTopic(e.target.value)}
                    onKeyDown={e=>e.key==="Enter"&&!podcastLoading&&document.getElementById("podcast-gen-btn")?.click()} />
                </div>

                {/* Level selector */}
                <div style={{marginBottom:"1rem"}}>
                  <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".28rem",letterSpacing:".05em"}}>Cấp độ IELTS</div>
                  <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                    {[["B1","IELTS 4-5","rgba(74,222,128,.2)","#4ade80"],["B2","IELTS 5.5-6.5","rgba(96,165,250,.2)","#60a5fa"],["C1","IELTS 7-8","rgba(167,139,250,.2)","#c4b5fd"],["C2","IELTS 8.5+","rgba(251,191,36,.2)","#fbbf24"]].map(([lv,desc,bg,col])=>(
                      <button key={lv} className="btn" onClick={()=>setPodcastIeltsLevel(lv)}
                        style={{padding:".32rem .85rem",borderRadius:999,border:`1.5px solid ${podcastIeltsLevel===lv?col+"cc":col+"44"}`,
                          background:podcastIeltsLevel===lv?bg:"transparent",color:podcastIeltsLevel===lv?col:"#5a4a6a",fontSize:".8rem",fontWeight:700}}>
                        {lv} <span style={{fontSize:".7rem",opacity:.7}}>({desc})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {podcastLoading ? (
                  <div>{[80,55,70,40,65].map((w,i)=><div key={i} className="shimmer" style={{height:13,borderRadius:7,marginBottom:9,width:`${w}%`}}/>)}</div>
                ) : (
                  <button id="podcast-gen-btn" className="btn" onClick={async()=>{
                    setPodcastLoading(true); setPodcastEp(null); setPodcastChecked(false);
                    setPodcastQAnswers([]); setPodcastShowScript(false);
                    try {
                      const ep = await generatePodcast(podcastTopic.trim(), podcastIeltsLevel, apiKey);
                      setPodcastEp(ep); setPodcastQAnswers(Array(ep.questions.length).fill(""));
                    } catch(e){alert("Lỗi: "+e.message);}
                    finally{setPodcastLoading(false);}
                  }} style={{width:"100%",padding:".9rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem"}}>
                    🎙 Tạo bài nghe
                  </button>
                )}
              </div>
            ) : (
              <div className="fade-in">
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem",flexWrap:"wrap",gap:".4rem"}}>
                  <div>
                    <div style={{fontSize:".75rem",color:"#fbbf24",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.2)",borderRadius:999,padding:".2rem .8rem",display:"inline-block"}}>
                      🎙 {podcastEp.title}
                    </div>
                    <div style={{fontSize:".72rem",color:"#5a4a6a",marginTop:".2rem",fontFamily:"'Crimson Pro',serif"}}>{podcastEp.topic}</div>
                  </div>
                  <button className="btn" onClick={()=>{window.speechSynthesis?.cancel();setPodcastEp(null);}}
                    style={{padding:".25rem .7rem",borderRadius:8,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".75rem"}}>
                    ✕ Tập mới
                  </button>
                </div>

                {/* Play full podcast */}
                <div style={{background:"rgba(0,0,0,.25)",border:"1px solid rgba(251,191,36,.18)",borderRadius:16,padding:"1.1rem",marginBottom:"1rem",textAlign:"center"}}>
                  <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".1em",marginBottom:".8rem"}}>NGHE TOÀN BỘ PODCAST</div>
                  <button className={`mic-btn btn ${podcastPlaying?"speak-pulse":"idle"}`}
                    onClick={async()=>{
                      if(podcastPlaying){
                        stopSpeak();
                        setPodcastPlaying(false);
                        return;
                      }
                      setPodcastPlaying(true);
                      const script = podcastEp.script;

                      // iOS-compatible sequential playback using AudioContext
                      // Prevents autoplay policy blocking after first line
                      let _podcastCtx = null;
                      let _podcastStopped = false;

                      const playLineIOS = async (idx) => {
                        if (_podcastStopped || idx >= script.length) {
                          setPodcastPlaying(false);
                          if (_podcastCtx) { _podcastCtx.close(); _podcastCtx = null; }
                          return;
                        }
                        const {speaker, line} = script[idx];
                        const voice = speaker === "A" ? "en-US-Neural2-D" : "en-US-Neural2-F";
                        const rate  = speaker === "A" ? 0.95 : 0.9;

                        // Keep reference for stop button
                        _ttsAudio = { pause: () => { _podcastStopped = true; if(_podcastCtx){_podcastCtx.close();_podcastCtx=null;} } };

                        try {
                          const res = await fetch("/api/tts", {
                            method:"POST",
                            headers:{"Content-Type":"application/json"},
                            body: JSON.stringify({ text: line, rate, voice }),
                          });
                          if (!res.ok) throw new Error("TTS error");
                          const { audio } = await res.json();
                          if (_podcastStopped) return;

                          // Decode base64 → ArrayBuffer
                          const binary = atob(audio);
                          const bytes  = new Uint8Array(binary.length);
                          for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);

                          // Use AudioContext — works on iOS after user gesture
                          if (!_podcastCtx || _podcastCtx.state === "closed") {
                            _podcastCtx = getAudioCtx();
                          }
                          if (_podcastCtx.state === "suspended") await _podcastCtx.resume();

                          const audioBuffer = await _podcastCtx.decodeAudioData(bytes.buffer);
                          if (_podcastStopped) return;

                          const source = _podcastCtx.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(_podcastCtx.destination);
                          source.onended = () => {
                            if (!_podcastStopped) setTimeout(() => playLineIOS(idx+1), 350);
                          };
                          source.start(0);

                        } catch(e) {
                          // Fallback: Web Speech API
                          if (_podcastStopped) return;
                          const u = new SpeechSynthesisUtterance(line);
                          u.lang="en-US"; u.rate=rate;
                          u.pitch = speaker==="A" ? 1.1 : 0.85;
                          u.onend = () => { if(!_podcastStopped) setTimeout(()=>playLineIOS(idx+1), 350); };
                          window.speechSynthesis.speak(u);
                        }
                      };
                      _podcastStopped = false;
                      playLineIOS(0);
                    }}
                    style={{width:72,height:72}}>
                    {podcastPlaying?"⏹":"▶️"}
                  </button>
                  <div style={{fontSize:".75rem",color:"#5a4a6a",marginTop:".5rem",fontFamily:"'Crimson Pro',serif"}}>
                    {podcastPlaying?"Đang phát... (nhấn ⏹ để dừng)":"Nhấn ▶️ nghe podcast"}
                  </div>
                  {(podcastEp.keyWords||[]).length>0 && (
                    <div style={{marginTop:".7rem",display:"flex",gap:".35rem",justifyContent:"center",flexWrap:"wrap"}}>
                      {podcastEp.keyWords.map((w,i)=><span key={i} style={{fontSize:".7rem",color:"#fbbf24",background:"rgba(251,191,36,.1)",borderRadius:999,padding:".15rem .6rem"}}>{w}</span>)}
                    </div>
                  )}
                </div>

                {/* Toggle script */}
                <button className="btn" onClick={()=>setPodcastShowScript(s=>!s)}
                  style={{width:"100%",marginBottom:".9rem",padding:".55rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#6a5a7a",fontSize:".82rem"}}>
                  {podcastShowScript?"🙈 Ẩn script":"👁 Xem script"}
                </button>

                {podcastShowScript && (
                  <div style={{background:"rgba(0,0,0,.25)",border:"1px solid rgba(255,255,255,.07)",borderRadius:14,padding:"1rem",marginBottom:"1rem",maxHeight:220,overflowY:"auto"}}>
                    {podcastEp.script.map((line,i)=>(
                      <div key={i} style={{marginBottom:".5rem",display:"flex",gap:".7rem",alignItems:"flex-start"}}>
                        <span style={{fontSize:".75rem",fontWeight:700,color:line.speaker==="A"?"#60a5fa":"#f472b6",minWidth:14}}>{line.speaker}</span>
                        <span style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#c4b5fd",flex:1,lineHeight:1.5}}>{line.line}</span>
                        <button className="spkbtn btn" style={{fontSize:".62rem",padding:".1rem .4rem"}} onClick={()=>speak(line.line,line.speaker==="A"?0.85:0.78)}>🔊</button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Questions */}
                <div style={{fontSize:".7rem",color:"#5a4a6a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".6rem"}}>Câu hỏi nghe hiểu</div>
                {podcastEp.questions.map((q,qi)=>{
                  const isMulti = q.type?.includes("TWO") || (typeof q.answer==="string" && q.answer.length===2 && /^[A-D]{2}$/.test(q.answer));
                  const isFreeText = !q.options || q.options.length===0;
                  const userAns = podcastQAnswers[qi] || "";
                  const isCorrect = podcastChecked && (
                    isFreeText
                      ? userAns.trim().toLowerCase() === (q.answer||"").trim().toLowerCase()
                      : isMulti
                        ? userAns.split("").sort().join("") === (q.answer||"").split("").sort().join("")
                        : userAns === q.answer
                  );

                  return (
                    <div key={qi} style={{background:"rgba(255,255,255,.025)",border:`1px solid ${podcastChecked?(isCorrect?"rgba(74,222,128,.25)":"rgba(248,113,113,.18)"):"rgba(255,255,255,.06)"}`,borderRadius:14,padding:"1rem",marginBottom:".8rem"}}>
                      {/* Question type badge */}
                      {q.type && <div style={{fontSize:".62rem",color:"#fbbf24",background:"rgba(251,191,36,.1)",borderRadius:6,padding:"1px 8px",display:"inline-block",marginBottom:".4rem",letterSpacing:".04em"}}>{q.type.toUpperCase()}</div>}
                      <div style={{fontSize:".92rem",fontFamily:"'Crimson Pro',serif",fontWeight:600,color:"#f0eaff",marginBottom:".6rem",lineHeight:1.5}}>{qi+1}. {q.q}</div>

                      {/* Multiple choice options */}
                      {!isFreeText && q.options.map((opt,oi)=>{
                        const letter = opt[0];
                        const isSel = isMulti ? userAns.includes(letter) : userAns===letter;
                        const isOk  = podcastChecked && (q.answer||"").includes(letter);
                        const isNo  = podcastChecked && isSel && !isOk;
                        let cls="reading-opt";
                        if(isOk)cls+=" ok"; else if(isNo)cls+=" no";
                        return (
                          <button key={oi} className={cls} disabled={podcastChecked}
                            onClick={()=>setPodcastQAnswers(p=>{
                              const a=[...p];
                              if(isMulti){
                                const cur=a[qi]||"";
                                a[qi]=cur.includes(letter)?cur.replace(letter,""):cur+letter;
                              } else { a[qi]=letter; }
                              return a;
                            })}
                            style={{background:isSel&&!podcastChecked?"rgba(251,191,36,.12)":"",borderColor:isSel&&!podcastChecked?"#fbbf24":""}}>
                            {opt}
                          </button>
                        );
                      })}

                      {/* Free text input (sentence completion / short answer) */}
                      {isFreeText && (
                        <div>
                          <input className="fi" disabled={podcastChecked}
                            placeholder={q.type?.includes("completion") ? "Fill in the blank..." : "Your answer (max 3 words)..."}
                            value={userAns}
                            onChange={e=>setPodcastQAnswers(p=>{const a=[...p];a[qi]=e.target.value;return a;})}
                            style={{fontSize:".9rem",fontFamily:"'Crimson Pro',serif"}}
                          />
                          {podcastChecked && (
                            <div style={{marginTop:".4rem",fontSize:".82rem",fontFamily:"'Crimson Pro',serif",
                              color:isCorrect?"#4ade80":"#fca5a5"}}>
                              {isCorrect?"✅ Correct!":"❌ Answer: "+q.answer}
                            </div>
                          )}
                        </div>
                      )}

                      {isMulti && !podcastChecked && (
                        <div style={{fontSize:".7rem",color:"#6a5a7a",marginTop:".3rem",fontStyle:"italic"}}>Select TWO answers</div>
                      )}
                    </div>
                  );
                })}

                {!podcastChecked ? (
                  <button className="btn" onClick={()=>setPodcastChecked(true)}
                    disabled={podcastQAnswers.some(a=>!a)}
                    style={{width:"100%",padding:".88rem",borderRadius:14,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:"1rem",opacity:podcastQAnswers.some(a=>!a)?0.5:1}}>
                    ✅ Kiểm tra
                  </button>
                ) : (
                  <div className="fade-in" style={{textAlign:"center",padding:"1rem 1.2rem",borderRadius:14,background:"rgba(251,191,36,.07)",border:"1px solid rgba(251,191,36,.2)",marginBottom:".9rem"}}>
                    {(()=>{
                      const total = podcastEp.questions.length;
                      const c = podcastQAnswers.filter((a,i)=>{
                        const q=podcastEp.questions[i];
                        const isFree = !q.options||q.options.length===0;
                        const isMulti = typeof q.answer==="string"&&q.answer.length===2&&/^[A-D]{2}$/.test(q.answer);
                        if(isFree) return (a||"").trim().toLowerCase()===(q.answer||"").trim().toLowerCase();
                        if(isMulti) return (a||"").split("").sort().join()===(q.answer||"").split("").sort().join();
                        return a===q.answer;
                      }).length;
                      const pct = Math.round(c/total*100);
                      const emoji = pct===100?"🏆":pct>=75?"🌟":pct>=50?"👍":"📻";
                      const band = pct===100?"Band 9":pct>=75?"Band 7-8":pct>=50?"Band 5-6":"Band dưới 5";
                      return (<>
                        <div style={{fontSize:"2.5rem",marginBottom:".3rem"}}>{emoji}</div>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.6rem",fontWeight:900,color:"#fbbf24"}}>{c} / {total}</div>
                        <div style={{fontSize:".82rem",color:"#9a7a3a",fontFamily:"'Crimson Pro',serif",marginTop:".2rem"}}>{band} — {pct}%</div>
                      </>);
                    })()}
                    <div style={{display:"flex",gap:".6rem",marginTop:".9rem",justifyContent:"center"}}>
                      <button className="btn" onClick={()=>{setPodcastChecked(false);setPodcastQAnswers(Array(podcastEp.questions.length).fill(""));}}
                        style={{padding:".6rem 1.2rem",borderRadius:12,background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",color:"#8a7a8a",fontWeight:600,fontSize:".88rem"}}>
                        🔄 Làm lại
                      </button>
                      <button className="btn" onClick={()=>{window.speechSynthesis?.cancel();setPodcastEp(null);}}
                        style={{padding:".6rem 1.2rem",borderRadius:12,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700,fontSize:".88rem"}}>
                        🎙 Bài mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ JOURNAL ══ */}
        {mode===MODES.JOURNAL && (
          <div>
            {/* Tab switcher */}
            <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
              {[["write","✍️ Viết hôm nay"],["history","📋 Nhật ký"]].map(([v,l])=>(
                <button key={v} className="btn" onClick={()=>setJournalView(v)}
                  style={{flex:1,padding:".5rem",borderRadius:10,fontFamily:"'Crimson Pro',serif",fontSize:".88rem",fontWeight:700,
                    background:journalView===v?"rgba(167,139,250,.18)":"rgba(255,255,255,.04)",
                    border:`1.5px solid ${journalView===v?"rgba(167,139,250,.35)":"rgba(255,255,255,.08)"}`,
                    color:journalView===v?"#c4b5fd":"#6a5a7a"}}>
                  {l}
                </button>
              ))}
            </div>

            {journalView==="write" && (
              <div>
                {/* Prompt */}
                <div style={{background:"linear-gradient(145deg,rgba(167,139,250,.07),rgba(244,114,182,.05))",border:"1px solid rgba(167,139,250,.18)",borderRadius:16,padding:".9rem 1rem",marginBottom:".9rem"}}>
                  <div style={{fontSize:".68rem",color:"#6a5a7a",letterSpacing:".1em",marginBottom:".3rem"}}>💬 CÂU HỎI HÔM NAY</div>
                  <div style={{fontSize:"1rem",color:"#d4c8f0",fontFamily:"'Crimson Pro',serif",fontWeight:600,lineHeight:1.5}}>
                    {journalPrompt || JOURNAL_PROMPTS[new Date().getDate() % JOURNAL_PROMPTS.length]}
                  </div>
                  <button className="btn" onClick={()=>setJournalPrompt(JOURNAL_PROMPTS[Math.floor(Math.random()*JOURNAL_PROMPTS.length)])}
                    style={{marginTop:".5rem",padding:".22rem .7rem",borderRadius:8,background:"rgba(167,139,250,.1)",border:"1px solid rgba(167,139,250,.2)",color:"#a78bfa",fontSize:".72rem"}}>
                    🔀 Câu hỏi khác
                  </button>
                </div>

                {!journalResult ? (
                  <div>
                    <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".3rem",letterSpacing:".05em"}}>Viết bằng tiếng Anh (3-5 câu)</div>
                    <textarea className="writing-area" rows={5}
                      placeholder="Write in English... (3-5 sentences)"
                      value={journalInput} onChange={e=>setJournalInput(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey&&!journalLoading&&journalInput.trim()){}}} />
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:".65rem",color:"#3a2a4a",marginTop:".25rem",marginBottom:".8rem"}}>
                      <span>{journalInput.trim().split(/\s+/).filter(Boolean).length} từ</span>
                      <span>Ctrl+Enter để gửi</span>
                    </div>
                    <button className="btn" onClick={async()=>{
                      if(!journalInput.trim()||journalLoading) return;
                      setJournalLoading(true); setJournalResult(null);
                      try {
                        const prompt = journalPrompt||JOURNAL_PROMPTS[new Date().getDate()%JOURNAL_PROMPTS.length];
                        const r = await checkJournal(journalInput.trim(), prompt, apiKey);
                        setJournalResult(r);
                        saveErrors(r, journalInput.trim(), "", "journal");
                        setJournalEntries(prev=>[{
                          date:new Date().toLocaleDateString("vi-VN"),
                          prompt, text:journalInput.trim(),
                          corrected:r.corrected, score:r.score, ts:Date.now()
                        },...prev.slice(0,29)]);
                      } catch(e){setJournalResult({error:e.message});}
                      finally{setJournalLoading(false);}
                    }} disabled={journalLoading||!journalInput.trim()}
                      style={{width:"100%",padding:".88rem",borderRadius:14,background:journalLoading?"rgba(167,139,250,.2)":"linear-gradient(135deg,#a78bfa,#f472b6)",color:"white",border:"none",fontWeight:700,fontSize:"1rem",opacity:!journalInput.trim()?0.5:1}}>
                      {journalLoading?"⏳ AI đang đọc...":"🤖 Nhận phản hồi"}
                    </button>
                    {journalLoading && <div style={{marginTop:".8rem"}}>{[75,55,65,45].map((w,i)=><div key={i} className="shimmer" style={{height:12,borderRadius:6,marginBottom:9,width:`${w}%`}}/>)}</div>}
                  </div>
                ) : journalResult.error ? (
                  <div style={{color:"#fca5a5",fontSize:".85rem",padding:".7rem .9rem",background:"rgba(248,113,113,.1)",borderRadius:10}}>
                    ⚠ {journalResult.error}
                    <button className="btn" onClick={()=>setJournalResult(null)} style={{marginLeft:".7rem",padding:".2rem .6rem",borderRadius:6,background:"rgba(248,113,113,.2)",border:"none",color:"#fca5a5",fontSize:".78rem"}}>Thử lại</button>
                  </div>
                ) : (
                  <div className="fade-in">
                    {/* Score + encouragement — same as Writing */}
                    <div style={{display:"flex",alignItems:"center",gap:".9rem",background:"rgba(0,0,0,.3)",border:`2px solid ${(journalResult.score||5)>=7?"rgba(74,222,128,.3)":"rgba(251,191,36,.3)"}`,borderRadius:18,padding:"1rem 1.2rem",marginBottom:"1rem"}}>
                      <div style={{textAlign:"center",minWidth:64}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontSize:"2.2rem",fontWeight:900,color:(journalResult.score||5)>=7?"#4ade80":(journalResult.score||5)>=5?"#fbbf24":"#f87171",lineHeight:1}}>{journalResult.score||5}</div>
                        <div style={{fontSize:".6rem",color:"#5a4a6a"}}>/10</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:".82rem",color:"#a09080",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>{journalResult.encouragement}</div>
                      </div>
                    </div>

                    {/* Original vs Corrected — 2 column like Writing */}
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".7rem",marginBottom:"1rem"}}>
                      <div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.15)",borderRadius:14,padding:".9rem"}}>
                        <div style={{fontSize:".65rem",color:"#f87171",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>✏️ Bài của bạn</div>
                        <div style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{journalInput}</div>
                      </div>
                      <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.15)",borderRadius:14,padding:".9rem"}}>
                        <div style={{fontSize:".65rem",color:"#4ade80",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span>✅ Đã sửa</span>
                          <button className="spkbtn btn" style={{fontSize:".62rem",padding:".12rem .45rem"}} onClick={()=>speak(journalResult.correctedSentence||journalResult.corrected||"",0.82)}>🔊</button>
                        </div>
                        <div style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#e8e0f0",lineHeight:1.6}}>{journalResult.correctedSentence||journalResult.corrected}</div>
                      </div>
                    </div>

                    {/* Grammar errors — same style as Writing */}
                    {journalResult.grammarErrors?.length>0 && (
                      <div className="lesson-card" style={{borderColor:"rgba(248,113,113,.18)",marginBottom:".8rem"}}>
                        <h4 style={{color:"#f87171"}}>📐 Lỗi ngữ pháp ({journalResult.grammarErrors.length})</h4>
                        {journalResult.grammarErrors.map((e,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:".6rem",marginBottom:".5rem",paddingBottom:i<journalResult.grammarErrors.length-1?".5rem":0,borderBottom:i<journalResult.grammarErrors.length-1?"1px solid rgba(255,255,255,.05)":"none",flexWrap:"wrap"}}>
                            <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".15rem .6rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",textDecoration:"line-through",fontSize:".9rem"}}>{e.error}</span>
                            <span style={{color:"#5a4a6a"}}>→</span>
                            <span style={{background:"rgba(74,222,128,.15)",borderRadius:6,padding:".15rem .6rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontWeight:600,fontSize:".9rem"}}>{e.correction||e.fix}</span>
                            {(e.rule)&&<div style={{width:"100%",fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>📌 {e.rule}</div>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Style advice */}
                    {(journalResult.styleAdvice||journalResult.styleNote) && (
                      <div className="lesson-card" style={{borderColor:"rgba(96,165,250,.18)",marginBottom:".8rem"}}>
                        <h4 style={{color:"#60a5fa"}}>💡 Lời khuyên về văn phong</h4>
                        <div style={{fontSize:".9rem",color:"#a0b8d0",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>{journalResult.styleAdvice||journalResult.styleNote}</div>
                      </div>
                    )}

                    {/* Lessons — with save button, same as Writing */}
                    {journalResult.lessons?.length>0 && (
                      <div style={{marginBottom:"1rem"}}>
                        <div style={{fontSize:".7rem",color:"#6a5a7a",letterSpacing:".1em",textTransform:"uppercase",marginBottom:".6rem"}}>📚 Bài học từ nhật ký này</div>
                        {journalResult.lessons.map((lesson,i)=>{
                          const alreadySaved = savedLessons.some(l=>l.title===lesson.title);
                          return (
                            <div key={i} className="lesson-card" style={{borderColor:alreadySaved?"rgba(74,222,128,.25)":"rgba(167,139,250,.18)"}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".35rem"}}>
                                <h4 style={{color:alreadySaved?"#4ade80":"#c4b5fd",flex:1}}>📖 {lesson.title}</h4>
                                <button className="btn" onClick={()=>{
                                  if(alreadySaved) return;
                                  setSavedLessons(prev=>[{...lesson,word:"(nhật ký)",savedAt:Date.now()},...prev]);
                                }} style={{padding:".2rem .6rem",borderRadius:8,fontSize:".72rem",fontWeight:700,
                                  background:alreadySaved?"rgba(74,222,128,.12)":"rgba(167,139,250,.15)",
                                  border:`1px solid ${alreadySaved?"rgba(74,222,128,.3)":"rgba(167,139,250,.3)"}`,
                                  color:alreadySaved?"#4ade80":"#c4b5fd",cursor:alreadySaved?"default":"pointer",whiteSpace:"nowrap"}}>
                                  {alreadySaved?"✓ Đã lưu":"💾 Lưu lại"}
                                </button>
                              </div>
                              <div style={{fontSize:".88rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,marginBottom:".5rem"}}>{lesson.explanation}</div>
                              {lesson.example&&(
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

                    {/* Actions */}
                    <div style={{display:"flex",gap:".7rem"}}>
                      <button className="btn" onClick={()=>{setJournalInput("");setJournalResult(null);}}
                        style={{flex:1,padding:".85rem",borderRadius:14,background:"rgba(167,139,250,.12)",border:"1.5px solid rgba(167,139,250,.25)",color:"#c4b5fd",fontWeight:700,fontSize:".95rem"}}>
                        ✏️ Viết lại
                      </button>
                      <button className="btn" onClick={()=>{setJournalInput("");setJournalResult(null);setJournalPrompt(JOURNAL_PROMPTS[Math.floor(Math.random()*JOURNAL_PROMPTS.length)]);}}
                        style={{flex:1,padding:".85rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#f472b6)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                        📔 Bài mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {journalView==="history" && (
              <div>
                {journalEntries.length===0 ? (
                  <div style={{textAlign:"center",padding:"3rem 1rem",color:"#5a4a6a"}}>
                    <div style={{fontSize:"3rem",marginBottom:".7rem"}}>📔</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#8a7a9a"}}>Chưa có nhật ký nào</div>
                    <div style={{fontSize:".85rem",marginTop:".3rem",fontFamily:"'Crimson Pro',serif"}}>Viết bài đầu tiên ở tab "✍️ Viết hôm nay"</div>
                  </div>
                ) : (
                  <>
                    <div style={{fontSize:".72rem",color:"#7a6a8a",marginBottom:".6rem"}}>{journalEntries.length} bài nhật ký</div>
                    {journalEntries.map((e,i)=>(
                      <div key={i} className="journal-card">
                        {/* Header: date + score */}
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".4rem"}}>
                          <div style={{fontSize:".7rem",color:"#a78bfa"}}>{e.date}</div>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:".9rem",fontWeight:700,color:e.score>=7?"#4ade80":"#fbbf24"}}>{e.score}/10</div>
                        </div>

                        {/* Prompt */}
                        <div style={{fontSize:".72rem",color:"#5a4a6a",fontStyle:"italic",marginBottom:".6rem",fontFamily:"'Crimson Pro',serif"}}>"{e.prompt}"</div>

                        {/* 2-column comparison if corrected exists */}
                        {e.corrected && e.corrected !== e.text ? (
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:".6rem"}}>
                            {/* Original */}
                            <div style={{background:"rgba(248,113,113,.06)",border:"1px solid rgba(248,113,113,.12)",borderRadius:10,padding:".65rem .8rem"}}>
                              <div style={{fontSize:".6rem",color:"#f87171",letterSpacing:".08em",marginBottom:".3rem",textTransform:"uppercase"}}>✏️ Bài của bạn</div>
                              <div style={{fontSize:".85rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0",lineHeight:1.65}}>{e.text}</div>
                            </div>
                            {/* Corrected */}
                            <div style={{background:"rgba(74,222,128,.06)",border:"1px solid rgba(74,222,128,.12)",borderRadius:10,padding:".65rem .8rem"}}>
                              <div style={{fontSize:".6rem",color:"#4ade80",letterSpacing:".08em",marginBottom:".3rem",textTransform:"uppercase",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                                <span>✅ Đã sửa</span>
                                <button className="spkbtn btn" style={{fontSize:".6rem",padding:".1rem .4rem"}} onClick={()=>speak(e.corrected,0.82)}>🔊</button>
                              </div>
                              <div style={{fontSize:".85rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0",lineHeight:1.65}}>{e.corrected}</div>
                            </div>
                          </div>
                        ) : (
                          <div style={{fontSize:".88rem",fontFamily:"'Crimson Pro',serif",color:"#c4b5fd",lineHeight:1.6}}>{e.text}</div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )}


        {/* ══ ERROR BANK ══ */}
        {mode===MODES.ERRORS && (() => {
          const unreviewed = errorBank.filter(e=>!e.reviewed);
          const reviewed   = errorBank.filter(e=>e.reviewed);
          const sourceLabel = s => s==="writing"?"✏️ Writing":s==="daily"?"🔥 Daily":s==="journal"?"📔 Nhật ký":"?";
          const sourceColor = s => s==="writing"?"#f472b6":s==="daily"?"#fbbf24":s==="journal"?"#a78bfa":"#7a6a8a";

          const markReviewed = (id) => setErrorBank(prev=>prev.map(e=>e.id===id?{...e,reviewed:true}:e));
          const deleteError  = (id) => setErrorBank(prev=>prev.filter(e=>e.id!==id));
          const getEB = (id) => ebPractice[id] || {input:"", checked:false};
          const setEBInput = (id, val) => setEbPractice(p=>({...p,[id]:{...p[id]||{input:"",checked:false},input:val,checked:false}}));
          const checkEB = async (id, errorObj, inputText) => {
            if (!inputText?.trim()) return;
            // Mark as checking first
            setEbPractice(p=>({...p,[id]:{...p[id]||{},input:inputText,checking:true,checked:false}}));
            try {
              const result = await checkRewriteWithAI(inputText.trim(), errorObj.error, errorObj.correction, errorObj.rule, apiKey);
              setEbPractice(p=>({...p,[id]:{
                input: inputText,
                checked: true,
                checking: false,
                aiCorrect: result.correct,
                aiFeedback: result.feedback,
                aiCorrected: result.corrected || "",
                aiOtherErrors: result.otherErrors || []
              }}));
            } catch(err) {
              setEbPractice(p=>({...p,[id]:{input:inputText,checked:true,checking:false,aiCorrect:false,aiFeedback:"Lỗi kết nối, thử lại nhé!"}}));
            }
          };
          const normalize = s => s.trim().toLowerCase().replace(/[^a-z\s']/g,"").replace(/\s+/g," ");

          return (
            <div>
              {/* Header */}
              <div style={{background:"linear-gradient(145deg,rgba(248,113,113,.07),rgba(167,139,250,.04))",border:"1px solid rgba(248,113,113,.18)",borderRadius:20,padding:"1.1rem",marginBottom:"1rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#fca5a5",marginBottom:".25rem"}}>❌ Personal Error Bank</div>
                <div style={{fontSize:".83rem",color:"#9a7a7a",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>
                  Tổng hợp lỗi từ Writing, Daily và Nhật ký. Ôn lại bằng Rewrite Challenge trong Daily mỗi ngày.
                </div>
                <div style={{display:"flex",gap:"1rem",marginTop:".6rem",fontSize:".75rem"}}>
                  <span style={{color:"#f87171"}}>❌ Chưa ôn: {unreviewed.length}</span>
                  <span style={{color:"#4ade80"}}>✓ Đã ôn: {reviewed.length}</span>
                  <span style={{color:"#5a4a6a"}}>Tổng: {errorBank.length}</span>
                </div>
              </div>

              {errorBank.length===0 ? (
                <div style={{textAlign:"center",padding:"3rem 1rem",color:"#5a4a6a"}}>
                  <div style={{fontSize:"3rem",marginBottom:".7rem"}}>🎯</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",color:"#8a7a9a",marginBottom:".4rem"}}>Chưa có lỗi nào được ghi nhận</div>
                  <div style={{fontSize:".85rem",fontFamily:"'Crimson Pro',serif"}}>Lỗi sẽ tự động lưu khi bạn làm Writing, Daily hoặc Nhật ký.</div>
                </div>
              ) : (
                <div>
                  {/* Unreviewed errors */}
                  {unreviewed.length>0 && (
                    <>
                      <div style={{fontSize:".7rem",color:"#f87171",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".6rem"}}>
                        ❌ Cần ôn lại ({unreviewed.length})
                      </div>
                      {unreviewed.map((e)=>{
                        const eb = getEB(e.id);
                        const isOk = eb.checked && eb.aiCorrect === true;
                        const isFail = eb.checked && !isOk;
                        return (
                          <div key={e.id} className="error-card" style={{borderColor:eb.checked?(isOk?"rgba(74,222,128,.3)":"rgba(248,113,113,.3)"):"rgba(248,113,113,.15)"}}>
                            {/* Header badges */}
                            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:".5rem",marginBottom:".6rem"}}>
                              <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                                <span style={{fontSize:".65rem",padding:"1px 8px",borderRadius:999,background:sourceColor(e.source)+"20",color:sourceColor(e.source),border:`1px solid ${sourceColor(e.source)}35`}}>{sourceLabel(e.source)}</span>
                                <span style={{fontSize:".65rem",padding:"1px 8px",borderRadius:999,background:"rgba(248,113,113,.12)",color:"#fca5a5",border:"1px solid rgba(248,113,113,.2)"}}>
                                  {e.type==="grammar"?"📐 Ngữ pháp":"🔤 Chính tả"}
                                </span>
                                {e.word&&<span style={{fontSize:".65rem",color:"#5a4a6a",fontStyle:"italic"}}>từ: {e.word}</span>}
                              </div>
                              <button className="btn" onClick={()=>deleteError(e.id)}
                                style={{padding:".18rem .5rem",borderRadius:6,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#4a3a5a",fontSize:".7rem"}}>✕</button>
                            </div>

                            {/* Error (ẩn đáp án) */}
                            <div style={{display:"flex",alignItems:"center",gap:".6rem",flexWrap:"wrap",marginBottom:".35rem"}}>
                              <span style={{background:"rgba(248,113,113,.15)",borderRadius:6,padding:".15rem .65rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:".92rem",textDecoration:"line-through"}}>{e.error}</span>
                              <span style={{color:"#5a4a6a"}}>→</span>
                              {eb.checked ? (
                                <span style={{background:"rgba(74,222,128,.18)",borderRadius:6,padding:".15rem .65rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontWeight:700,fontSize:".92rem"}}>{e.correction}</span>
                              ) : (
                                <span style={{background:"rgba(255,255,255,.05)",borderRadius:6,padding:".15rem .75rem",color:"#3a2a4a",fontFamily:"monospace",fontSize:".85rem",letterSpacing:".1em"}}>{"?".repeat(Math.min(e.correction.length,8))}</span>
                              )}
                            </div>

                            {e.rule&&<div style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginBottom:".4rem"}}>📌 {e.rule}</div>}

                            {/* Câu gốc */}
                            {e.original&&(
                              <div style={{fontSize:".78rem",color:"#4a3a5a",fontFamily:"'Crimson Pro',serif",marginBottom:".6rem",fontStyle:"italic",borderLeft:"2px solid rgba(248,113,113,.2)",paddingLeft:".6rem"}}>
                                "{e.original.slice(0,100)}{e.original.length>100?"...":""}"
                              </div>
                            )}

                            {/* Input hoặc kết quả */}
                            {!eb.checked ? (
                              <div>
                                <textarea
                                  className="writing-area"
                                  rows={2}
                                  placeholder="Viết lại câu đã sửa lỗi..."
                                  value={eb.input}
                                  onChange={ev=>setEBInput(e.id, ev.target.value)}
                                  onKeyDown={ev=>{if(ev.key==="Enter"&&ev.ctrlKey&&eb.input.trim()) checkEB(e.id,e,eb.input);}}
                                  style={{fontSize:".88rem",minHeight:60,marginBottom:".4rem"}}
                                />
                                <div style={{display:"flex",gap:".5rem"}}>
                                  <button className="btn" onClick={()=>checkEB(e.id,e,eb.input)} disabled={!eb.input.trim()||eb.checking}
                                    style={{flex:1,padding:".55rem",borderRadius:10,background:"linear-gradient(135deg,#f472b6,#a78bfa)",color:"white",border:"none",fontWeight:700,fontSize:".85rem",opacity:!eb.input.trim()?0.5:1}}>
                                    ✅ Kiểm tra
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="fade-in">
                                {/* Lỗi mục tiêu */}
                                <div style={{display:"flex",alignItems:"center",gap:".6rem",padding:".6rem .9rem",borderRadius:10,marginBottom:".6rem",
                                  background:isOk?"rgba(74,222,128,.08)":"rgba(248,113,113,.08)",
                                  border:`1px solid ${isOk?"rgba(74,222,128,.2)":"rgba(248,113,113,.2)"}`}}>
                                  <span style={{fontSize:"1.1rem"}}>{isOk?"✅":"❌"}</span>
                                  <div style={{flex:1}}>
                                    <div style={{fontFamily:"'Crimson Pro',serif",fontSize:".82rem",color:isOk?"#4ade80":"#f87171",fontWeight:700}}>
                                      {isOk?"Đã sửa đúng lỗi mục tiêu!":"Chưa sửa đúng lỗi mục tiêu"}
                                    </div>
                                    {eb.aiFeedback&&<div style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginTop:".15rem"}}>{eb.aiFeedback}</div>}
                                  </div>
                                </div>

                                {/* Câu đã sửa hoàn chỉnh */}
                                {eb.aiCorrected && eb.aiCorrected !== eb.input && (
                                  <div style={{marginBottom:".6rem"}}>
                                    <div style={{fontSize:".65rem",color:"#4ade80",letterSpacing:".08em",marginBottom:".25rem"}}>✅ CÂU ĐÃ SỬA HOÀN CHỈNH</div>
                                    <div style={{display:"flex",alignItems:"center",gap:".5rem",background:"rgba(74,222,128,.07)",border:"1px solid rgba(74,222,128,.15)",borderRadius:10,padding:".5rem .8rem"}}>
                                      <span style={{flex:1,fontSize:".9rem",fontFamily:"'Crimson Pro',serif",color:"#86efac",fontStyle:"italic"}}>{eb.aiCorrected}</span>
                                      <button className="spkbtn btn" style={{fontSize:".62rem",padding:".1rem .4rem"}} onClick={()=>speak(eb.aiCorrected,0.82)}>🔊</button>
                                    </div>
                                  </div>
                                )}

                                {/* Các lỗi khác trong câu */}
                                {eb.aiOtherErrors?.length>0 && (
                                  <div style={{background:"rgba(251,191,36,.06)",border:"1px solid rgba(251,191,36,.18)",borderRadius:10,padding:".7rem .9rem",marginBottom:".6rem"}}>
                                    <div style={{fontSize:".65rem",color:"#fbbf24",letterSpacing:".08em",marginBottom:".45rem"}}>⚠️ CÁC LỖI KHÁC TRONG CÂU</div>
                                    {eb.aiOtherErrors.map((err,oi)=>(
                                      <div key={oi} style={{display:"flex",alignItems:"center",gap:".5rem",marginBottom:".35rem",flexWrap:"wrap"}}>
                                        <span style={{background:"rgba(248,113,113,.15)",borderRadius:5,padding:".1rem .5rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:".85rem",textDecoration:"line-through"}}>{err.wrong}</span>
                                        <span style={{color:"#5a4a6a",fontSize:".9rem"}}>→</span>
                                        <span style={{background:"rgba(74,222,128,.15)",borderRadius:5,padding:".1rem .5rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontWeight:700,fontSize:".85rem"}}>{err.correct}</span>
                                        {err.note&&<span style={{fontSize:".75rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",fontStyle:"italic"}}>— {err.note}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                <div style={{display:"flex",gap:".5rem"}}>
                                  <button className="btn" onClick={()=>setEbPractice(p=>({...p,[e.id]:{input:"",checked:false}}))}
                                    style={{flex:1,padding:".5rem",borderRadius:10,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#7a6a8a",fontSize:".82rem"}}>
                                    ✏️ Thử lại
                                  </button>
                                  <button className="btn" onClick={()=>{ markReviewed(e.id); setEbPractice(p=>({...p,[e.id]:{input:"",checked:false}})); }}
                                    style={{flex:1,padding:".5rem",borderRadius:10,background:"rgba(74,222,128,.1)",border:"1px solid rgba(74,222,128,.2)",color:"#86efac",fontWeight:700,fontSize:".82rem"}}>
                                    ✓ Đã ôn xong
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Reviewed errors */}
                  {reviewed.length>0 && (
                    <>
                      <div style={{fontSize:".7rem",color:"#4ade80",letterSpacing:".08em",textTransform:"uppercase",margin:"1rem 0 .6rem"}}>
                        ✓ Đã ôn ({reviewed.length})
                      </div>
                      {reviewed.map((e)=>(
                        <div key={e.id} className="error-card reviewed">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <div style={{display:"flex",alignItems:"center",gap:".5rem",flex:1}}>
                              <span style={{background:"rgba(248,113,113,.12)",borderRadius:6,padding:".12rem .55rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",fontSize:".85rem",textDecoration:"line-through"}}>{e.error}</span>
                              <span style={{color:"#5a4a6a",fontSize:".75rem"}}>→</span>
                              <span style={{background:"rgba(74,222,128,.12)",borderRadius:6,padding:".12rem .55rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",fontSize:".85rem"}}>{e.correction}</span>
                            </div>
                            <button className="btn" onClick={()=>deleteError(e.id)}
                              style={{padding:".18rem .5rem",borderRadius:6,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#4a3a5a",fontSize:".7rem"}}>✕</button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Clear all reviewed */}
                  {reviewed.length>0 && (
                    <button className="btn" onClick={()=>setErrorBank(prev=>prev.filter(e=>!e.reviewed))}
                      style={{width:"100%",marginTop:".5rem",padding:".55rem",borderRadius:10,background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.07)",color:"#4a3a5a",fontSize:".78rem"}}>
                      🗑 Xoá tất cả đã ôn
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}


        {/* ══ IELTS WRITING TASK 2 ══ */}
        {mode===MODES.IELTS_W && (
          <div>
            {/* Tab switcher */}
            <div style={{display:"flex",gap:".5rem",marginBottom:"1rem"}}>
              {[["write","✍️ Luyện viết"],["history","📋 Lịch sử"]].map(([v,l])=>(
                <button key={v} className="btn" onClick={()=>setIeltsView(v)}
                  style={{flex:1,padding:".5rem",borderRadius:10,fontSize:".88rem",fontWeight:700,
                    background:ieltsView===v?"rgba(167,139,250,.18)":"rgba(255,255,255,.04)",
                    border:`1.5px solid ${ieltsView===v?"rgba(167,139,250,.35)":"rgba(255,255,255,.08)"}`,
                    color:ieltsView===v?"#c4b5fd":"#6a5a7a"}}>
                  {l}
                </button>
              ))}
            </div>

            {ieltsView==="write" && (
              <div>
                {/* Task type selector */}
                {!ieltsPrompt && (
                  <div>
                    <div style={{background:"linear-gradient(145deg,rgba(167,139,250,.07),rgba(96,165,250,.05))",border:"1px solid rgba(167,139,250,.18)",borderRadius:20,padding:"1.2rem",marginBottom:"1rem"}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#c4b5fd",marginBottom:".25rem"}}>🖊 IELTS Writing Task 2</div>
                      <div style={{fontSize:".83rem",color:"#8a7a9a",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>
                        AI tạo đề thi thật → bạn viết essay 250+ từ → AI chấm band score theo 4 tiêu chí chính thức của IELTS.
                      </div>
                    </div>

                    <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".4rem",letterSpacing:".05em"}}>Chọn dạng đề</div>
                    <div style={{display:"flex",gap:".4rem",flexWrap:"wrap",marginBottom:"1rem"}}>
                      {[
                        ["random","🎲 Random","#a78bfa"],
                        ["opinion","💬 Opinion","#f472b6"],
                        ["discussion","⚖️ Discussion","#60a5fa"],
                        ["problem","🔧 Problem/Solution","#4ade80"],
                        ["advantage","📊 Adv/Disadv","#fbbf24"],
                        ["direct","❓ Direct Q","#fb923c"],
                      ].map(([val,label,col])=>(
                        <button key={val} className="btn" onClick={()=>setIeltsTaskType(val)}
                          style={{padding:".32rem .85rem",borderRadius:999,fontSize:".8rem",fontWeight:700,
                            border:`1.5px solid ${ieltsTaskType===val?col+"cc":col+"44"}`,
                            background:ieltsTaskType===val?col+"22":"transparent",
                            color:ieltsTaskType===val?col:"#5a4a6a"}}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {ieltsGenLoading ? (
                      <div>{[85,65,75,50].map((w,i)=><div key={i} className="shimmer" style={{height:13,borderRadius:7,marginBottom:9,width:`${w}%`}}/>)}</div>
                    ) : (
                      <button className="btn" onClick={async()=>{
                        setIeltsGenLoading(true); setIeltsPrompt(null); setIeltsEssay(""); setIeltsResult(null);
                        try {
                          const p = await generateIeltsPrompt(ieltsTaskType, apiKey);
                          setIeltsPrompt(p);
                        } catch(e) { alert("Lỗi: "+e.message); }
                        finally { setIeltsGenLoading(false); }
                      }} style={{width:"100%",padding:".9rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:"1rem"}}>
                        🎯 Tạo đề thi
                      </button>
                    )}
                  </div>
                )}

                {/* Essay writing area */}
                {ieltsPrompt && !ieltsResult && (
                  <div className="fade-in">
                    {/* Question card */}
                    <div style={{background:"linear-gradient(145deg,#1a1030,#0e1422)",border:"1px solid rgba(167,139,250,.25)",borderRadius:18,padding:"1.2rem",marginBottom:"1rem"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".5rem"}}>
                        <span style={{fontSize:".65rem",color:"#a78bfa",background:"rgba(167,139,250,.15)",borderRadius:6,padding:"1px 8px",textTransform:"uppercase",letterSpacing:".06em"}}>{ieltsPrompt.type} · {ieltsPrompt.topic}</span>
                        <span style={{fontSize:".7rem",color:"#5a4a6a"}}>⏱ {ieltsPrompt.timeLimit||40} min · {ieltsPrompt.wordLimit||250}+ words</span>
                      </div>
                      <div style={{fontSize:"1rem",fontFamily:"'Crimson Pro',serif",color:"#d4c8f0",lineHeight:1.75}}>
                        {ieltsPrompt.question}
                      </div>
                    </div>

                    {/* Essay textarea */}
                    <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".3rem",letterSpacing:".05em"}}>Viết essay của bạn</div>
                    <textarea className="writing-area" rows={14}
                      placeholder="Write your IELTS Task 2 essay here...&#10;&#10;Aim for at least 250 words. Structure: Introduction → Body paragraph 1 → Body paragraph 2 → Conclusion"
                      value={ieltsEssay}
                      onChange={e=>setIeltsEssay(e.target.value)}
                      style={{fontSize:".95rem",lineHeight:1.7,fontFamily:"'Crimson Pro',serif"}}
                    />
                    <div className="word-count">
                      {(()=>{
                        const wc = ieltsEssay.trim().split(/\s+/).filter(Boolean).length;
                        const col = wc>=250?"#4ade80":wc>=200?"#fbbf24":"#f87171";
                        return <span style={{color:col}}>{wc} words {wc>=250?"✓":wc>=200?"(getting there)":"(need "+( 250-wc)+" more)"}</span>;
                      })()}
                    </div>

                    <div style={{display:"flex",gap:".6rem",marginTop:".8rem"}}>
                      <button className="btn" onClick={()=>{setIeltsPrompt(null);setIeltsEssay("");}}
                        style={{padding:".75rem 1rem",borderRadius:12,background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.1)",color:"#7a6a8a",fontSize:".88rem"}}>
                        🔄 Đề mới
                      </button>
                      <button className="btn" onClick={async()=>{
                        const wc = ieltsEssay.trim().split(/\s+/).filter(Boolean).length;
                        if(wc < 150) { alert("Essay quá ngắn! Cần ít nhất 150 từ."); return; }
                        setIeltsLoading(true);
                        try {
                          const r = await gradeIeltsEssay(ieltsPrompt.question, ieltsEssay.trim(), apiKey);
                          setIeltsResult(r);
                          setIeltsHistory(prev=>[{
                            date: new Date().toLocaleDateString("vi-VN"),
                            type: ieltsPrompt.type,
                            topic: ieltsPrompt.topic,
                            question: ieltsPrompt.question,
                            essay: ieltsEssay.trim(),
                            band: r.overallBand,
                            wordCount: r.wordCount,
                            ts: Date.now()
                          }, ...prev.slice(0,19)]);
                        } catch(e){ alert("Lỗi chấm bài: "+e.message); }
                        finally{ setIeltsLoading(false); }
                      }} disabled={ieltsLoading||ieltsEssay.trim().split(/\s+/).filter(Boolean).length<150}
                        style={{flex:1,padding:".85rem",borderRadius:14,
                          background:ieltsLoading?"rgba(167,139,250,.2)":"linear-gradient(135deg,#a78bfa,#ec4899)",
                          color:"white",border:"none",fontWeight:700,fontSize:"1rem",
                          opacity:ieltsEssay.trim().split(/\s+/).filter(Boolean).length<150?0.5:1}}>
                        {ieltsLoading?"⏳ AI đang chấm bài...":"📊 Nộp bài & Chấm điểm"}
                      </button>
                    </div>
                    {ieltsLoading && <div style={{marginTop:".8rem"}}>{[80,60,70,50,65].map((w,i)=><div key={i} className="shimmer" style={{height:12,borderRadius:6,marginBottom:8,width:`${w}%`}}/>)}</div>}
                  </div>
                )}

                {/* Results */}
                {ieltsResult && (
                  <div className="fade-in">
                    {/* Overall band */}
                    <div style={{background:"rgba(0,0,0,.35)",border:"2px solid rgba(167,139,250,.3)",borderRadius:20,padding:"1.2rem 1.4rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1.2rem"}}>
                      <div style={{textAlign:"center",minWidth:80}}>
                        <div className="ielts-band" style={{color:ieltsResult.overallBand>=7?"#4ade80":ieltsResult.overallBand>=6?"#fbbf24":"#f87171",fontSize:"2.8rem",lineHeight:1}}>
                          {ieltsResult.overallBand}
                        </div>
                        <div style={{fontSize:".65rem",color:"#5a4a6a",marginTop:".1rem"}}>Overall Band</div>
                      </div>
                      <div style={{flex:1}}>
                        <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.05rem",color:"#f0eaff",marginBottom:".15rem"}}>
                          {ieltsResult.overallBand>=8?"Excellent 🌟":ieltsResult.overallBand>=7?"Good 👍":ieltsResult.overallBand>=6?"Competent 💪":ieltsResult.overallBand>=5?"Modest 📚":"Limited 🔄"}
                        </div>
                        <div style={{fontSize:".78rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif"}}>{ieltsResult.wordCount} words</div>
                      </div>
                    </div>

                    {/* 4 Criteria */}
                    <div style={{fontSize:".7rem",color:"#6a5a7a",letterSpacing:".08em",textTransform:"uppercase",marginBottom:".5rem"}}>📊 Band Score Chi Tiết</div>
                    {[
                      ["taskAchievement","🎯 Task Achievement","Trả lời đúng yêu cầu đề không?"],
                      ["coherenceCohesion","🔗 Coherence & Cohesion","Cấu trúc và liên kết câu/đoạn"],
                      ["lexicalResource","📚 Lexical Resource","Từ vựng phong phú và chính xác"],
                      ["grammaticalRange","⚙️ Grammatical Range","Ngữ pháp đa dạng và chính xác"],
                    ].map(([key,label,desc])=>{
                      const c = ieltsResult.criteria?.[key];
                      if(!c) return null;
                      const col = c.band>=7?"#4ade80":c.band>=6?"#fbbf24":"#f87171";
                      return (
                        <div key={key} className="ielts-criterion">
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".3rem"}}>
                            <div style={{fontSize:".88rem",fontWeight:700,color:"#d4c8f0"}}>{label}</div>
                            <div className="ielts-band" style={{color:col,fontSize:"1.3rem"}}>{c.band}</div>
                          </div>
                          <div style={{fontSize:".65rem",color:"#5a4a6a",marginBottom:".3rem",fontStyle:"italic"}}>{desc}</div>
                          <div style={{fontSize:".85rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>{c.comment}</div>
                        </div>
                      );
                    })}

                    {/* Strengths */}
                    {ieltsResult.strengths?.length>0 && (
                      <div className="ielts-criterion" style={{borderColor:"rgba(74,222,128,.2)",marginTop:".5rem"}}>
                        <div style={{fontSize:".7rem",color:"#4ade80",letterSpacing:".08em",marginBottom:".4rem"}}>✅ ĐIỂM MẠNH</div>
                        {ieltsResult.strengths.map((s,i)=><div key={i} style={{fontSize:".88rem",color:"#86efac",fontFamily:"'Crimson Pro',serif",marginBottom:".2rem"}}>• {s}</div>)}
                      </div>
                    )}

                    {/* Improvements */}
                    {ieltsResult.improvements?.length>0 && (
                      <div className="ielts-criterion" style={{borderColor:"rgba(248,113,113,.2)"}}>
                        <div style={{fontSize:".7rem",color:"#f87171",letterSpacing:".08em",marginBottom:".4rem"}}>📈 CẦN CẢI THIỆN</div>
                        {ieltsResult.improvements.map((s,i)=><div key={i} style={{fontSize:".88rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",marginBottom:".25rem"}}>• {s}</div>)}
                      </div>
                    )}

                    {/* Improved intro */}
                    {ieltsResult.improvedIntro && (
                      <div className="ielts-criterion" style={{borderColor:"rgba(96,165,250,.2)"}}>
                        <div style={{fontSize:".7rem",color:"#60a5fa",letterSpacing:".08em",marginBottom:".4rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                          <span>✨ MỞ BÀI MẪU</span>
                          <button className="spkbtn btn" onClick={()=>speak(ieltsResult.improvedIntro,0.82)}>🔊</button>
                        </div>
                        <div style={{fontSize:".9rem",color:"#93c5fd",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,fontStyle:"italic"}}>
                          {ieltsResult.improvedIntro}
                        </div>
                      </div>
                    )}

                    {/* Key vocab */}
                    {ieltsResult.keyVocab?.length>0 && (
                      <div className="ielts-criterion" style={{borderColor:"rgba(251,191,36,.2)"}}>
                        <div style={{fontSize:".7rem",color:"#fbbf24",letterSpacing:".08em",marginBottom:".5rem"}}>📖 TỪ VỰNG ACADEMIC NÊN DÙNG</div>
                        <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                          {ieltsResult.keyVocab.map((w,i)=>(
                            <span key={i} style={{fontSize:".82rem",color:"#fde68a",background:"rgba(251,191,36,.1)",border:"1px solid rgba(251,191,36,.2)",borderRadius:8,padding:".2rem .65rem",fontFamily:"'Crimson Pro',serif",cursor:"pointer"}}
                              onClick={()=>speak(w,0.75)}>
                              {w}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{display:"flex",gap:".7rem",marginTop:"1rem"}}>
                      <button className="btn" onClick={()=>{setIeltsResult(null);}}
                        style={{flex:1,padding:".82rem",borderRadius:14,background:"rgba(167,139,250,.1)",border:"1.5px solid rgba(167,139,250,.25)",color:"#c4b5fd",fontWeight:700,fontSize:".95rem"}}>
                        ✏️ Viết lại
                      </button>
                      <button className="btn" onClick={()=>{setIeltsResult(null);setIeltsPrompt(null);setIeltsEssay("");}}
                        style={{flex:1,padding:".82rem",borderRadius:14,background:"linear-gradient(135deg,#a78bfa,#818cf8)",color:"white",border:"none",fontWeight:700,fontSize:".95rem"}}>
                        🎯 Đề mới
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* History tab */}
            {ieltsView==="history" && (
              <div>
                {ieltsHistory.length===0 ? (
                  <div style={{textAlign:"center",padding:"3rem 1rem",color:"#5a4a6a"}}>
                    <div style={{fontSize:"3rem",marginBottom:".7rem"}}>🖊</div>
                    <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.1rem",color:"#8a7a9a"}}>Chưa có bài viết nào</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:".72rem",color:"#7a6a8a",marginBottom:".6rem"}}>{ieltsHistory.length} bài đã làm</div>
                    {ieltsHistory.map((h,i)=>(
                      <div key={i} className="journal-card">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".3rem"}}>
                          <div style={{display:"flex",gap:".4rem",flexWrap:"wrap"}}>
                            <span style={{fontSize:".65rem",color:"#a78bfa",background:"rgba(167,139,250,.12)",borderRadius:6,padding:"1px 8px"}}>{h.type}</span>
                            <span style={{fontSize:".65rem",color:"#7a6a8a"}}>{h.topic}</span>
                          </div>
                          <div style={{display:"flex",gap:".6rem",alignItems:"center"}}>
                            <span className="ielts-band" style={{fontSize:"1.2rem",color:h.band>=7?"#4ade80":h.band>=6?"#fbbf24":"#f87171"}}>{h.band}</span>
                            <span style={{fontSize:".65rem",color:"#4a3a5a"}}>{h.date}</span>
                          </div>
                        </div>
                        <div style={{fontSize:".78rem",color:"#5a4a6a",fontFamily:"'Crimson Pro',serif",marginBottom:".3rem",fontStyle:"italic",lineHeight:1.4}}>{h.question?.slice(0,120)}...</div>
                        <div style={{fontSize:".75rem",color:"#4a3a5a"}}>{h.wordCount} words</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* ══ IELTS SPEAKING SIMULATOR ══ */}
        {mode===MODES.IELTS_S && (()=>{

          // ── Shared recording logic (no stale closure — uses refs) ─────────
          const startPartRec = () => {
            if (spkSimListening) { stopGoogleSTT(); return; }
            let secs = 0; spkSimTimerRef.current = 0;
            setSpkSimTimer(0); setSpkSimLiveText("");
            clearInterval(spkSimTimerIv.current);
            spkSimTimerIv.current = setInterval(()=>{ secs++; spkSimTimerRef.current=secs; setSpkSimTimer(secs); }, 1000);

            startGoogleSTT({
              onStart: ()=>setSpkSimListening(true),
              onEnd:   ()=>{ setSpkSimListening(false); clearInterval(spkSimTimerIv.current); },
              onError: ()=>{ setSpkSimListening(false); clearInterval(spkSimTimerIv.current); },
              onResult:(data)=>{
                clearInterval(spkSimTimerIv.current);
                const transcript = data.transcript?.trim()||"(không nghe được)";
                const qIdx = spkSimQIdxRef.current;
                const dur  = spkSimTimerRef.current;
                const q    = spkSimQs[qIdx]||"";
                const entry = {q, answer:transcript, duration:dur};
                setSpkSimAnswers(prev=>{
                  const next=[...prev, entry];
                  // Check if done
                  const totalQs = spkSimPhase==="p2"?1:spkSimQs.length;
                  if(next.length>=totalQs){
                    setTimeout(()=>setSpkSimPhase("review"),300);
                  } else {
                    spkSimQIdxRef.current = qIdx+1;
                    setSpkSimQIdx(qIdx+1);
                  }
                  return next;
                });
              }
            });
          };

          const resetPart = ()=>{ setSpkSimAnswers([]); setSpkSimQIdx(0); spkSimQIdxRef.current=0; setSpkSimResult(null); setSpkSimLiveText(""); setSpkSimTimer(0); };
          const goMenu = ()=>{ resetPart(); setSpkSimPhase("menu"); setSpkSimPartNum(0); };

          const partColor = {p1:"#60a5fa",p2:"#fbbf24",p3:"#a78bfa"};
          const col = partColor[spkSimPhase]||"#a78bfa";

          // ── MENU ─────────────────────────────────────────────────────────
          if(spkSimPhase==="menu") return (
            <div>
              <div style={{background:"linear-gradient(145deg,rgba(96,165,250,.07),rgba(167,139,250,.05))",border:"1px solid rgba(96,165,250,.18)",borderRadius:20,padding:"1.2rem",marginBottom:"1rem"}}>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:"1.2rem",fontWeight:700,color:"#93c5fd",marginBottom:".25rem"}}>🎙 IELTS Speaking Simulator</div>
                <div style={{fontSize:".83rem",color:"#7a8a9a",fontFamily:"'Crimson Pro',serif",lineHeight:1.65}}>Chọn Part muốn luyện. Sau mỗi part AI chấm band score + tips cải thiện riêng.</div>
              </div>

              <div style={{marginBottom:".8rem"}}>
                <div style={{fontSize:".7rem",color:"#6a5a7a",marginBottom:".28rem",letterSpacing:".05em"}}>Chủ đề (để trống = AI tự chọn)</div>
                <input className="fi" placeholder="vd: technology, environment, education..."
                  value={spkSimTopic} onChange={e=>setSpkSimTopic(e.target.value)} />
              </div>

              <div style={{display:"flex",flexDirection:"column",gap:".7rem"}}>
                {[
                  {ph:"p1",num:1,col:"#60a5fa",title:"Part 1 — Introduction",desc:"4 câu hỏi ngắn về bản thân, sở thích, cuộc sống hàng ngày",time:"4-5 phút"},
                  {ph:"p2",num:2,col:"#fbbf24",title:"Part 2 — Individual Long Turn",desc:"Cue card — nói 1-2 phút về 1 chủ đề, có model answer",time:"3-4 phút"},
                  {ph:"p3",num:3,col:"#a78bfa",title:"Part 3 — Discussion",desc:"4 câu hỏi thảo luận sâu, trừu tượng hơn",time:"4-5 phút"},
                ].map(({ph,num,col,title,desc,time})=>(
                  <button key={ph} className="btn" onClick={async()=>{
                    setSpkSimGenLoading(true); resetPart(); setSpkSimPartNum(num);
                    try {
                      const s = await generateSpkScript(spkSimTopic.trim(), apiKey);
                      if(num===1){ setSpkSimQs(s.part1.questions); setSpkSimCueCard(""); }
                      else if(num===2){ setSpkSimQs([s.part2.cueCard]); setSpkSimCueCard(s.part2.cueCard); }
                      else { setSpkSimQs(s.part3.questions); setSpkSimCueCard(""); }
                      setSpkSimPhase(ph);
                    } catch(e){alert("Lỗi: "+e.message);}
                    finally{setSpkSimGenLoading(false);}
                  }} disabled={spkSimGenLoading}
                    style={{padding:"1rem 1.2rem",borderRadius:16,background:`${col}12`,border:`1.5px solid ${col}44`,textAlign:"left",opacity:spkSimGenLoading?0.6:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:col,fontSize:"1rem"}}>{title}</div>
                      <div style={{fontSize:".7rem",color:col+"99",background:col+"18",borderRadius:999,padding:"2px 10px"}}>{time}</div>
                    </div>
                    <div style={{fontSize:".83rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",marginTop:".3rem"}}>{desc}</div>
                  </button>
                ))}
              </div>
              {spkSimGenLoading&&<div style={{marginTop:".8rem"}}>{[80,60,70].map((w,i)=><div key={i} className="shimmer" style={{height:12,borderRadius:6,marginBottom:8,width:`${w}%`}}/>)}</div>}
            </div>
          );

          // ── REVIEW ───────────────────────────────────────────────────────
          if(spkSimPhase==="review") return (
            <div>
              {!spkSimResult ? (
                <div style={{textAlign:"center",padding:"1.5rem"}}>
                  <div style={{fontSize:"3rem",marginBottom:".5rem"}}>🎉</div>
                  <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,fontSize:"1.2rem",color:col,marginBottom:".4rem"}}>Part {spkSimPartNum} hoàn thành!</div>
                  <div style={{fontSize:".85rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif",marginBottom:"1.2rem"}}>{spkSimAnswers.filter(a=>a.answer!=="(bỏ qua)").length} câu đã trả lời</div>
                  <button className="btn" onClick={async()=>{
                    setSpkSimLoading(true);
                    try{
                      const r = await gradeSpkSim(spkSimPartNum, spkSimAnswers, spkSimCueCard, apiKey);
                      setSpkSimResult(r);
                    }catch(e){alert("Lỗi: "+e.message);}
                    finally{setSpkSimLoading(false);}
                  }} disabled={spkSimLoading}
                    style={{padding:".9rem 2rem",borderRadius:14,background:spkSimLoading?`${col}33`:`linear-gradient(135deg,${col},${col}cc)`,color:"white",border:"none",fontWeight:700,fontSize:"1rem"}}>
                    {spkSimLoading?"⏳ AI đang chấm...":"📊 Xem kết quả"}
                  </button>
                  {spkSimLoading&&<div style={{marginTop:".8rem"}}>{[75,55,65,45].map((w,i)=><div key={i} className="shimmer" style={{height:12,borderRadius:6,marginBottom:8,width:`${w}%`}}/>)}</div>}
                </div>
              ) : (
                <div className="fade-in">
                  {/* Band */}
                  <div style={{background:"rgba(0,0,0,.3)",border:`2px solid ${col}44`,borderRadius:20,padding:"1.1rem 1.3rem",marginBottom:"1rem",display:"flex",alignItems:"center",gap:"1rem"}}>
                    <div style={{textAlign:"center",minWidth:72}}>
                      <div className="ielts-band" style={{color:spkSimResult.overallBand>=7?"#4ade80":spkSimResult.overallBand>=6?"#fbbf24":"#f87171",fontSize:"2.5rem",lineHeight:1}}>{spkSimResult.overallBand}</div>
                      <div style={{fontSize:".6rem",color:"#5a4a6a"}}>Band</div>
                    </div>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontWeight:700,color:col}}>Part {spkSimPartNum}</div>
                      <div style={{fontSize:".8rem",color:"#7a6a8a",fontFamily:"'Crimson Pro',serif"}}>
                        {spkSimResult.overallBand>=7?"Good 👍":spkSimResult.overallBand>=6?"Competent 💪":spkSimResult.overallBand>=5?"Modest 📚":"Needs work 🔄"}
                      </div>
                    </div>
                  </div>

                  {/* 4 criteria */}
                  {[["fluencyCoherence","🗣 Fluency & Coherence"],["lexicalResource","📚 Lexical Resource"],["grammaticalRange","⚙️ Grammar Range"],["pronunciation","🔊 Pronunciation"]].map(([k,l])=>{
                    const c=spkSimResult.criteria?.[k]; if(!c) return null;
                    const cc=c.band>=7?"#4ade80":c.band>=6?"#fbbf24":"#f87171";
                    return(
                      <div key={k} className="ielts-criterion">
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".25rem"}}>
                          <div style={{fontSize:".88rem",fontWeight:700,color:"#d4c8f0"}}>{l}</div>
                          <div className="ielts-band" style={{color:cc,fontSize:"1.2rem"}}>{c.band}</div>
                        </div>
                        <div style={{fontSize:".85rem",color:"#a09ab0",fontFamily:"'Crimson Pro',serif",lineHeight:1.6}}>{c.comment}</div>
                      </div>
                    );
                  })}

                  {/* Model answer Part 2 */}
                  {spkSimResult.modelAnswer&&(
                    <div className="ielts-criterion" style={{borderColor:"rgba(251,191,36,.25)"}}>
                      <div style={{fontSize:".7rem",color:"#fbbf24",letterSpacing:".08em",marginBottom:".4rem",display:"flex",justifyContent:"space-between"}}>
                        <span>✨ MODEL ANSWER</span>
                        <button className="spkbtn btn" onClick={()=>speak(spkSimResult.modelAnswer,0.85)}>🔊</button>
                      </div>
                      <div style={{fontSize:".9rem",color:"#fde68a",fontFamily:"'Crimson Pro',serif",lineHeight:1.7,fontStyle:"italic"}}>{spkSimResult.modelAnswer}</div>
                    </div>
                  )}

                  {/* Tips */}
                  {spkSimResult.improvements?.length>0&&(
                    <div className="ielts-criterion" style={{borderColor:"rgba(248,113,113,.2)"}}>
                      <div style={{fontSize:".7rem",color:"#f87171",letterSpacing:".08em",marginBottom:".4rem"}}>📈 3 TIPS CẢI THIỆN</div>
                      {spkSimResult.improvements.map((s,i)=><div key={i} style={{fontSize:".88rem",color:"#fca5a5",fontFamily:"'Crimson Pro',serif",marginBottom:".3rem"}}>• {s}</div>)}
                    </div>
                  )}

                  <div style={{display:"flex",gap:".6rem",marginTop:"1rem"}}>
                    <button className="btn" onClick={()=>{resetPart();setSpkSimPhase("p"+spkSimPartNum);}}
                      style={{flex:1,padding:".8rem",borderRadius:12,background:`${col}18`,border:`1.5px solid ${col}44`,color:col,fontWeight:700}}>🔄 Làm lại</button>
                    <button className="btn" onClick={goMenu}
                      style={{flex:1,padding:".8rem",borderRadius:12,background:"linear-gradient(135deg,#60a5fa,#a78bfa)",color:"white",border:"none",fontWeight:700}}>📋 Chọn Part khác</button>
                  </div>
                </div>
              )}
            </div>
          );

          // ── PARTS 1 & 3 (questions) ───────────────────────────────────────
          if(spkSimPhase==="p1"||spkSimPhase==="p3") {
            const currentQ = spkSimQs[spkSimQIdx]||"";
            return (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
                  <div className="sim-part-badge" style={{background:`${col}18`,border:`1px solid ${col}44`,color:col}}>
                    🎙 {spkSimPhase==="p1"?"Part 1":"Part 3"}
                  </div>
                  <div style={{fontSize:".72rem",color:"#5a4a6a"}}>{spkSimAnswers.length}/{spkSimQs.length} câu</div>
                </div>

                {/* Progress */}
                <div style={{display:"flex",gap:"3px",marginBottom:".8rem"}}>
                  {spkSimQs.map((_,i)=><div key={i} style={{flex:1,height:3,borderRadius:2,transition:"background .3s",
                    background:i<spkSimAnswers.length?"#4ade80":i===spkSimQIdx?col:"rgba(255,255,255,.1)"}}/>)}
                </div>

                {/* Question */}
                <div style={{background:"rgba(0,0,0,.3)",border:`1px solid ${col}33`,borderRadius:16,padding:"1.2rem",marginBottom:"1rem"}}>
                  <div style={{fontSize:".65rem",color:col,letterSpacing:".08em",marginBottom:".5rem"}}>EXAMINER</div>
                  <div style={{fontSize:"1.05rem",fontFamily:"'Crimson Pro',serif",color:"#f0eaff",lineHeight:1.65,fontWeight:600}}>{currentQ}</div>
                  <button className="spkbtn btn" style={{marginTop:".6rem"}} onClick={()=>speak(currentQ,0.88)}>🔊 Nghe câu hỏi</button>
                </div>

                {/* Last answer preview */}
                {spkSimAnswers.length>0&&(
                  <div style={{background:"rgba(255,255,255,.03)",border:"1px solid rgba(255,255,255,.06)",borderRadius:10,padding:".6rem .9rem",marginBottom:".8rem",fontSize:".83rem",fontFamily:"'Crimson Pro',serif",color:"#7a6a8a",fontStyle:"italic"}}>
                    ✍️ "{spkSimAnswers[spkSimAnswers.length-1].answer.slice(0,80)}{spkSimAnswers[spkSimAnswers.length-1].answer.length>80?"...":""}"
                  </div>
                )}

                {/* Mic */}
                <div style={{background:"linear-gradient(145deg,#1a1030,#0e1422)",border:`1px solid ${col}22`,borderRadius:18,padding:"1.2rem",textAlign:"center"}}>
                  {spkSimListening
                    ? <><div className="rec-timer">{spkSimTimer}s</div>
                       <div style={{fontSize:".75rem",color:"#f87171",marginBottom:".5rem"}} className="pulse-rec">🔴 Đang ghi âm</div>
                       {spkSimLiveText&&<div style={{fontSize:".85rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginBottom:".5rem"}}>"{spkSimLiveText}"</div>}</>
                    : <div style={{fontSize:".75rem",color:"#5a4a6a",marginBottom:".6rem",fontFamily:"'Crimson Pro',serif"}}>Nhấn 🎤 và trả lời</div>
                  }
                  <button className={`mic-btn btn ${spkSimListening?"listening":"idle"}`} onClick={startPartRec}>
                    {spkSimListening?"⏹":"🎤"}
                  </button>
                </div>

                <div style={{display:"flex",gap:".5rem",justifyContent:"center",marginTop:".8rem"}}>
                  {!spkSimListening&&(
                    <button className="btn" onClick={()=>{
                      const qIdx=spkSimQIdxRef.current;
                      setSpkSimAnswers(prev=>{
                        const next=[...prev,{q:spkSimQs[qIdx]||"",answer:"(bỏ qua)",duration:0}];
                        if(next.length>=spkSimQs.length) setTimeout(()=>setSpkSimPhase("review"),200);
                        else{spkSimQIdxRef.current=qIdx+1;setSpkSimQIdx(qIdx+1);}
                        return next;
                      });
                    }} style={{padding:".38rem .9rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".78rem"}}>⏭ Bỏ qua</button>
                  )}
                  <button className="btn" onClick={()=>{stopGoogleSTT();goMenu();}}
                    style={{padding:".38rem .9rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".78rem"}}>✕ Thoát</button>
                </div>
              </div>
            );
          }

          // ── PART 2 (cue card) ─────────────────────────────────────────────
          if(spkSimPhase==="p2") return (
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:".7rem"}}>
                <div className="sim-part-badge" style={{background:"#fbbf2418",border:"1px solid #fbbf2444",color:"#fbbf24"}}>🎙 Part 2</div>
                {spkSimAnswers.length===0&&<div style={{fontSize:".72rem",color:"#5a4a6a"}}>Chuẩn bị → Nói 1-2 phút</div>}
              </div>

              <div className="cue-card" style={{marginBottom:"1rem"}}>
                <div style={{fontSize:".7rem",fontWeight:700,letterSpacing:".08em",color:"#713f12",marginBottom:".5rem"}}>📋 TASK CARD</div>
                <div style={{fontSize:".95rem",lineHeight:1.8,whiteSpace:"pre-line",fontFamily:"'Crimson Pro',serif",fontWeight:600}}>
                  {spkSimCueCard}
                </div>
              </div>

              {spkSimAnswers.length===0 ? (
                <div style={{background:"linear-gradient(145deg,#1a1030,#0e1422)",border:"1px solid rgba(251,191,36,.2)",borderRadius:18,padding:"1.2rem",textAlign:"center"}}>
                  {spkSimListening
                    ? <><div className="rec-timer">{spkSimTimer}s</div>
                       <div style={{fontSize:".75rem",color:"#f87171",marginBottom:".5rem"}} className="pulse-rec">🔴 Đang ghi âm — nói tối thiểu 60s</div>
                       {spkSimLiveText&&<div style={{fontSize:".85rem",color:"#c4b5fd",fontFamily:"'Crimson Pro',serif",fontStyle:"italic",marginBottom:".5rem"}}>"{spkSimLiveText}"</div>}</>
                    : <div style={{fontSize:".78rem",color:"#9a8a6a",marginBottom:".6rem",fontFamily:"'Crimson Pro',serif"}}>Đọc cue card → Nhấn 🎤 → Nói 1-2 phút</div>
                  }
                  <button className={`mic-btn btn ${spkSimListening?"listening":"idle"}`} onClick={startPartRec}>
                    {spkSimListening?"⏹":"🎤"}
                  </button>
                </div>
              ) : (
                <div style={{textAlign:"center",padding:"1rem"}}>
                  <div style={{fontSize:"2rem",marginBottom:".3rem"}}>✅</div>
                  <div style={{fontFamily:"'Playfair Display',serif",color:"#4ade80",fontWeight:700}}>Đã ghi âm ({spkSimTimer}s)</div>
                  <button className="btn" onClick={()=>setSpkSimPhase("review")}
                    style={{marginTop:".9rem",padding:".8rem 2rem",borderRadius:12,background:"linear-gradient(135deg,#fbbf24,#f59e0b)",color:"#1a0a00",border:"none",fontWeight:700}}>
                    📊 Xem kết quả
                  </button>
                </div>
              )}

              <div style={{display:"flex",justifyContent:"center",marginTop:".8rem"}}>
                <button className="btn" onClick={()=>{stopGoogleSTT();goMenu();}}
                  style={{padding:".38rem .9rem",borderRadius:10,background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",color:"#5a4a6a",fontSize:".78rem"}}>✕ Thoát</button>
              </div>
            </div>
          );

          return null;
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
