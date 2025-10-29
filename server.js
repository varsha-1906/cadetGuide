// server.js
// Simple Express server that proxies audio -> OpenAI transcription -> OpenAI chat for feedback.
// Requires: node >= 18, npm install express multer node-fetch open (or openai official lib)
import express from "express";
import multer from "multer";
import fs from "fs";
import fetch from "node-fetch"; // or use 'openai' official SDK (example below uses fetch to be explicit)
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());

// Multer setup to handle audio uploads
const upload = multer({ dest: "uploads/" });

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.error("Set OPENAI_API_KEY in environment.");
  process.exit(1);
}

// Helper: call OpenAI Speech-to-Text (transcription)
// Uses OpenAI's /audio/transcriptions endpoint (Whisper). Adjust if SDK available.
async function transcribeAudio(filePath) {
  const url = "https://api.openai.com/v1/audio/transcriptions";
  const body = new FormData();
  body.append("file", fs.createReadStream(filePath));
  body.append("model", "whisper-1"); // or whichever speech model is current
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Transcription error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  return json.text;
}

// Helper: ask the Chat/Responses API for feedback and a better answer
async function requestFeedback(question, transcript) {
  // Build a deterministic prompt so feedback is useful
  const systemPrompt = `You are a polite, professional military selection officer. 
Given the interview question and the candidate's spoken answer, provide:
1) concise feedback (1-2 sentences) focusing on clarity, confidence, content and structure,
2) a short 'better answer' example (one paragraph).
Return JSON with keys: feedback, betterAnswer. Keep feedback actionable.`;

  const userPrompt = `Question: ${question}
Candidate's Answer: ${transcript}
Please produce JSON only with keys "feedback" and "betterAnswer".`;

  const url = "https://api.openai.com/v1/responses"; // use Responses or chat completion depending on your account
  const payload = {
    model: "gpt-4o-mini", // pick an appropriate model you have access to
    input: `${systemPrompt}\n\n${userPrompt}`,
    max_tokens: 400,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Feedback API error: ${res.status} ${txt}`);
  }
  const json = await res.json();
  // Responses API returns output in different shapes; try to read output_text or output[0].content
  const text =
    (json.output_text && json.output_text.trim()) ||
    (json.output && json.output[0] && (json.output[0].content || json.output[0].text)) ||
    JSON.stringify(json);

  // The model was instructed to return JSON; try parse
  try {
    const parsed = JSON.parse(text);
    return { feedback: parsed.feedback, betterAnswer: parsed.betterAnswer };
  } catch (e) {
    // If not strict JSON, return as plain text fallback
    return { feedback: text.slice(0, 700), betterAnswer: "" };
  }
}

// Route: transcribe audio file
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "No audio uploaded" });
    const transcript = await transcribeAudio(file.path);
    // remove file after use
    fs.unlinkSync(file.path);
    return res.json({ transcript });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Route: get feedback given a question + transcript
app.post("/feedback", async (req, res) => {
  try {
    const { question, transcript } = req.body;
    if (!question || !transcript) return res.status(400).json({ error: "Missing question or transcript" });
    const { feedback, betterAnswer } = await requestFeedback(question, transcript);
    return res.json({ feedback, betterAnswer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

const PORT = process.env.PORT || 5173;
app.listen(PORT, () => console.log(`AI proxy server listening on ${PORT}`));
