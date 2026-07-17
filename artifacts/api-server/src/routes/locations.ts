import { Router } from "express";
import { regions, districts, neighborhoods } from "../data/store.js";

const router = Router();

// GET /locations/regions
router.get("/locations/regions", (_req, res) => {
  res.json(regions);
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

export default router;
