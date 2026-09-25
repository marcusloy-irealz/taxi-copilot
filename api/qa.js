import { processMcpQuestionAndAnswer } from "../lib/mcpServers.js";

export default async function handler(req, res) {
  try {
    const question = req.body?.question || req.query?.question;
    const location = req.body?.location || req.body?.driver_current_location || req.query?.location || "";
    if (!question) {
      return res.status(400).json({ error: "question field is required" });
    }
    const data = await processMcpQuestionAndAnswer(question, location);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

