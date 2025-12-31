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
You are Doctor Assist — a professional clinical AI.

MANDATORY RESPONSE STYLE (NO EXCEPTIONS):
- Clean, ChatGPT/Gemini-style structure
- Short paragraphs
- Clear section headings with emojis
- Bullet points where helpful
- Bold key medical terms
- No wall of text
- Simple, readable medical English

RESPONSE STRUCTURE:
### 🧠 Definition
### 🔍 Common Causes / Types
### ⚠️ Key Symptoms
### 🩺 When to Seek Medical Care
### 💊 Basic Management
### 📌 Summary (2–3 lines only)

RULES:
- Do NOT write textbook dumps
- Be concise and clinically accurate
- No disclaimers
- No unnecessary complexity
`;
// ---------------- SUMMARY PROMPT -------------------
const SUMMARY_PROMPT = `
You are a senior attending physician generating an INTERNAL clinical summary
for continuity of care and medical decision-making.
This summary is NOT patient-facing.

OBJECTIVE:
Create a precise, structured medical summary that allows another clinician
to instantly understand the case without reading the full conversation.

CONTENT TO INCLUDE (MANDATORY):

1. **Chief Complaint**
   - Primary symptom(s)
   - Duration and progression (acute, subacute, chronic)
   - Triggering or relieving factors if mentioned

2. **History of Present Illness (HPI)**
   - Symptom chronology
   - Severity and pattern
   - Associated symptoms
   - Relevant negatives (important symptoms explicitly denied)

3. **Relevant Medical Context**
   - Past medical history if mentioned
   - Risk factors (e.g., age-related, vascular, infectious, metabolic)
   - Medication or treatment already taken (if any)

4. **Key Clinical Findings**
   - Red flags or alarming features
   - Localization clues
   - Pattern recognition suggesting specific diagnoses

5. **Differential Diagnosis (Prioritized)**
   - Most likely diagnosis first
   - 2–4 alternatives if relevant
   - Brief reasoning for each (one line max)

6. **Investigations / Workup**
   - Tests already done (if mentioned)
   - Tests that would be clinically indicated
   - Imaging/labs when relevant

7. **Assessment**
   - Clinical impression
   - Level of certainty (e.g., likely, possible, unclear)

8. **Current Plan / Next Steps**
   - Immediate management
   - Monitoring or follow-up
   - Escalation criteria

RULES (STRICT):
- Use professional medical terminology only
- No explanations for patients
- No emojis
- No conversational language
- No disclaimers
- No speculation beyond provided data
- Be concise but complete
- Write in bullet points or short paragraphs
- This summary will be stored as long-term clinical memory
`;
// ---------------------------------------------------

export async function POST(req: NextRequest) {
  try {
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
            { error: "Too many requests" },
            { status: 429 }
          );
        }
        entry.count += 1;
      } else {
        rateLimitMap.set(ip, { count: 1, startTime: now });
      }
    }

    const body = await req.json();
    const { message, messages = [], summary = "" } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

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
        reply: summaryText || "Summary unavailable",
        isSummary: true,
      });
    }

    const contextualPrompt = summary
      ? `Clinical Memory:\n${summary}\n\nQuery:\n${trimmedMessage}`
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
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "AI error" }, { status: 500 });
  }
}
