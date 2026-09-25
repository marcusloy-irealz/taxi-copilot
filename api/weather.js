import { fetchWeatherForecast } from "../lib/taxiData.js";

export default async function handler(req, res) {
  try {
    const area = req.query?.area || req.body?.area || "";
    const data = await fetchWeatherForecast(area);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
