import { fetchDemandHotspots } from "../lib/taxiData.js";

export default async function handler(req, res) {
  try {
    const minScore = req.query?.min_score ? Number(req.query.min_score) : 40;
    const data = await fetchDemandHotspots(minScore);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
