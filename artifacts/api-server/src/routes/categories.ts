import { Router } from "express";
import { categories } from "../data/store.js";

const router = Router();

// GET /categories
router.get("/categories", (_req, res) => {
  res.json(categories);
});

export default router;
