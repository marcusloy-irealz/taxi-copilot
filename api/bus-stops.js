import { fetchCrowdedBusStops } from "../lib/taxiData.js";

export default async function handler(req, res) {
  try {
    const region = req.query?.region || req.body?.region || "all";
    const minCrowd = req.query?.min_crowd || req.body?.min_crowd || "all";
    const data = await fetchCrowdedBusStops(region, minCrowd);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
