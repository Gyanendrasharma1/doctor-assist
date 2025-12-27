import { NextRequest, NextResponse } from "next/server";

// ---------------- RATE LIMIT CONFIG ----------------
const rateLimitMap = new Map<
  string,
  { count: number; startTime: number }
>();

const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 1000;
// ---------------------------------------------------

// ---------------- SYSTEM PROMPT --------------------
const SYSTEM_PROMPT = `
You are an elite, world-class physician, surgeon, and clinical scientist with mastery across all medical domains.

You possess expert-level knowledge of:
- Complete human anatomy
- Physiology and pathophysiology
- Clinical medicine and diagnostics
- Surgery and practical decision-making
- Pharmacology and therapeutics
- Imaging, labs, emergency and critical care
- Evidence-based medicine

You are designed exclusively for qualified medical doctors.

Your role:
- Act as a senior consultant and clinical co-pilot
- Recall patient history across visits
- Analyze disease progression
- Support expert-level clinical reasoning

Tone:
- Senior consultant
- Precise, structured, clinical
`;
// ---------------------------------------------------

// ---------------- SUMMARY PROMPT -------------------
const SUMMARY_PROMPT = `
You are a senior physician creating a concise clinical patient summary.

Create a structured medical summary including:
- Chief complaints and timeline
- Key neurological / systemic findings
- Important investigations discussed
- Clinical reasoning and impressions
- Current status and plan (if mentioned)

Rules:
- Use medical terminology
- Be concise and clinically accurate
- No patient-facing explanations
- No speculation beyond provided data
`;
// ---------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    // ---------- RATE LIMIT ----------
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
    } else {
      if (now - entry.startTime < RATE_WINDOW) {
        if (entry.count >= RATE_LIMIT) {
          return NextResponse.json(
            { error: "Too many requests. Slow down." },
            { status: 429 }
          );
        }
        entry.count += 1;
      } else {
        rateLimitMap.set(ip, { count: 1, startTime: now });
      }
    }
    // --------------------------------

    // ---------- INPUT ----------
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { message, messages = [], summary = "" } = body;

    if (typeof message !== "string") {
      return NextResponse.json({ error: "Message must be string" }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }
    // --------------------------------

    // ---------- SUMMARY COMMAND ----------
    const isSummaryCommand =
      /summarize|summary|patient memory/i.test(trimmedMessage);

    if (isSummaryCommand) {
      const conversationText = messages
        .map((m: any) => `${m.role.toUpperCase()}: ${m.text}`)
        .join("\n");

      const summaryRes = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
          process.env.GEMINI_API_KEY,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: SUMMARY_PROMPT }] },
              { role: "user", parts: [{ text: conversationText }] },
            ],
          }),
        }
      );

      const summaryData = await summaryRes.json();
      const summaryText =
        summaryData?.candidates?.[0]?.content?.parts?.[0]?.text;

      return NextResponse.json({
        reply: summaryText || "Unable to generate summary",
        isSummary: true,
      });
    }
    // ------------------------------------

    // ---------- NORMAL CHAT (WITH MEMORY) ----------
    const contextualPrompt = summary
      ? `Patient Clinical Memory:\n${summary}\n\nDoctor Query:\n${trimmedMessage}`
      : trimmedMessage;

    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
        process.env.GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            { role: "user", parts: [{ text: contextualPrompt }] },
          ],
        }),
      }
    );

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ reply: text || "No response" });
    // ------------------------------------
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
