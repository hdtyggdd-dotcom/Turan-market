import { Router } from "express";
import { countries, regions, districts, neighborhoods } from "../data/store.js";

const router = Router();

// Haversine distance (km)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ISO country_code → our country IDs
const ISO_MAP: Record<string, string> = {
  uz: 'uz', kz: 'kz', kg: 'kg', tj: 'tj',
  tm: 'tm', af: 'af', ru: 'ru', cn: 'cn',
};

// GET /locations/countries
router.get("/locations/countries", (_req, res) => {
  res.json(countries);
});

// GET /locations/regions?countryId=uz
router.get("/locations/regions", (req, res) => {
  const { countryId } = req.query as { countryId?: string };
  const result = countryId
    ? regions.filter((r) => r.countryId === countryId)
    : regions;
  res.json(result);
});

// GET /locations/districts?regionId=r1
router.get("/locations/districts", (req, res) => {
  const { regionId } = req.query as { regionId?: string };
  const result = regionId
    ? districts.filter((d) => d.regionId === regionId)
    : districts;
  res.json(result);
});

// GET /locations/neighborhoods?districtId=d1
router.get("/locations/neighborhoods", (req, res) => {
  const { districtId } = req.query as { districtId?: string };
  const result = districtId
    ? neighborhoods.filter((n) => n.districtId === districtId)
    : neighborhoods;
  res.json(result);
});

// POST /locations/detect  { lat, lng }
// Calls Nominatim → finds country → finds nearest region
router.post("/locations/detect", async (req, res) => {
  const { lat, lng } = req.body as { lat?: number; lng?: number };
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    res.status(400).json({ error: 'lat and lng required' });
    return;
  }

  try {
    // Reverse geocode via Nominatim
    const nominatim = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { 'User-Agent': 'OSavdo/1.0 (osavdo.uz)' } }
    );
    const geo = await nominatim.json() as { address?: { country_code?: string } };
    const isoCode = geo?.address?.country_code?.toLowerCase() ?? '';
    const countryId = ISO_MAP[isoCode] ?? null;

    if (!countryId) {
      res.status(422).json({ error: 'unsupported_country', isoCode });
      return;
    }

    // Find nearest region in that country
    const countryRegions = regions.filter(r => r.countryId === countryId);
    let nearest = countryRegions[0];
    let minDist = Infinity;
    for (const r of countryRegions) {
      const d = haversine(lat, lng, r.lat, r.lng);
      if (d < minDist) { minDist = d; nearest = r; }
    }

    const country = countries.find(c => c.id === countryId)!;
    res.json({
      countryId,
      countryName: country.name,
      countryFlag: country.flag,
      dialCode: country.dialCode,
      currency: country.currency,
      regionId: nearest.id,
      regionName: nearest.name,
      distanceKm: Math.round(minDist),
    });
  } catch {
    res.status(500).json({ error: 'geocoding_failed' });
  }
});

export default router;
