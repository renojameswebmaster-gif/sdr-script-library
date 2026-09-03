import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || "https://renojameswebmaster-gif.github.io";
const requestLog = new Map();
const windowMs = 60 * 1000;
const maxRequests = 10;

app.use(cors({
  origin: frontendUrl,
  methods: ["GET", "POST"],
  allowedHeaders: ["content-type"]
}));
app.use(express.json({ limit: "10kb" }));

function isRateLimited(ip) {
  const now = Date.now();
  const recentRequests = (requestLog.get(ip) || []).filter((timestamp) => now - timestamp < windowMs);
  recentRequests.push(now);
  requestLog.set(ip, recentRequests);
  return recentRequests.length > maxRequests;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "sdr-script-library-ai" });
});

app.post("/api/chat", async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "Too many searches. Please try again in a minute." });
  }

  const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
  if (!question) return res.status(400).json({ error: "A question is required." });
  if (question.length > 1200) return res.status(400).json({ error: "Question is too long." });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: "AI search is not configured yet." });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        tools: [{ type: "web_search_preview" }],
        input: [
          {
            role: "system",
            content: "You are the public web research assistant for an SDR script library. Search the web when useful, answer clearly and briefly, distinguish facts from uncertainty, and include source names or links when available. Do not request or reveal private credentials or sensitive personal data."
          },
          { role: "user", content: question }
        ],
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("OpenAI request failed", response.status, data.error?.message || data);
      return res.status(502).json({ error: "The AI search service is temporarily unavailable." });
    }

    const answer = data.output_text?.trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty answer." });
    return res.json({ answer });
  } catch (error) {
    console.error("AI search error", error);
    return res.status(500).json({ error: "The AI search service is temporarily unavailable." });
  }
});

app.listen(port, () => {
  console.log(`SDR AI server listening on port ${port}`);
});
