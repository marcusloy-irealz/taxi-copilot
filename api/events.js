import { fetchMajorEvents } from "../lib/taxiData.js";

export default async function handler(req, res) {
  try {
    const category = req.query?.category || req.body?.category || "all";
    const data = await fetchMajorEvents(category);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
