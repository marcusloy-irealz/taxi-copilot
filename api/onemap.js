import { searchOneMap } from "../lib/taxiData.js";

export default async function handler(req, res) {
  try {
    const query = req.query?.query || req.body?.query || "";
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const data = await searchOneMap(query);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
